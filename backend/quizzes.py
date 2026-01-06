from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text as sql_text
import json
import os
import re
from pathlib import Path
from typing import List, Optional
from datetime import datetime

from dotenv import load_dotenv
import google.generativeai as genai

from deps import get_db, require_role, get_current_user
from models import Course, Lesson, Quiz, Enrollment, User

router = APIRouter(prefix="/quizzes", tags=["quizzes"])

# =========================================================
# Gemini setup (same env pattern as gemini_chat.py)
# =========================================================
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path, override=True)

API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

FREE_MODEL = os.getenv("GEMINI_FREE_MODEL", "gemini-2.0-flash")
PREMIUM_MODEL = os.getenv("GEMINI_PREMIUM_MODEL", "gemini-3-flash-preview")

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")


def is_premium_user(user: Optional[User]) -> bool:
    """Keep same logic style as gemini_chat.py: premium if plan == premium and premium_until not expired."""
    if not user:
        return False
    if getattr(user, "plan", "free") != "premium":
        return False
    premium_until = getattr(user, "premium_until", None)
    if premium_until is None:
        return True
    try:
        return premium_until > datetime.utcnow()
    except Exception:
        return False


def pick_model(user: Optional[User]) -> str:
    return PREMIUM_MODEL if is_premium_user(user) else FREE_MODEL


def extract_json_array(text: str):
    """
    Gemini sometimes returns extra text. We safely extract the first JSON array.
    """
    if not text:
        raise ValueError("Empty AI response")

    t = text.strip()

    # remove code fences if any
    t = re.sub(r"```(?:json)?", "", t, flags=re.IGNORECASE).replace("```", "").strip()

    # 1) direct parse
    try:
        obj = json.loads(t)
        if isinstance(obj, list):
            return obj
    except Exception:
        pass

    # 2) extract substring between first [ and last ]
    l = t.find("[")
    r = t.rfind("]")
    if l != -1 and r != -1 and r > l:
        sub = t[l : r + 1]
        obj = json.loads(sub)
        if isinstance(obj, list):
            return obj

    raise ValueError("Could not parse JSON array from AI response")


def normalize_questions(raw_list, limit: int):
    """
    Enforce format:
      [
        {question:str, options:[4], answer:str, explanation:str}
      ]
    """
    cleaned = []
    for item in raw_list:
        if not isinstance(item, dict):
            continue

        q = str(item.get("question", "")).strip()
        opts = item.get("options", [])
        ans = str(item.get("answer", "")).strip()
        exp = str(item.get("explanation", "")).strip()

        if not q:
            continue
        if not isinstance(opts, list):
            continue

        opts = [str(x).strip() for x in opts if str(x).strip()]

        # force exactly 4 options
        if len(opts) < 4:
            while len(opts) < 4:
                opts.append("None of the above")
        if len(opts) > 4:
            opts = opts[:4]

        # answer must match one option
        if ans not in opts:
            lowered = {o.lower(): o for o in opts}
            if ans.lower() in lowered:
                ans = lowered[ans.lower()]
            else:
                ans = opts[0]

        cleaned.append(
            {
                "question": q,
                "options": opts,
                "answer": ans,
                "explanation": exp or "Explanation not provided.",
            }
        )

        if len(cleaned) >= limit:
            break

    if not cleaned:
        raise ValueError("AI returned no valid questions.")
    return cleaned


def get_lesson_context_for_gemini(lesson: Lesson):
    """
    Prefer lesson.content_text.
    If empty but attachment exists (PDF/JPG/PNG), load from uploads/ and pass to Gemini too.
    """
    text_part = (lesson.content_text or "").strip()
    gemini_file = None

    if not text_part and getattr(lesson, "attachment_url", None):
        url = (lesson.attachment_url or "").strip()
        filename = url.split("/")[-1] if "/" in url else url
        local_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(local_path) and API_KEY:
            try:
                gemini_file = genai.upload_file(local_path)
            except Exception:
                gemini_file = None

    return text_part, gemini_file


