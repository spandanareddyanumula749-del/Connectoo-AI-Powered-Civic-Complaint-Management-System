from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field
from app.models.models import UserRole, ComplaintStatus, ComplaintPriority

# Auth & User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CITIZEN
    department_id: Optional[int] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class CitizenRegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str = Field(..., min_length=6)
    phone: Optional[str] = None

class WorkerCreateRequest(BaseModel):
    email: EmailStr
    full_name: str
    department_id: int
    phone: Optional[str] = None
    password: Optional[str] = None  # If omitted, a secure temporary password is generated

class VerifyEmailRequest(BaseModel):
    token: str
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    email: EmailStr
    new_password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    head_email: Optional[str] = None
    phone: Optional[str] = None
    sla_hours_default: int = 48

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime
    active_complaints_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Ward Schemas
class WardBase(BaseModel):
    name: str
    code: str
    zone: str = "Central"
    center_latitude: float
    center_longitude: float

class WardResponse(WardBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    slug: str
    department_id: int
    sla_hours: int = 48
    icon_name: str = "AlertCircle"
    keywords: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    department_name: Optional[str] = None

    class Config:
        from_attributes = True

# Attachment Schemas
class AttachmentResponse(BaseModel):
    id: int
    complaint_id: int
    file_path: str
    file_name: str
    file_type: str
    file_size: int
    attachment_type: str
    created_at: datetime

    class Config:
        from_attributes = True

# Comment Schemas
class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)
    is_internal: bool = False

class CommentResponse(BaseModel):
    id: int
    complaint_id: int
    user_id: int
    author_name: str
    author_role: str
    content: str
    is_internal: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Status History Schemas
class StatusHistoryResponse(BaseModel):
    id: int
    complaint_id: int
    old_status: Optional[str]
    new_status: str
    changed_by_name: str
    remarks: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Feedback Schemas
class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    review_text: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: int
    complaint_id: int
    citizen_id: int
    citizen_name: Optional[str] = None
    rating: int
    review_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Complaint Schemas
class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=10)
    category_id: int
    ward_id: Optional[int] = None
    latitude: float
    longitude: float
    address: str
    landmark: Optional[str] = None
    original_language: str = "en"
    override_priority: Optional[ComplaintPriority] = None

class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus
    remarks: Optional[str] = None

class ComplaintAssignRequest(BaseModel):
    worker_id: int
    department_id: Optional[int] = None
    notes: Optional[str] = None
    priority: Optional[ComplaintPriority] = None

class ComplaintPriorityUpdate(BaseModel):
    priority: ComplaintPriority
    remarks: Optional[str] = None

class ComplaintUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=255)
    description: Optional[str] = Field(None, min_length=10)
    landmark: Optional[str] = None
    address: Optional[str] = None

class ComplaintWithdrawRequest(BaseModel):
    reason: Optional[str] = "Withdrawn by reporting citizen."

class ComplaintResponse(BaseModel):
    id: int
    complaint_id: str
    title: str
    description: str
    original_language: str
    translated_text: Optional[str]
    category_id: int
    category_name: Optional[str] = None
    department_id: int
    department_name: Optional[str] = None
    ward_id: Optional[int]
    ward_name: Optional[str] = None
    citizen_id: int
    citizen_name: Optional[str] = None
    citizen_phone: Optional[str] = None
    assigned_worker_id: Optional[int]
    assigned_worker_name: Optional[str] = None
    status: ComplaintStatus
    priority: ComplaintPriority
    latitude: float
    longitude: float
    address: str
    landmark: Optional[str]
    ai_category_suggested: Optional[str]
    ai_severity_suggested: Optional[str]
    ai_confidence_score: Optional[float]
    ai_reasoning: Optional[str]
    ai_estimated_hours: Optional[float]
    is_duplicate_of_id: Optional[int]
    expected_resolution_at: Optional[datetime]
    resolved_at: Optional[datetime]
    reopened_count: int
    created_at: datetime
    updated_at: datetime
    attachments: List[AttachmentResponse] = []
    feedback: Optional[FeedbackResponse] = None

    class Config:
        from_attributes = True

class ComplaintDetailResponse(ComplaintResponse):
    status_history: List[StatusHistoryResponse] = []
    comments: List[CommentResponse] = []

# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    complaint_id: Optional[int]
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# AI Service Schemas
class AIClassifyRequest(BaseModel):
    text: str

class AIClassifyResponse(BaseModel):
    suggested_category_id: int
    suggested_category_name: str
    suggested_department_id: int
    suggested_department_name: str
    confidence: float
    suggested_next_action: str

class AISeverityRequest(BaseModel):
    title: str
    description: str
    category_id: Optional[int] = None

class AISeverityResponse(BaseModel):
    severity: ComplaintPriority
    confidence: float
    reasoning: str
    risk_factors: List[str]

class AIDuplicateCheckRequest(BaseModel):
    title: str
    description: str
    category_id: int
    latitude: float
    longitude: float

class DuplicateMatchItem(BaseModel):
    complaint_id: str
    id: int
    title: str
    category_name: str
    similarity_score: float
    distance_meters: float
    status: str
    created_at: datetime

class AIDuplicateCheckResponse(BaseModel):
    is_likely_duplicate: bool
    highest_score: float
    potential_duplicates: List[DuplicateMatchItem]

class AISummaryRequest(BaseModel):
    description: str

class AISummaryResponse(BaseModel):
    summary: str
    reported_issue: str
    location_clues: str
    impact_assessment: str
    missing_information: List[str]

class ChatRequest(BaseModel):
    message: str
    language: str = "en"

class ChatResponse(BaseModel):
    reply: str
    suggested_actions: List[str] = []
    related_complaint_id: Optional[str] = None
