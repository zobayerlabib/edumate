from datetime import datetime, timedelta
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from deps import get_db, require_role
from models import Quiz, Lesson, Course, Enrollment, QuizAttempt, TopicMastery

router = APIRouter(prefix="/attempts", tags=["attempts"])


class AttemptSubmitReq(BaseModel):
    # list of student selected answers (same order as questions)
    answers: list[str]


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
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course = db.query(Course).filter(Course.id == lesson.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Student must be enrolled
    enrolled = db.query(Enrollment).filter(
        Enrollment.course_id == course.id,
        Enrollment.student_email == user["email"]
    ).first()
    if not enrolled:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")

    questions = json.loads(quiz.questions_json or "[]")

    if len(data.answers) != len(questions):
        raise HTTPException(status_code=400, detail="Answers count must match questions count")

    # Grade
    correct = 0
    results = []
    for i, q in enumerate(questions):
        student_ans = data.answers[i]
        correct_ans = q.get("answer")
        is_correct = (student_ans == correct_ans)
        if is_correct:
            correct += 1
        results.append({
            "question": q.get("question"),
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
    subject = course.subject
    topic = lesson.topic

    mastery = db.query(TopicMastery).filter(
        TopicMastery.student_email == user["email"],
        TopicMastery.subject == subject,
        TopicMastery.topic == topic
    ).first()

    if mastery:
        mastery.mastery_score = (0.7 * float(mastery.mastery_score or 0.0)) + (0.3 * score_percent)
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
        "score": round(score_percent, 2),
        "topic": topic,
        "subject": subject,
        "details": results
    }


# =========================================================
# ✅ NEW: Student stats for dashboard
# =========================================================
@router.get("/my/stats")
def my_stats(
    db: Session = Depends(get_db),
    user=Depends(require_role("student"))
):
    rows = db.query(QuizAttempt.score, QuizAttempt.submitted_at).filter(
        QuizAttempt.student_email == user["email"]
    ).all()

    if not rows:
        return {
            "student_email": user["email"],
            "total_attempts": 0,
            "quizzes_done": 0,
            "avg_score": 0.0,
            "highest_score": None,
            "lowest_score": None,
            "streak_days": 0,
            "last_attempt_at": None,
        }

    scores = []
    last_dt = None
    days = set()

    for score, submitted_at in rows:
        if score is not None:
            scores.append(float(score))
        if submitted_at:
            days.add(submitted_at.date())
            if last_dt is None or submitted_at > last_dt:
                last_dt = submitted_at

    total_attempts = len(rows)
    avg_score = round(sum(scores) / len(scores), 2) if scores else 0.0
    highest_score = round(max(scores), 2) if scores else None
    lowest_score = round(min(scores), 2) if scores else None

    # Consecutive-day streak ending at the most recent attempt date
    streak = 0
    if last_dt:
        cursor = last_dt.date()
        while cursor in days:
            streak += 1
            cursor = cursor - timedelta(days=1)

    return {
        "student_email": user["email"],
        "total_attempts": total_attempts,
        "quizzes_done": total_attempts,  # alias for old UI
        "avg_score": avg_score,
        "highest_score": highest_score,
        "lowest_score": lowest_score,
        "streak_days": streak,
        "last_attempt_at": last_dt.isoformat() if last_dt else None,
    }


# =========================================================
# ✅ NEW: Weekly progress for student dashboard chart
# =========================================================
@router.get("/my/weekly-progress")
def my_weekly_progress(
    weeks: int = 8,
    db: Session = Depends(get_db),
    user=Depends(require_role("student"))
):
    if weeks < 1:
        weeks = 1
    if weeks > 52:
        weeks = 52

    end_dt = datetime.utcnow()
    start_dt = end_dt - timedelta(days=7 * weeks)

    attempts = db.query(QuizAttempt.score, QuizAttempt.submitted_at).filter(
        QuizAttempt.student_email == user["email"],
        QuizAttempt.submitted_at >= start_dt
    ).all()

    def week_start(d: datetime):
        monday = d.date() - timedelta(days=d.date().weekday())
        return monday

    buckets = {}
    for score, submitted_at in attempts:
        if not submitted_at:
            continue
        ws = week_start(submitted_at)
        if ws not in buckets:
            buckets[ws] = {"sum": 0.0, "count": 0}
        buckets[ws]["sum"] += float(score or 0.0)
        buckets[ws]["count"] += 1

    labels = []
    avg_scores = []
    attempts_count = []
    week_objects = []

    for i in range(weeks - 1, -1, -1):
        ws = week_start(end_dt - timedelta(days=7 * i))
        label = ws.strftime("%d %b")
        labels.append(label)

        if ws in buckets and buckets[ws]["count"]:
            avg = buckets[ws]["sum"] / buckets[ws]["count"]
            avg_v = round(avg, 2)
            cnt = buckets[ws]["count"]
        else:
            avg_v = 0.0
            cnt = 0

        avg_scores.append(avg_v)
        attempts_count.append(cnt)
        week_objects.append({"label": label, "attempts": cnt, "avg_score": avg_v})

    # Provide BOTH formats:
    # - weeks_data: list of objects (best for charts)
    # - weeks/avg_scores/attempts: arrays (backward compatible)
    return {
        "student_email": user["email"],
        "weeks_data": week_objects,
        "weeks": labels,
        "avg_scores": avg_scores,
        "attempts": attempts_count,
    }


@router.get("/my/report")
def my_report(
    db: Session = Depends(get_db),
    user=Depends(require_role("student"))
):
    rows = db.query(TopicMastery).filter(
        TopicMastery.student_email == user["email"]
    ).all()

    strong = [r for r in rows if float(r.mastery_score or 0.0) >= 75]
    weak = [r for r in rows if float(r.mastery_score or 0.0) < 50]
    medium = [r for r in rows if 50 <= float(r.mastery_score or 0.0) < 75]

    # Sort best/worst
    strong = sorted(strong, key=lambda x: float(x.mastery_score or 0.0), reverse=True)
    weak = sorted(weak, key=lambda x: float(x.mastery_score or 0.0))

    return {
        "student_email": user["email"],
        "strong_topics": [{"subject": r.subject, "topic": r.topic, "mastery": float(r.mastery_score or 0.0)} for r in strong],
        "weak_topics": [{"subject": r.subject, "topic": r.topic, "mastery": float(r.mastery_score or 0.0)} for r in weak],
        "medium_topics": [{"subject": r.subject, "topic": r.topic, "mastery": float(r.mastery_score or 0.0)} for r in medium],
    }
