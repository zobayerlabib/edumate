import hashlib
import random
from datetime import datetime, timedelta
from fastapi import Header
from typing import Optional
from fastapi import Request

from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User

router = APIRouter(prefix="/auth", tags=["auth"])

# TODO: move this to .env later before final submission
SECRET_KEY = "CHANGE_ME_LATER"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# DB session helper – we’ll reuse this in other routes later
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Request bodies from frontend
class RegisterReq(BaseModel):
    email: str
    password: str
    role: str  # student / teacher / admin

class LoginReq(BaseModel):
    email: str
    password: str

class ForgotPasswordReq(BaseModel):
    email: str

class ResetPasswordReq(BaseModel):
    email: str
    otp: str
    new_password: str

# bcrypt has a 72-byte limit, so we normalize first to avoid errors
def _pre_hash(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def hash_password(password: str) -> str:
    return pwd_context.hash(_pre_hash(password))

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(_pre_hash(password), hashed)

# JWT creation – frontend will store this token
def create_access_token(email: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": email, "role": role, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# -------- AUTH ROUTES --------

@router.post("/register")
def register(data: RegisterReq, db: Session = Depends(get_db)):
    # basic role validation (can be improved later)
    if data.role not in ["student", "teacher", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    # check if user already exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    # create new user
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "Registered successfully"}

@router.post("/login")
def login(data: LoginReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.email, user.role)
    return {"access_token": token, "token_type": "bearer", "role": user.role}

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    # generate 6-digit OTP
    otp = str(random.randint(100000, 999999))

    # OTP expires in 10 minutes
    user.reset_otp = otp
    user.reset_otp_expiry = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    # for demo: return otp here (later we can send it via email)
    return {"message": "OTP generated", "otp": otp}

@router.post("/reset-password")
def reset_password(data: ResetPasswordReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    if not user.reset_otp or not user.reset_otp_expiry:
        raise HTTPException(status_code=400, detail="No OTP request found")

    # check expiry
    if datetime.utcnow() > user.reset_otp_expiry:
        raise HTTPException(status_code=400, detail="OTP expired")

    # check otp match
    if data.otp != user.reset_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # update password
    user.hashed_password = hash_password(data.new_password)

    # clear otp so it can’t be reused
    user.reset_otp = None
    user.reset_otp_expiry = None

    db.commit()

    return {"message": "Password reset successful"}

@router.get("/me")
def me(request: Request):
    # works with Swagger + curl + frontend
    authorization = request.headers.get("Authorization") or request.headers.get("authorization")

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.split(" ", 1)[1].strip()

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"email": payload["sub"], "role": payload["role"]}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
