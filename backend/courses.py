from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from deps import get_db, require_role, get_current_user
from models import Course, Enrollment

router = APIRouter(prefix="/courses", tags=["courses"])


class CourseCreateReq(BaseModel):
    title: str
    subject: str  # "Math" / "Physics"


@router.post("")
def create_course(data: CourseCreateReq, db: Session = Depends(get_db), user=Depends(require_role("teacher"))):
    course = Course(
        title=data.title,
        subject=data.subject,
        teacher_email=user["email"]
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.post("/{course_id}/enroll")
def enroll_course(course_id: int, db: Session = Depends(get_db), user=Depends(require_role("student"))):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    already = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.student_email == user["email"]
    ).first()
    if already:
        return {"message": "Already enrolled"}

    en = Enrollment(course_id=course_id, student_email=user["email"])
    db.add(en)
    db.commit()
    return {"message": "Enrolled successfully"}


@router.get("/my")
def my_courses(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user["role"] == "teacher":
        courses = db.query(Course).filter(Course.teacher_email == user["email"]).all()
        return {"role": "teacher", "courses": courses}

    if user["role"] == "student":
        enrollments = db.query(Enrollment).filter(Enrollment.student_email == user["email"]).all()
        course_ids = [e.course_id for e in enrollments]
        courses = db.query(Course).filter(Course.id.in_(course_ids)).all() if course_ids else []
        return {"role": "student", "courses": courses}

    return {"role": user["role"], "courses": []}
