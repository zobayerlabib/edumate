from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from auth import router as auth_router
# from ai.router import router as ai_router
from courses import router as courses_router
from lessons import router as lessons_router 
from quizzes import router as quizzes_router
from attempts import router as attempts_router

app = FastAPI()

# Create tables (safe: only creates missing tables)
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "EduMate Backend Running"}

# Routers
app.include_router(auth_router)
#app.include_router(ai_router)
app.include_router(courses_router)
app.include_router(lessons_router)   
app.include_router(quizzes_router)
app.include_router(attempts_router)
