import hashlib
import random
from datetime import datetime, timedelta
from fastapi import Request

from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User

router = APIRouter(prefix="/auth", tags=["auth"])

# These should be moved to .env later for security
SECRET_KEY = "CHANGE_ME_LATER"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_db():
    # Opens a database session for each request, then closes it safely
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class RegisterReq(BaseModel):
    email: str
    password: str
    role: str


class LoginReq(BaseModel):
    email: str
    password: str


class ForgotPasswordReq(BaseModel):
    email: str


class ResetPasswordReq(BaseModel):
    email: str
    otp: str
    new_password: str


def _pre_hash(password: str) -> str:
    # bcrypt has a 72-byte limit; pre-hashing prevents errors for long passwords
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    return pwd_context.hash(_pre_hash(password))


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(_pre_hash(password), hashed)


def create_access_token(email: str, role: str) -> str:
    # JWT stores email (sub) and role, with expiry
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": email, "role": role, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _get_bearer_token(request: Request) -> str:
    # Reads token from Authorization: Bearer <token>
    authorization = request.headers.get("Authorization") or request.headers.get("authorization")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    return authorization.split(" ", 1)[1].strip()


def _decode_token(token: str) -> dict:
    # Validates and decodes JWT token
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/register")
def register(data: RegisterReq, db: Session = Depends(get_db)):
    # Basic role validation
    if data.role not in ["student", "teacher", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    # Prevent duplicate accounts
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    # New users default to free plan based on model default
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "Registered successfully"}


@router.post("/login")
def login(data: LoginReq, db: Session = Depends(get_db)):
    # Checks user exists and password matches
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.email, user.role)

    # Returning plan helps frontend show Freeo rPremium immediately after login
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "plan": getattr(user, "plan", "free"),
        "premium_until": user.premium_until.isoformat() if getattr(user, "premium_until", None) else None,
    }


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordReq, db: Session = Depends(get_db)):
    # Demo OTP flow (later can be replaced with email sending)
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    otp = str(random.randint(100000, 999999))
    user.reset_otp = otp
    user.reset_otp_expiry = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    # Returning OTP is only for demo/testing
    return {"message": "OTP generated", "otp": otp}


@router.post("/reset-password")
def reset_password(data: ResetPasswordReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    if not user.reset_otp or not user.reset_otp_expiry:
        raise HTTPException(status_code=400, detail="No OTP request found")

    if datetime.utcnow() > user.reset_otp_expiry:
        raise HTTPException(status_code=400, detail="OTP expired")

    if data.otp != user.reset_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user.hashed_password = hash_password(data.new_password)
    user.reset_otp = None
    user.reset_otp_expiry = None
    db.commit()

    return {"message": "Password reset successful"}


@router.get("/me")
def me(request: Request, db: Session = Depends(get_db)):
    # Uses token email to load the latest user data from DB (plan can change over time)
    token = _get_bearer_token(request)
    payload = _decode_token(token)

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "email": user.email,
        "role": user.role,
        "plan": getattr(user, "plan", "free"),
        "premium_until": user.premium_until.isoformat() if getattr(user, "premium_until", None) else None,
    }


@router.post("/upgrade")
def upgrade(request: Request, db: Session = Depends(get_db)):
    # Demo upgrade endpoint without payment
    # Later this should be triggered only after payment confirmation (Stripe webhook)
    token = _get_bearer_token(request)
    payload = _decode_token(token)

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.plan = "premium"
    user.premium_until = datetime.utcnow() + timedelta(days=30)
    db.commit()

    return {
        "message": "Upgraded to premium",
        "plan": user.plan,
        "premium_until": user.premium_until.isoformat() if user.premium_until else None,
    }


@router.post("/downgrade")
def downgrade(request: Request, db: Session = Depends(get_db)):
    # Demo downgrade endpoint
    token = _get_bearer_token(request)
    payload = _decode_token(token)

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.plan = "free"
    user.premium_until = None
    db.commit()

    return {"message": "Downgraded to free", "plan": user.plan, "premium_until": None}
