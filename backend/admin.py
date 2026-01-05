from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from deps import get_db, require_role
from models import User, Course, Enrollment, Lesson, Quiz, QuizAttempt

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
def stats(db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    total_users = db.query(User).count()
    total_students = db.query(User).filter(User.role == "student").count()
    total_teachers = db.query(User).filter(User.role == "teacher").count()
    total_courses = db.query(Course).count()

    return {
        "totalUsers": total_users,
        "totalStudents": total_students,
        "totalTeachers": total_teachers,
        "totalCourses": total_courses,
    }


@router.get("/users")
def users(db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    rows = db.query(User).all()
    return [{"id": u.id, "email": u.email, "role": u.role} for u in rows]


@router.patch("/users/{user_id}/role")
def change_role(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin")),
):
    new_role = payload.get("role")
    if new_role not in ["student", "teacher", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    u.role = new_role
    db.commit()
    return {"message": "Role updated", "id": u.id, "email": u.email, "role": u.role}


@router.get("/courses")
def courses(db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    rows = db.query(Course).all()
    return {"courses": rows}


@router.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    c = db.query(Course).filter(Course.id == course_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Course not found")

    db.query(Enrollment).filter(Enrollment.course_id == course_id).delete()
    db.query(Lesson).filter(Lesson.course_id == course_id).delete()
    db.query(Quiz).filter(Quiz.lesson_id.in_(
        [l.id for l in db.query(Lesson).filter(Lesson.course_id == course_id).all()]
    )).delete(synchronize_session=False)
    db.query(QuizAttempt).delete(synchronize_session=False)

    db.delete(c)
    db.commit()
    return {"message": "Course deleted", "course_id": course_id}
@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin"))
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    # remove enrollments first
    db.query(Enrollment).filter(Enrollment.student_email == u.email).delete()

    # remove attempts (if your QuizAttempt has student_email)
    db.query(QuizAttempt).filter(QuizAttempt.student_email == u.email).delete()

    # if user is teacher, remove their courses and related data
    if u.role == "teacher":
        teacher_courses = db.query(Course).filter(Course.teacher_email == u.email).all()
        for c in teacher_courses:
            db.query(Enrollment).filter(Enrollment.course_id == c.id).delete()
            db.query(Lesson).filter(Lesson.course_id == c.id).delete()
            db.delete(c)

    db.delete(u)
    db.commit()
    return {"message": "User deleted", "user_id": user_id}
