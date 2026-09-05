import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Date, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="student", index=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    profiles = relationship("Profile", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    profile_type = Column(String(20), nullable=False, index=True)  # 'school' | 'college'
    student_name = Column(String(255), nullable=False)
    identifier = Column(String(100), unique=True, nullable=False, index=True)
    grade_or_semester = Column(String(50), nullable=False)
    cumulative_score = Column(Float, default=0.0)
    target_score = Column(Float, default=75.0)
    study_hours_per_week = Column(Float, default=15.0)
    screen_time_hours = Column(Float, default=4.0)
    risk_status = Column(String(30), default="On Track", index=True)  # 'On Track', 'Critical', 'At Risk'
    failure_probability = Column(Float, default=0.05)
    last_ai_suggestion = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="profiles")
    attendance_logs = relationship("AttendanceLog", back_populates="profile", cascade="all, delete-orphan")
    marks = relationship("InternalExternalMark", back_populates="profile", cascade="all, delete-orphan")


class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    profile_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    recorded_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False)  # 'present', 'absent', 'excused', 'late'
    attendance_percentage = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    profile = relationship("Profile", back_populates="attendance_logs")


class InternalExternalMark(Base):
    __tablename__ = "internal_external_marks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    profile_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_name = Column(String(120), nullable=False, index=True)
    internal_score = Column(Float, nullable=False, default=0.0)
    external_score = Column(Float, nullable=False, default=0.0)
    max_internal = Column(Float, nullable=False, default=100.0)
    max_external = Column(Float, nullable=False, default=100.0)
    credit_hours = Column(Float, nullable=True, default=3.0)
    letter_grade = Column(String(5), nullable=True)
    standardized_percentage = Column(Float, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    profile = relationship("Profile", back_populates="marks")
