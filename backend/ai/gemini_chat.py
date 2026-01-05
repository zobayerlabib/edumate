# gemini_chat.py
import os
import tempfile
from io import BytesIO
from pathlib import Path
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User

# Optional libs 
try:
    from PIL import Image  
except Exception:
    Image = None

try:
    from docx import Document  
except Exception:
    Document = None


# ENV
env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(env_path)

router = APIRouter(prefix="/ai", tags=["AI"])

API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

# models
FREE_MODEL = os.getenv("GEMINI_FREE_MODEL", "gemini-2.0-flash")
PREMIUM_MODEL = os.getenv("GEMINI_PREMIUM_MODEL", "gemini-3-flash-preview")

#Secrect key
SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_ME_LATER")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

class ChatRequest(BaseModel):
    message: str


# DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# AUTH HELPERS
def _get_bearer_token(request: Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
    if not auth_header:
        return None
    parts = auth_header.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None


def get_current_user_email(request: Request) -> str:
    token = _get_bearer_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Missing Authorization Bearer token")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub") or payload.get("email")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token: no email")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def is_premium_user(user: Optional[User]) -> bool:
    if not user:
        return False

    # expected: user.plan in ("free", "premium")
    if getattr(user, "plan", "free") != "premium":
        return False

    premium_until = getattr(user, "premium_until", None)
    if premium_until is None:
        return True

    # premium_until is usually stored as UTC datetime
    return premium_until > datetime.utcnow()


# TEXT CHAT
@router.post("/chat")
def chat(req: ChatRequest, request: Request, db: Session = Depends(get_db)):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set in backend/.env")

    msg = (req.message or "").strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Message is empty")

    email = get_current_user_email(request)
    user = db.query(User).filter(User.email == email).first()
    premium = is_premium_user(user)

    model_name = PREMIUM_MODEL if premium else FREE_MODEL
    max_tokens = 2048 if premium else 1024

    prompt = (
        "You are EduMate AI Tutor.\n"
        "Answer clearly and step-by-step.\n"
        "Use simple language.\n\n"
        f"Student message: {msg}"
    )

    try:
        model = genai.GenerativeModel(model_name)
        result = model.generate_content(
            prompt,
            generation_config={"max_output_tokens": max_tokens},
        )
        return {
            "reply": (result.text or "").strip(),
            "plan": "premium" if premium else "free",
            "model": model_name,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# FILE CHAT (PDF/IMAGE/DOCX/TEXT)
@router.post("/chat-file")
async def chat_file(
    request: Request,
    db: Session = Depends(get_db),
    message: str = Form(""),
    file: UploadFile = File(...),
):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set in backend/.env")

    msg = (message or "").strip() or "Please help me with this file."

    # Auth + premium
    email = get_current_user_email(request)
    user = db.query(User).filter(User.email == email).first()
    premium = is_premium_user(user)

    model_name = PREMIUM_MODEL if premium else FREE_MODEL
    max_tokens = 2048 if premium else 1024
    model = genai.GenerativeModel(model_name)

    prompt = (
        "You are EduMate AI Tutor.\n"
        "Use the attached file as context.\n"
        "If it's a document, summarize key points and answer the student's question.\n"
        "If they ask you about the creator of edumat then mentioned Zobayer & Mahamat\n"
        "If it's an image, describe what you see and answer the student's question.\n\n"
        f"Student question: {msg}"
    )

    filename = (file.filename or "").lower()
    content_type = (file.content_type or "").lower()

    # Read once
    raw = await file.read()

    # Size limit (10MB)
    if len(raw) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Max 10MB.")

    try:
        # 1) IMAGES
        if content_type in ("image/png", "image/jpeg", "image/jpg") or filename.endswith((".png", ".jpg", ".jpeg")):
            if Image is not None:
                img = Image.open(BytesIO(raw)).convert("RGB")
                result = model.generate_content(
                    [prompt, img],
                    generation_config={"max_output_tokens": max_tokens},
                )
                return {"reply": (result.text or "").strip(), "plan": "premium" if premium else "free", "model": model_name}

            # Fallback: upload image as file
            with tempfile.NamedTemporaryFile(delete=False, suffix=Path(filename).suffix or ".jpg") as tmp:
                tmp.write(raw)
                tmp_path = tmp.name
            try:
                gfile = genai.upload_file(tmp_path)
                result = model.generate_content(
                    [prompt, gfile],
                    generation_config={"max_output_tokens": max_tokens},
                )
                return {"reply": (result.text or "").strip(), "plan": "premium" if premium else "free", "model": model_name}
            finally:
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass

        # 2) PDF
        if content_type == "application/pdf" or filename.endswith(".pdf"):
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(raw)
                tmp_path = tmp.name

            try:
                gfile = genai.upload_file(tmp_path)
                result = model.generate_content(
                    [prompt, gfile],
                    generation_config={"max_output_tokens": max_tokens},
                )
                return {"reply": (result.text or "").strip(), "plan": "premium" if premium else "free", "model": model_name}
            finally:
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass

        # 3) DOCX
        if filename.endswith(".docx") or content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            if Document is None:
                raise HTTPException(status_code=400, detail="DOCX support missing. Install: pip install python-docx")

            doc = Document(BytesIO(raw))
            extracted = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
            if not extracted.strip():
                raise HTTPException(status_code=400, detail="DOCX has no readable text.")

            full_prompt = prompt + "\n\n--- DOCX CONTENT ---\n" + extracted[:12000]
            result = model.generate_content(
                full_prompt,
                generation_config={"max_output_tokens": max_tokens},
            )
            return {"reply": (result.text or "").strip(), "plan": "premium" if premium else "free", "model": model_name}

        # 4) TEXT / MARKDOWN
        if content_type.startswith("text/") or filename.endswith((".txt", ".md")):
            extracted = raw.decode("utf-8", errors="ignore")
            full_prompt = prompt + "\n\n--- FILE CONTENT ---\n" + extracted[:12000]
            result = model.generate_content(
                full_prompt,
                generation_config={"max_output_tokens": max_tokens},
            )
            return {"reply": (result.text or "").strip(), "plan": "premium" if premium else "free", "model": model_name}

        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, PNG/JPG, TXT/MD, or DOCX.")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
