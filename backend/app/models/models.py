from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class UserRole(str, enum.Enum):
    CITIZEN = "citizen"
    ADMIN = "admin"
    WORKER = "worker"

class ComplaintStatus(str, enum.Enum):
    SUBMITTED = "Submitted"
    UNDER_REVIEW = "Under Review"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    CLOSED = "Closed"
    REOPENED = "Reopened"
    REJECTED = "Rejected"
    ESCALATED = "Escalated"

class ComplaintPriority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, unique=True)
    code = Column(String(20), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    head_email = Column(String(150), nullable=True)
    phone = Column(String(30), nullable=True)
    sla_hours_default = Column(Integer, default=48)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    users = relationship("User", back_populates="department")
    categories = relationship("Category", back_populates="department")
    complaints = relationship("Complaint", back_populates="department")

class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(20), nullable=False, unique=True)
    zone = Column(String(50), nullable=False, default="Central")
    center_latitude = Column(Float, nullable=False, default=17.3850)
    center_longitude = Column(Float, nullable=False, default=78.4867)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    complaints = relationship("Complaint", back_populates="ward")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, unique=True)
    slug = Column(String(100), nullable=False, unique=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    sla_hours = Column(Integer, default=48)
    icon_name = Column(String(50), default="AlertCircle")
    keywords = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    department = relationship("Department", back_populates="categories")
    complaints = relationship("Complaint", back_populates="category")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(30), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.CITIZEN, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String(255), nullable=True, index=True)
    verification_token_expires_at = Column(DateTime(timezone=True), nullable=True)
    reset_password_token = Column(String(255), nullable=True, index=True)
    reset_password_token_expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    department = relationship("Department", back_populates="users")
    complaints_filed = relationship("Complaint", foreign_keys="Complaint.citizen_id", back_populates="citizen")
    assigned_tasks = relationship("Complaint", foreign_keys="Complaint.assigned_worker_id", back_populates="assigned_worker")
    comments = relationship("Comment", back_populates="author")
    notifications = relationship("Notification", back_populates="user")
    feedback_given = relationship("Feedback", back_populates="citizen")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. CIV-2026-00101
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    original_language = Column(String(10), default="en") # en, hi, te
    translated_text = Column(Text, nullable=True)

    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=True)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_worker_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    status = Column(SQLEnum(ComplaintStatus), default=ComplaintStatus.SUBMITTED, nullable=False, index=True)
    priority = Column(SQLEnum(ComplaintPriority), default=ComplaintPriority.MEDIUM, nullable=False, index=True)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(255), nullable=False)
    landmark = Column(String(150), nullable=True)

    # AI Insights
    ai_category_suggested = Column(String(150), nullable=True)
    ai_severity_suggested = Column(String(50), nullable=True)
    ai_confidence_score = Column(Float, nullable=True)
    ai_reasoning = Column(Text, nullable=True)
    ai_estimated_hours = Column(Float, nullable=True)
    is_duplicate_of_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    duplicate_similarity_score = Column(Float, nullable=True)

    expected_resolution_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    reopened_count = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    category = relationship("Category", back_populates="complaints")
    department = relationship("Department", back_populates="complaints")
    ward = relationship("Ward", back_populates="complaints")
    citizen = relationship("User", foreign_keys=[citizen_id], back_populates="complaints_filed")
    assigned_worker = relationship("User", foreign_keys=[assigned_worker_id], back_populates="assigned_tasks")
    
    assignments = relationship("ComplaintAssignment", back_populates="complaint", cascade="all, delete-orphan")
    status_history = relationship("StatusHistory", back_populates="complaint", cascade="all, delete-orphan", order_by="StatusHistory.created_at")
    comments = relationship("Comment", back_populates="complaint", cascade="all, delete-orphan", order_by="Comment.created_at")
    attachments = relationship("Attachment", back_populates="complaint", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="complaint", uselist=False, cascade="all, delete-orphan")
    ai_predictions = relationship("AIPrediction", back_populates="complaint", cascade="all, delete-orphan")

class ComplaintAssignment(Base):
    __tablename__ = "complaint_assignments"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    assigned_at = Column(DateTime(timezone=True), default=utc_now)
    is_current = Column(Boolean, default=True)

    complaint = relationship("Complaint", back_populates="assignments")
    worker = relationship("User", foreign_keys=[worker_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])

class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    complaint = relationship("Complaint", back_populates="status_history")
    changed_by = relationship("User")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    complaint = relationship("Complaint", back_populates="comments")
    author = relationship("User", back_populates="comments")

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    attachment_type = Column(String(50), default="evidence") # evidence, before_photo, after_photo
    created_at = Column(DateTime(timezone=True), default=utc_now)

    complaint = relationship("Complaint", back_populates="attachments")
    uploader = relationship("User")

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), unique=True, nullable=False)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False) # 1 - 5 stars
    review_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    complaint = relationship("Complaint", back_populates="feedback")
    citizen = relationship("User", back_populates="feedback_given")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="status_update") # submitted, assigned, status_update, overdue, feedback_request
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="notifications")

class AIPrediction(Base):
    __tablename__ = "ai_predictions"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    prediction_type = Column(String(50), nullable=False) # classification, severity, duplicate, vision, sla
    input_data = Column(Text, nullable=True)
    predicted_output = Column(Text, nullable=False)
    confidence = Column(Float, nullable=True)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    complaint = relationship("Complaint", back_populates="ai_predictions")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(50), nullable=True)
    ip_address = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User")