def gemini_generate_mcq(
    db: Session,
    teacher_email: str,
    lesson: Lesson,
    course: Course,
    difficulty: str,
    num_questions: int,
):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set in backend/.env")

    # limits
    num_questions = max(1, min(20, int(num_questions or 5)))

    teacher = db.query(User).filter(User.email == teacher_email).first()
    premium = is_premium_user(teacher)
    if not premium and num_questions > 10:
        raise HTTPException(status_code=403, detail="Free plan can generate up to 10 questions. Premium up to 20.")

    lesson_text, gemini_file = get_lesson_context_for_gemini(lesson)

    if not lesson_text and not gemini_file:
        raise HTTPException(
            status_code=400,
            detail="This lesson has no text content and no readable attachment. Add lesson text or upload a PDF/image.",
        )

    model_name = pick_model(teacher)
    model = genai.GenerativeModel(model_name)

    prompt = f"""
You are an expert teacher. Generate a high-quality MCQ quiz strictly from the lesson content.

Course title: {course.title}
Lesson title: {lesson.title}
Lesson topic: {lesson.topic}
Difficulty: {difficulty}
Number of questions: {num_questions}

Rules:
- Create ONLY multiple-choice questions (MCQ).
- Each question MUST have exactly 4 options.
- Exactly ONE option is correct.
- Avoid generic questions like "Which keyword is most related..." and avoid repeated templates.
- Mix question styles: concept, application, scenario-based, reasoning, common misconceptions.
- Keep questions clearly based on the lesson content.
- Do NOT repeat the same question wording.

Return ONLY valid JSON (no markdown, no commentary), as an array like:
[
  {{
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "answer": "B",
    "explanation": "..."
  }}
]
"""

    try:
        if gemini_file:
            resp = model.generate_content(
                [prompt, gemini_file],
                generation_config={"temperature": 0.7, "top_p": 0.9, "max_output_tokens": 4096},
            )
        else:
            # include lesson text directly
            resp = model.generate_content(
                prompt + "\n\nLESSON TEXT:\n" + lesson_text,
                generation_config={"temperature": 0.7, "top_p": 0.9, "max_output_tokens": 4096},
            )

        raw_text = (getattr(resp, "text", "") or "").strip()
        raw_list = extract_json_array(raw_text)
        return normalize_questions(raw_list, limit=num_questions)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini quiz generation failed: {str(e)}")


# =========================================================
# Request models
# =========================================================
class QuizGenerateReq(BaseModel):
    num_questions: int = Field(5, ge=1, le=20)
    difficulty: str = "easy"  # easy/medium/hard


class ManualQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str
    explanation: Optional[str] = ""


class ManualQuizCreateReq(BaseModel):
    difficulty: str = "easy"
    questions: List[ManualQuestion]


# =========================================================
# AI Generate Quiz (Gemini)
# =========================================================
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

    questions = gemini_generate_mcq(
        db=db,
        teacher_email=user["email"],
        lesson=lesson,
        course=course,
        difficulty=data.difficulty,
        num_questions=data.num_questions,
    )

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


# =========================================================
# Manual Create Quiz (Unlimited questions)
# =========================================================
@router.post("/manual/{lesson_id}")
def create_manual_quiz(
    lesson_id: int,
    data: ManualQuizCreateReq,
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

    if not data.questions or len(data.questions) == 0:
        raise HTTPException(status_code=400, detail="Add at least 1 question.")

    cleaned = []
    for i, q in enumerate(data.questions, start=1):
        question = (q.question or "").strip()
        opts = [str(x).strip() for x in (q.options or [])]
        answer = (q.answer or "").strip()
        explanation = (q.explanation or "").strip()

        if not question:
            raise HTTPException(status_code=400, detail=f"Manual quiz: question {i} is empty.")
        if len(opts) != 4 or any(not o for o in opts):
            raise HTTPException(status_code=400, detail=f"Manual quiz: question {i} must have exactly 4 non-empty options.")
        if answer not in opts:
            raise HTTPException(status_code=400, detail=f"Manual quiz: question {i} answer must match one of the 4 options.")

        cleaned.append(
            {
                "question": question,
                "options": opts,
                "answer": answer,
                "explanation": explanation or "Explanation not provided.",
            }
        )

    quiz = Quiz(
        lesson_id=lesson_id,
        difficulty=data.difficulty,
        questions_json=json.dumps(cleaned)
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    return {
        "quiz_id": quiz.id,
        "lesson_id": lesson_id,
        "difficulty": quiz.difficulty,
        "questions": cleaned
    }


# =========================================================
# List quizzes for a lesson
# =========================================================
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

    out = []
    for q in quizzes:
        try:
            count = len(json.loads(q.questions_json or "[]"))
        except Exception:
            count = 0
        out.append(
            {
                "quiz_id": q.id,
                "difficulty": q.difficulty,
                "created_at": str(q.created_at),
                "question_count": count,
            }
        )

    return {"lesson_id": lesson_id, "quizzes": out}


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


# =========================================================
# Delete quiz
# =========================================================
@router.delete("/{quiz_id}")
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
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

    if course.teacher_email != user["email"]:
        raise HTTPException(status_code=403, detail="Not your course")

    # remove attempts first to avoid FK issues
    db.execute(sql_text("DELETE FROM quiz_attempts WHERE quiz_id = :qid"), {"qid": quiz_id})

    db.delete(quiz)
    db.commit()
    return {"message": "Quiz deleted", "quiz_id": quiz_id}
