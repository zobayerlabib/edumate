from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import Base, engine
from auth import router as auth_router
from courses import router as courses_router
from lessons import router as lessons_router
from quizzes import router as quizzes_router
from attempts import router as attempts_router
from ai.gemini_chat import router as gemini_router
from admin import router as admin_router
from billing import router as billing_router
from teacher_progress import router as teacher_progress_router

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def home():
    return {"message": "EduMate Backend Running"}


app.include_router(auth_router)
app.include_router(gemini_router)
app.include_router(courses_router)
app.include_router(lessons_router)
app.include_router(quizzes_router)
app.include_router(attempts_router)
app.include_router(admin_router)
app.include_router(billing_router)
app.include_router(teacher_progress_router)
