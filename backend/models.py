from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # student / teacher / admin

    # for forgot-password flow (OTP)
    reset_otp = Column(String, nullable=True)
    reset_otp_expiry = Column(DateTime, nullable=True)


# ----------------------------
# Courses & Enrollment
# ----------------------------
class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)          # e.g. "Math Form 1"
    subject = Column(String, nullable=False)        # "Math", "Physics"
    teacher_email = Column(String, nullable=False)  # owner teacher


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    student_email = Column(String, nullable=False)
    enrolled_at = Column(DateTime, default=datetime.utcnow)


# ----------------------------
# Lessons (teacher uploads)
# ----------------------------
class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    topic = Column(String, nullable=False)          # e.g. "Algebra", "Kinematics"
    content_text = Column(Text, nullable=False)     # extracted text from file
    created_at = Column(DateTime, default=datetime.utcnow)


# ----------------------------
# Quizzes (AI-generated)
# Store questions as JSON string for simplicity
# ----------------------------
class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    difficulty = Column(String, default="easy")
    questions_json = Column(Text, nullable=False)   # JSON string of MCQs
    created_at = Column(DateTime, default=datetime.utcnow)


# ----------------------------
# Student attempts + grading
# ----------------------------
class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    student_email = Column(String, nullable=False)
    score = Column(Float, default=0.0)              # percent, e.g. 80.0
    submitted_at = Column(DateTime, default=datetime.utcnow)


# ----------------------------
# Strength/Weakness per topic (ML-style report)
# mastery_score: 0..100
# ----------------------------
class TopicMastery(Base):
    __tablename__ = "topic_mastery"

    id = Column(Integer, primary_key=True, index=True)
    student_email = Column(String, index=True, nullable=False)
    subject = Column(String, index=True, nullable=False)  # Math/Physics
    topic = Column(String, index=True, nullable=False)    # Algebra etc.
    mastery_score = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow)
