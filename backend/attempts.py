from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import json
from datetime import datetime

from deps import get_db, require_role
from models import Quiz, Lesson, Course, Enrollment, QuizAttempt, TopicMastery

router = APIRouter(prefix="/attempts", tags=["attempts"])


class AttemptSubmitReq(BaseModel):
    answers: list[str]  # list of student selected answers (same order as questions)


@router.post("/submit/{quiz_id}")
def submit_attempt(
    quiz_id: int,
    data: AttemptSubmitReq,
    db: Session = Depends(get_db),
    user=Depends(require_role("student"))
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    lesson = db.query(Lesson).filter(Lesson.id == quiz.lesson_id).first()
    course = db.query(Course).filter(Course.id == lesson.course_id).first()

    # Student must be enrolled
    enrolled = db.query(Enrollment).filter(
        Enrollment.course_id == course.id,
        Enrollment.student_email == user["email"]
    ).first()
    if not enrolled:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")

    questions = json.loads(quiz.questions_json)

    if len(data.answers) != len(questions):
        raise HTTPException(status_code=400, detail="Answers count must match questions count")

    # Grade
    correct = 0
    results = []
    for i, q in enumerate(questions):
        student_ans = data.answers[i]
        correct_ans = q["answer"]
        is_correct = (student_ans == correct_ans)
        if is_correct:
            correct += 1
        results.append({
            "question": q["question"],
            "student_answer": student_ans,
            "correct_answer": correct_ans,
            "is_correct": is_correct
        })

    score_percent = (correct / len(questions)) * 100.0 if questions else 0.0

    # Save attempt
    attempt = QuizAttempt(
        quiz_id=quiz_id,
        student_email=user["email"],
        score=score_percent,
        submitted_at=datetime.utcnow()
    )
    db.add(attempt)

    # Update TopicMastery (simple mastery update)
    # mastery_score = average of previous mastery and new score (smooth update)
    subject = course.subject
    topic = lesson.topic

    mastery = db.query(TopicMastery).filter(
        TopicMastery.student_email == user["email"],
        TopicMastery.subject == subject,
        TopicMastery.topic == topic
    ).first()

    if mastery:
        mastery.mastery_score = (0.7 * mastery.mastery_score) + (0.3 * score_percent)
        mastery.updated_at = datetime.utcnow()
    else:
        mastery = TopicMastery(
            student_email=user["email"],
            subject=subject,
            topic=topic,
            mastery_score=score_percent,
            updated_at=datetime.utcnow()
        )
        db.add(mastery)

    db.commit()
    db.refresh(attempt)

    return {
        "attempt_id": attempt.id,
        "quiz_id": quiz_id,
        "score": score_percent,
        "topic": topic,
        "subject": subject,
        "details": results
    }


@router.get("/my/report")
def my_report(
    db: Session = Depends(get_db),
    user=Depends(require_role("student"))
):
    rows = db.query(TopicMastery).filter(
        TopicMastery.student_email == user["email"]
    ).all()

    strong = [r for r in rows if r.mastery_score >= 75]
    weak = [r for r in rows if r.mastery_score < 50]
    medium = [r for r in rows if 50 <= r.mastery_score < 75]

    # Sort best/worst
    strong = sorted(strong, key=lambda x: x.mastery_score, reverse=True)
    weak = sorted(weak, key=lambda x: x.mastery_score)

    return {
        "student_email": user["email"],
        "strong_topics": [{"subject": r.subject, "topic": r.topic, "mastery": r.mastery_score} for r in strong],
        "weak_topics": [{"subject": r.subject, "topic": r.topic, "mastery": r.mastery_score} for r in weak],
        "medium_topics": [{"subject": r.subject, "topic": r.topic, "mastery": r.mastery_score} for r in medium],
    }
