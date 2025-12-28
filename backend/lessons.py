from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from deps import get_db, require_role, get_current_user
from models import Course, Enrollment, Lesson

router = APIRouter(prefix="/lessons", tags=["lessons"])


class LessonCreateReq(BaseModel):
    course_id: int
    title: str
    topic: str
    content_text: str  # extracted text or pasted text


@router.post("")
def create_lesson(
    data: LessonCreateReq,
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    # course must exist
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # teacher must own the course
    if course.teacher_email != user["email"]:
        raise HTTPException(status_code=403, detail="You are not the owner of this course")

    lesson = Lesson(
        course_id=data.course_id,
        title=data.title,
        topic=data.topic,
        content_text=data.content_text
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.get("/course/{course_id}")
def list_lessons_for_course(
    course_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # access rules:
    # - teacher can view if they own it
    # - student can view if enrolled
    if user["role"] == "teacher":
        if course.teacher_email != user["email"]:
            raise HTTPException(status_code=403, detail="Not your course")
    elif user["role"] == "student":
        enrolled = db.query(Enrollment).filter(
            Enrollment.course_id == course_id,
            Enrollment.student_email == user["email"]
        ).first()
        if not enrolled:
            raise HTTPException(status_code=403, detail="You are not enrolled in this course")
    else:
        raise HTTPException(status_code=403, detail="Forbidden")

    lessons = db.query(Lesson).filter(Lesson.course_id == course_id).all()
    return {"course_id": course_id, "lessons": lessons}
