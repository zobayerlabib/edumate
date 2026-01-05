import os
from pathlib import Path
from datetime import datetime, timedelta

import stripe
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from deps import get_db, get_current_user
from models import User

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path)

router = APIRouter(prefix="/billing", tags=["billing"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
PRICE_ID_MONTH = os.getenv("STRIPE_PRICE_ID_MONTH")
PRICE_ID_YEAR = os.getenv("STRIPE_PRICE_ID_YEAR")


class CheckoutReq(BaseModel):
    interval: str = "month"


def _is_premium(u: User) -> bool:
    if not u:
        return False
    if getattr(u, "plan", "free") != "premium":
        return False
    until = getattr(u, "premium_until", None)
    if until is None:
        return True
    return until > datetime.utcnow()


@router.get("/status")
def billing_status(db: Session = Depends(get_db), user=Depends(get_current_user)):
    u = db.query(User).filter(User.email == user["email"]).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "plan": getattr(u, "plan", "free"),
        "premium_until": u.premium_until.isoformat() if getattr(u, "premium_until", None) else None,
        "is_premium": _is_premium(u),
    }


@router.post("/create-checkout-session")
def create_checkout_session(
    data: CheckoutReq,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="STRIPE_SECRET_KEY not set in backend/.env")

    interval = (data.interval or "month").lower()
    if interval not in ["month", "year"]:
        raise HTTPException(status_code=400, detail="Invalid interval")

    price_id = PRICE_ID_MONTH if interval == "month" else PRICE_ID_YEAR
    if not price_id:
        raise HTTPException(status_code=500, detail="Stripe price id not set in backend/.env")

    u = db.query(User).filter(User.email == user["email"]).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    success_url = f"{FRONTEND_URL}/student?checkout=success"
    cancel_url = f"{FRONTEND_URL}/student?checkout=cancel"

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=u.email,
            metadata={
                "user_email": u.email,
                "interval": interval,
            },
        )
        return {"checkout_url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="STRIPE_WEBHOOK_SECRET not set in backend/.env")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook signature error: {str(e)}")

    event_type = event.get("type")

    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        meta = session.get("metadata") or {}
        email = meta.get("user_email")
        interval = (meta.get("interval") or "month").lower()

        if email:
            u = db.query(User).filter(User.email == email).first()
            if u:
                u.plan = "premium"
                if interval == "year":
                    u.premium_until = datetime.utcnow() + timedelta(days=365)
                else:
                    u.premium_until = datetime.utcnow() + timedelta(days=30)
                db.commit()

    return {"status": "ok"}


@router.post("/dev-upgrade")
def dev_upgrade(db: Session = Depends(get_db), user=Depends(get_current_user)):
    u = db.query(User).filter(User.email == user["email"]).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    u.plan = "premium"
    u.premium_until = datetime.utcnow() + timedelta(days=30)
    db.commit()

    return {
        "message": "Dev upgrade applied",
        "plan": u.plan,
        "premium_until": u.premium_until.isoformat() if u.premium_until else None,
    }


@router.post("/dev-downgrade")
def dev_downgrade(db: Session = Depends(get_db), user=Depends(get_current_user)):
    u = db.query(User).filter(User.email == user["email"]).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    u.plan = "free"
    u.premium_until = None
    db.commit()

    return {"message": "Dev downgrade applied", "plan": u.plan, "premium_until": None}
