from fastapi import APIRouter

router = APIRouter(prefix="/ai", tags=["ai"])

@router.get("/ping")
def ping():
    return {"status": "ok", "message": "AI router is working"}
