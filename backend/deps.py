from fastapi import Depends, HTTPException, Request
from jose import JWTError, jwt
from sqlalchemy.orm import Session

import auth  # reuse SECRET_KEY + ALGORITHM
from database import SessionLocal


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = auth_header.split(" ", 1)[1].strip()

    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    email = payload.get("sub")
    role = payload.get("role")

    if not email or not role:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    return {"email": email, "role": role}


def require_role(role: str):
    def _inner(user=Depends(get_current_user)):
        # admin can access all protected routes
        if user["role"] == "admin":
            return user

        if user["role"] != role:
            raise HTTPException(status_code=403, detail=f"Forbidden: {role} only")
        return user

    return _inner
