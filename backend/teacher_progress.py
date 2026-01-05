from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from deps import get_db, get_current_user
from models import Course, Enrollment, Lesson, Quiz, QuizAttempt, TopicMastery

router = APIRouter(prefix="/teacher", tags=["teacher-progress"])


def _require_teacher(user):
    if user.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access only")


def _require_course_owner(db: Session, course_id: int, teacher_email: str):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_email != teacher_email:
        raise HTTPException(status_code=403, detail="Not your course")
    return course


@router.get("/course/{course_id}/students-progress")
def students_progress(course_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    _require_teacher(user)
    _require_course_owner(db, course_id, user["email"])

    enrolls = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    student_emails = [e.student_email for e in enrolls]

    if not student_emails:
        return {"students": []}

    attempts = (
        db.query(QuizAttempt.student_email, QuizAttempt.score, QuizAttempt.submitted_at)
        .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
        .join(Lesson, Quiz.lesson_id == Lesson.id)
        .filter(Lesson.course_id == course_id)
        .filter(QuizAttempt.student_email.in_(student_emails))
        .all()
    )

    agg = {}
    for email in student_emails:
        agg[email] = {
            "student_email": email,
            "quizzes_done": 0,
            "avg_score": 0.0,
            "last_attempt_at": None,
        }

    sums = {email: 0.0 for email in student_emails}

    for email, score, submitted_at in attempts:
        row = agg[email]
        row["quizzes_done"] += 1
        sums[email] += float(score or 0.0)

        if submitted_at:
            if row["last_attempt_at"] is None or submitted_at > row["last_attempt_at"]:
                row["last_attempt_at"] = submitted_at

    for email in student_emails:
        n = agg[email]["quizzes_done"]
        agg[email]["avg_score"] = round((sums[email] / n), 2) if n else 0.0
        if agg[email]["last_attempt_at"]:
            agg[email]["last_attempt_at"] = agg[email]["last_attempt_at"].isoformat()

    students = list(agg.values())
    students.sort(key=lambda x: (-x["avg_score"], x["student_email"]))

    return {"students": students}


@router.get("/course/{course_id}/student/{student_email}/weekly-progress")
def weekly_progress(
    course_id: int,
    student_email: str,
    weeks: int = 8,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    _require_teacher(user)
    _require_course_owner(db, course_id, user["email"])

    enrolled = (
        db.query(Enrollment)
        .filter(Enrollment.course_id == course_id, Enrollment.student_email == student_email)
        .first()
    )
    if not enrolled:
        raise HTTPException(status_code=404, detail="Student not enrolled in this course")

    end_dt = datetime.utcnow()
    start_dt = end_dt - timedelta(days=7 * weeks)

    attempts = (
        db.query(QuizAttempt.score, QuizAttempt.submitted_at)
        .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
        .join(Lesson, Quiz.lesson_id == Lesson.id)
        .filter(Lesson.course_id == course_id)
        .filter(QuizAttempt.student_email == student_email)
        .filter(QuizAttempt.submitted_at >= start_dt)
        .all()
    )

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
    quizzes_done = []

    for i in range(weeks - 1, -1, -1):
        ws = week_start(end_dt - timedelta(days=7 * i))
        label = ws.strftime("%d %b")
        labels.append(label)

        if ws in buckets and buckets[ws]["count"]:
            avg = buckets[ws]["sum"] / buckets[ws]["count"]
            avg_scores.append(round(avg, 2))
            quizzes_done.append(buckets[ws]["count"])
        else:
            avg_scores.append(0.0)
            quizzes_done.append(0)

    return {
        "student_email": student_email,
        "weeks": labels,
        "avg_scores": avg_scores,
        "quizzes_done": quizzes_done,
    }


@router.get("/course/{course_id}/student/{student_email}/weak-topics")
def weak_topics(course_id: int, student_email: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    _require_teacher(user)
    _require_course_owner(db, course_id, user["email"])

    enrolled = (
        db.query(Enrollment)
        .filter(Enrollment.course_id == course_id, Enrollment.student_email == student_email)
        .first()
    )
    if not enrolled:
        raise HTTPException(status_code=404, detail="Student not enrolled in this course")

    rows = (
        db.query(TopicMastery)
        .filter(TopicMastery.student_email == student_email)
        .order_by(TopicMastery.mastery_score.asc())
        .limit(6)
        .all()
    )

    return {
        "weak_topics": [
            {"subject": r.subject, "topic": r.topic, "mastery_score": float(r.mastery_score or 0.0)}
            for r in rows
        ]
    }
