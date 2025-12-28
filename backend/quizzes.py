from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import json
import random
import re

from deps import get_db, require_role, get_current_user
from models import Course, Lesson, Quiz, Enrollment

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


class QuizGenerateReq(BaseModel):
    num_questions: int = 5
    difficulty: str = "easy"  # easy/medium/hard


def extract_keywords(text: str, k: int = 12):
    words = re.findall(r"[A-Za-z]{4,}", text.lower())
    stop = {"this", "that", "with", "from", "have", "will", "your", "into", "about", "they", "them", "than", "then", "also"}
    words = [w for w in words if w not in stop]
    uniq = []
    for w in words:
        if w not in uniq:
            uniq.append(w)
    random.shuffle(uniq)
    return uniq[:k] if uniq else ["concept", "example", "practice", "method", "result"]


def generate_mcqs(lesson_text: str, n: int):
    keys = extract_keywords(lesson_text, k=max(12, n + 3))
    questions = []
    for i in range(n):
        answer = keys[i % len(keys)]
        distractors = random.sample(keys, min(3, len(keys)))
        options = list(set([answer] + distractors))
        while len(options) < 4:
            options.append(f"option{len(options)+1}")
        options = options[:4]
        random.shuffle(options)

        questions.append({
            "question": f"Which keyword is most related to this lesson? (Q{i+1})",
            "options": options,
            "answer": answer,
            "explanation": f"'{answer}' is a key term found in the lesson."
        })
    return questions


@router.post("/generate/{lesson_id}")
def generate_quiz_from_lesson(
    lesson_id: int,
    data: QuizGenerateReq,
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course = db.query(Course).filter(Course.id == lesson.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Teacher must own the course
    if course.teacher_email != user["email"]:
        raise HTTPException(status_code=403, detail="Not your course")

    questions = generate_mcqs(lesson.content_text, data.num_questions)

    quiz = Quiz(
        lesson_id=lesson_id,
        difficulty=data.difficulty,
        questions_json=json.dumps(questions)
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    return {
        "quiz_id": quiz.id,
        "lesson_id": lesson_id,
        "difficulty": quiz.difficulty,
        "questions": questions
    }


# ✅ NEW: list quizzes for a lesson (frontend needs this)
@router.get("/lesson/{lesson_id}")
def list_quizzes_for_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course = db.query(Course).filter(Course.id == lesson.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Access: owner teacher OR enrolled student
    if user["role"] == "teacher":
        if course.teacher_email != user["email"]:
            raise HTTPException(status_code=403, detail="Not your course")
    elif user["role"] == "student":
        enrolled = db.query(Enrollment).filter(
            Enrollment.course_id == course.id,
            Enrollment.student_email == user["email"]
        ).first()
        if not enrolled:
            raise HTTPException(status_code=403, detail="You are not enrolled in this course")
    else:
        raise HTTPException(status_code=403, detail="Forbidden")

    quizzes = db.query(Quiz).filter(Quiz.lesson_id == lesson_id).all()

    return {
        "lesson_id": lesson_id,
        "quizzes": [{"quiz_id": q.id, "difficulty": q.difficulty, "created_at": str(q.created_at)} for q in quizzes]
    }


@router.get("/{quiz_id}")
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    lesson = db.query(Lesson).filter(Lesson.id == quiz.lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course = db.query(Course).filter(Course.id == lesson.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Access:
    # - owner teacher OR enrolled student
    if user["role"] == "teacher":
        if course.teacher_email != user["email"]:
            raise HTTPException(status_code=403, detail="Not your course")
    elif user["role"] == "student":
        enrolled = db.query(Enrollment).filter(
            Enrollment.course_id == course.id,
            Enrollment.student_email == user["email"]
        ).first()
        if not enrolled:
            raise HTTPException(status_code=403, detail="You are not enrolled in this course")
    else:
        raise HTTPException(status_code=403, detail="Forbidden")

    return {
        "quiz_id": quiz.id,
        "lesson_id": quiz.lesson_id,
        "difficulty": quiz.difficulty,
        "questions": json.loads(quiz.questions_json)
    }
