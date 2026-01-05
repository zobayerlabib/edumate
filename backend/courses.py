# courses.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from deps import get_db, require_role, get_current_user
from models import Course, Enrollment, Lesson

router = APIRouter(prefix="/courses", tags=["courses"])


class CourseCreateReq(BaseModel):
    title: str
    subject: str


class EnrollStudentReq(BaseModel):
    student_email: str


@router.post("")
def create_course(
    data: CourseCreateReq,
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    c = Course(
        title=data.title,
        subject=data.subject,
        teacher_email=user["email"],
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


# ✅ OPTION A: students cannot self-enroll
@router.post("/{course_id}/enroll")
def enroll_student(
    course_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_role("student"))
):
    raise HTTPException(
        status_code=403,
        detail="Students cannot self-enroll. Teacher must add you to the course."
    )


# ✅ Teacher enrolls student by email
@router.post("/{course_id}/enroll-student")
def teacher_enroll_student(
    course_id: int,
    data: EnrollStudentReq,
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.teacher_email != user["email"]:
        raise HTTPException(status_code=403, detail="Not your course")

    student_email = data.student_email.strip().lower()
    if not student_email:
        raise HTTPException(status_code=400, detail="student_email is required")

    existing = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.student_email == student_email
    ).first()
    if existing:
        return {"message": "Student already enrolled", "student_email": student_email}

    e = Enrollment(course_id=course_id, student_email=student_email)
    db.add(e)
    db.commit()
    return {"message": "Student enrolled", "student_email": student_email}


# ✅ Teacher lists students in the course
@router.get("/{course_id}/students")
def list_course_students(
    course_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.teacher_email != user["email"]:
        raise HTTPException(status_code=403, detail="Not your course")

    enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()

    return {
        "course_id": course_id,
        "students": [{"student_email": e.student_email} for e in enrollments]
    }


# ✅ Teacher removes a student from the course
@router.delete("/{course_id}/students/{student_email}")
def remove_student_from_course(
    course_id: int,
    student_email: str,
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.teacher_email != user["email"]:
        raise HTTPException(status_code=403, detail="Not your course")

    student_email = student_email.strip().lower()

    en = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.student_email == student_email
    ).first()
    if not en:
        raise HTTPException(status_code=404, detail="Student not enrolled")

    db.delete(en)
    db.commit()
    return {"message": "Student removed", "student_email": student_email}


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


@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.teacher_email != user["email"]:
        raise HTTPException(status_code=403, detail="You are not the owner of this course")

    # remove enrollments first
    db.query(Enrollment).filter(Enrollment.course_id == course_id).delete()

    # remove lessons
    db.query(Lesson).filter(Lesson.course_id == course_id).delete()

    db.delete(course)
    db.commit()
    return {"message": "Course deleted", "course_id": course_id}
