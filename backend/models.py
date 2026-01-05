from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)

    plan = Column(String, nullable=False, default="free")
    premium_until = Column(DateTime, nullable=True)

    reset_otp = Column(String, nullable=True)
    reset_otp_expiry = Column(DateTime, nullable=True)


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    teacher_email = Column(String, nullable=False)


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    student_email = Column(String, nullable=False)
    enrolled_at = Column(DateTime, default=datetime.utcnow)


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    title = Column(String, nullable=False)
    topic = Column(String, nullable=False)

    content_text = Column(Text, nullable=True)

    attachment_url = Column(String, nullable=True)
    attachment_name = Column(String, nullable=True)
    attachment_type = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    difficulty = Column(String, default="easy")
    questions_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    student_email = Column(String, nullable=False)
    score = Column(Float, default=0.0)
    submitted_at = Column(DateTime, default=datetime.utcnow)


class TopicMastery(Base):
    __tablename__ = "topic_mastery"

    id = Column(Integer, primary_key=True, index=True)
    student_email = Column(String, index=True, nullable=False)
    subject = Column(String, index=True, nullable=False)
    topic = Column(String, index=True, nullable=False)
    mastery_score = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow)
