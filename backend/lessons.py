from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session

from deps import get_db, require_role, get_current_user
from models import Course, Enrollment, Lesson

from typing import Optional
import os
import uuid
import shutil

router = APIRouter(prefix="/lessons", tags=["lessons"])

UPLOAD_DIR = "uploads"


class LessonCreateReq(BaseModel):
    course_id: int
    title: str
    topic: str
    content_text: Optional[str] = None
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None
    attachment_type: Optional[str] = None


@router.post("")
def create_lesson(
    data: LessonCreateReq,
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.teacher_email != user["email"]:
        raise HTTPException(status_code=403, detail="You are not the owner of this course")

    # require at least text or attachment
    has_text = bool((data.content_text or "").strip())
    has_file = bool((data.attachment_url or "").strip())
    if not has_text and not has_file:
        raise HTTPException(status_code=400, detail="Provide lesson text or upload a file.")

    lesson = Lesson(
        course_id=data.course_id,
        title=data.title.strip(),
        topic=data.topic.strip(),
        content_text=(data.content_text.strip() if data.content_text else None),
        attachment_url=(data.attachment_url.strip() if data.attachment_url else None),
        attachment_name=(data.attachment_name.strip() if data.attachment_name else None),
        attachment_type=(data.attachment_type.strip() if data.attachment_type else None),
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.post("/upload")
def upload_lesson_file(
    course_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.teacher_email != user["email"]:
        raise HTTPException(status_code=403, detail="You are not the owner of this course")

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename)[1].lower()
    allowed = {".pdf", ".png", ".jpg", ".jpeg"}
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Only PDF/PNG/JPG allowed")

    safe_name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, safe_name)

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "file_url": f"/uploads/{safe_name}",
        "original_name": file.filename,
        "content_type": file.content_type,
    }


@router.get("/course/{course_id}")
def list_lessons_for_course(
    course_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

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


@router.delete("/{lesson_id}")
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_role("teacher"))
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course = db.query(Course).filter(Course.id == lesson.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.teacher_email != user["email"]:
        raise HTTPException(status_code=403, detail="You are not the owner of this course")

    db.delete(lesson)
    db.commit()
    return {"message": "Lesson deleted", "lesson_id": lesson_id}
