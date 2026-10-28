import random
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_user_optional, require_role
from app.models.models import (
    Complaint, ComplaintStatus, ComplaintPriority, User, UserRole,
    Category, Department, Ward, StatusHistory, Comment, Attachment, Feedback
)
from app.schemas.schemas import (
    ComplaintCreate, ComplaintResponse, ComplaintDetailResponse,
    CommentCreate, CommentResponse, StatusHistoryResponse, AttachmentResponse,
    FeedbackResponse, ComplaintUpdateRequest, ComplaintWithdrawRequest
)
from app.services.ai_classifier import classifier_service
from app.services.ai_severity import severity_service
from app.services.ai_sla import sla_service
from app.services.ai_duplicate import duplicate_detector_service
from app.services.ai_multilingual import multilingual_service
from app.services.notification_service import notification_service
from app.services.file_storage import file_storage

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def generate_complaint_id(db: Session) -> str:
    year = datetime.now().year
    while True:
        num = random.randint(10000, 99999)
        candidate = f"CIV-{year}-{num}"
        if not db.query(Complaint).filter(Complaint.complaint_id == candidate).first():
            return candidate

def map_complaint_response(c: Complaint, mask_citizen: bool = False) -> ComplaintResponse:
    citizen_name = None
    citizen_phone = None
    if c.citizen:
        if mask_citizen:
            # Mask citizen details for public tracking
            citizen_name = f"{c.citizen.full_name[:2]}*** {c.citizen.full_name.split()[-1][0]}***" if len(c.citizen.full_name) > 3 else "Citizen"
            citizen_phone = None
        else:
            citizen_name = c.citizen.full_name
            citizen_phone = c.citizen.phone

    return ComplaintResponse(
        id=c.id,
        complaint_id=c.complaint_id,
        title=c.title,
        description=c.description,
        original_language=c.original_language or "en",
        translated_text=c.translated_text,
        category_id=c.category_id,
        category_name=c.category.name if c.category else None,
        department_id=c.department_id,
        department_name=c.department.name if c.department else None,
        ward_id=c.ward_id,
        ward_name=c.ward.name if c.ward else None,
        citizen_id=c.citizen_id,
        citizen_name=citizen_name,
        citizen_phone=citizen_phone,
        assigned_worker_id=c.assigned_worker_id,
        assigned_worker_name=c.assigned_worker.full_name if c.assigned_worker else None,
        status=c.status,
        priority=c.priority,
        latitude=c.latitude,
        longitude=c.longitude,
        address=c.address,
        landmark=c.landmark,
        ai_category_suggested=c.ai_category_suggested,
        ai_severity_suggested=c.ai_severity_suggested,
        ai_confidence_score=c.ai_confidence_score,
        ai_reasoning=c.ai_reasoning,
        ai_estimated_hours=c.ai_estimated_hours,
        is_duplicate_of_id=c.is_duplicate_of_id,
        expected_resolution_at=c.expected_resolution_at,
        resolved_at=c.resolved_at,
        reopened_count=c.reopened_count,
        created_at=c.created_at,
        updated_at=c.updated_at,
        attachments=[AttachmentResponse.model_validate(a) for a in c.attachments],
        feedback=FeedbackResponse(
            id=c.feedback.id,
            complaint_id=c.feedback.complaint_id,
            citizen_id=c.feedback.citizen_id,
            citizen_name=c.feedback.citizen.full_name if (c.feedback.citizen) else (c.citizen.full_name if c.citizen else "Citizen"),
            rating=c.feedback.rating,
            review_text=c.feedback.review_text,
            created_at=c.feedback.created_at
        ) if c.feedback else None
    )

@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def submit_complaint(
    payload: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify Category
    category = db.query(Category).filter(Category.id == payload.category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected category does not exist.")

    department = db.query(Department).filter(Department.id == category.department_id).first()
    if not department:
        department = db.query(Department).first()

    # 1. AI Multilingual Processing
    lang = multilingual_service.detect_language(f"{payload.title} {payload.description}")
    translation_info = multilingual_service.translate_to_english(payload.description, lang)
    translated_text = translation_info["translated_text"] if translation_info["is_translated"] else None

    # 2. AI Classification Check
    ai_class = classifier_service.classify(f"{payload.title} {payload.description}")

    # 3. AI Severity Assessment
    ai_sev = severity_service.evaluate(payload.title, payload.description, category.name)
    priority = payload.override_priority if payload.override_priority else ai_sev["severity"]

    # 4. AI SLA Estimation
    sla_info = sla_service.estimate_resolution_time(
        category_name=category.name,
        priority=priority,
        department_id=department.id,
        db=db
    )

    # 5. Duplicate Check
    dup_info = duplicate_detector_service.find_potential_duplicates(
        db=db,
        title=payload.title,
        description=payload.description,
        category_id=category.id,
        latitude=payload.latitude,
        longitude=payload.longitude
    )

    complaint_code = generate_complaint_id(db)
    now = datetime.now(timezone.utc)
    expected_sla_at = now + timedelta(hours=int(sla_info["estimated_hours"]))

    complaint = Complaint(
        complaint_id=complaint_code,
        title=payload.title,
        description=payload.description,
        original_language=lang,
        translated_text=translated_text,
        category_id=category.id,
        department_id=department.id,
        ward_id=payload.ward_id,
        citizen_id=current_user.id,
        status=ComplaintStatus.SUBMITTED,
        priority=priority,
        latitude=payload.latitude,
        longitude=payload.longitude,
        address=payload.address,
        landmark=payload.landmark,
        ai_category_suggested=ai_class["category_name"],
        ai_severity_suggested=ai_sev["severity"].value,
        ai_confidence_score=ai_class["confidence"],
        ai_reasoning=ai_sev["reasoning"],
        ai_estimated_hours=sla_info["estimated_hours"],
        is_duplicate_of_id=dup_info["potential_duplicates"][0]["id"] if dup_info["is_likely_duplicate"] else None,
        duplicate_similarity_score=dup_info["highest_score"] if dup_info["is_likely_duplicate"] else None,
        expected_resolution_at=expected_sla_at,
        created_at=now,
        updated_at=now
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # Log initial status change
    history = StatusHistory(
        complaint_id=complaint.id,
        old_status=None,
        new_status=ComplaintStatus.SUBMITTED.value,
        changed_by_id=current_user.id,
        remarks="Complaint filed by citizen. AI automated triage completed."
    )
    db.add(history)

    # Send Notification to Citizen
    notification_service.send_notification(
        db=db,
        user_id=current_user.id,
        title="Civic Issue Submitted",
        message=f"Your complaint '{complaint.title}' has been registered with ID {complaint.complaint_id}. Our municipal team will review it shortly.",
        notification_type="submitted",
        complaint_id=complaint.id
    )

    db.commit()
    db.refresh(complaint)
    return map_complaint_response(complaint)

@router.get("/", response_model=List[ComplaintResponse])
def list_complaints(
    status: Optional[ComplaintStatus] = None,
    category_id: Optional[int] = None,
    department_id: Optional[int] = None,
    priority: Optional[ComplaintPriority] = None,
    ward_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    sort_by: str = Query("created_at", pattern="^(created_at|priority|status|title)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)

    # Enforce Role-Based Access Control
    if current_user.role == UserRole.CITIZEN:
        query = query.filter(Complaint.citizen_id == current_user.id)
    elif current_user.role == UserRole.WORKER:
        query = query.filter(Complaint.assigned_worker_id == current_user.id)
    # Admin has access to all records

    if status:
        query = query.filter(Complaint.status == status)
    if category_id:
        query = query.filter(Complaint.category_id == category_id)
    if department_id:
        query = query.filter(Complaint.department_id == department_id)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if ward_id:
        query = query.filter(Complaint.ward_id == ward_id)
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Complaint.title.ilike(search_fmt),
                Complaint.description.ilike(search_fmt),
                Complaint.complaint_id.ilike(search_fmt),
                Complaint.address.ilike(search_fmt)
            )
        )

    # Sorting
    sort_col = getattr(Complaint, sort_by)
    if sort_order == "desc":
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(asc(sort_col))

    results = query.offset(skip).limit(limit).all()
    return [map_complaint_response(c) for c in results]

@router.get("/my", response_model=List[ComplaintResponse])
def get_my_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    results = db.query(Complaint).filter(Complaint.citizen_id == current_user.id).order_by(desc(Complaint.created_at)).all()
    return [map_complaint_response(c) for c in results]

@router.get("/track/{complaint_id}", response_model=ComplaintResponse)
def track_complaint(
    complaint_id: str,
    db: Session = Depends(get_db)
):
    c = db.query(Complaint).filter(Complaint.complaint_id == complaint_id.strip().upper()).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No complaint found matching '{complaint_id}'.")
    return map_complaint_response(c, mask_citizen=True)

@router.get("/{id_or_code}", response_model=ComplaintDetailResponse)
def get_complaint_detail(
    id_or_code: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    if id_or_code.isdigit():
        complaint = query.filter(Complaint.id == int(id_or_code)).first()
    else:
        complaint = query.filter(Complaint.complaint_id == id_or_code.strip().upper()).first()

    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    # Enforce role-based access control
    mask_citizen = False
    if current_user:
        if current_user.role == UserRole.CITIZEN and complaint.citizen_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to view another citizen's complaint details.")
        elif current_user.role == UserRole.WORKER and complaint.assigned_worker_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view complaints assigned directly to you.")
    else:
        mask_citizen = True

    base_resp = map_complaint_response(complaint, mask_citizen=mask_citizen)

    # Format status history
    history_list = [
        StatusHistoryResponse(
            id=h.id,
            complaint_id=h.complaint_id,
            old_status=h.old_status,
            new_status=h.new_status,
            changed_by_name=h.changed_by.full_name if h.changed_by else "System",
            remarks=h.remarks,
            created_at=h.created_at
        ) for h in complaint.status_history
    ]

    # Format comments
    comments_list = [
        CommentResponse(
            id=comm.id,
            complaint_id=comm.complaint_id,
            user_id=comm.user_id,
            author_name=comm.author.full_name if comm.author else "Anonymous",
            author_role=comm.author.role.value if comm.author else "citizen",
            content=comm.content,
            is_internal=comm.is_internal,
            created_at=comm.created_at
        ) for comm in complaint.comments
    ]

    return ComplaintDetailResponse(
        **base_resp.model_dump(),
        status_history=history_list,
        comments=comments_list
    )

@router.put("/{id}", response_model=ComplaintResponse)
def edit_complaint(
    id: int,
    payload: ComplaintUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    if current_user.role != UserRole.ADMIN and complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the reporting citizen can edit this complaint.")

    if complaint.status != ComplaintStatus.SUBMITTED and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Complaints can only be edited while still in Submitted status.")

    if payload.title is not None:
        complaint.title = payload.title
    if payload.description is not None:
        complaint.description = payload.description
    if payload.landmark is not None:
        complaint.landmark = payload.landmark
    if payload.address is not None:
        complaint.address = payload.address

    complaint.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(complaint)
    return map_complaint_response(complaint)

@router.post("/{id}/withdraw", response_model=ComplaintResponse)
def withdraw_complaint(
    id: int,
    payload: ComplaintWithdrawRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    if current_user.role != UserRole.ADMIN and complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the reporting citizen can withdraw this complaint.")

    if complaint.status not in [ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW] and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Complaint cannot be withdrawn once assigned or in progress.")

    old_status = complaint.status.value
    complaint.status = ComplaintStatus.CLOSED
    complaint.closed_at = datetime.now(timezone.utc)
    complaint.updated_at = datetime.now(timezone.utc)

    history = StatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=ComplaintStatus.CLOSED.value,
        changed_by_id=current_user.id,
        remarks=f"Withdrawn by citizen. Reason: {payload.reason or 'No reason provided'}"
    )
    db.add(history)
    db.commit()
    db.refresh(complaint)
    return map_complaint_response(complaint)

@router.post("/{id}/reopen", response_model=ComplaintResponse)
def reopen_complaint(
    id: int,
    remarks: str = Form("Issue unresolved; civic problem has resurfaced."),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    if current_user.role != UserRole.ADMIN and complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the reporting citizen or admin can reopen this issue.")

    if complaint.status not in [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only Resolved or Closed issues can be reopened.")

    old_status = complaint.status.value
    complaint.status = ComplaintStatus.REOPENED
    complaint.reopened_count += 1
    complaint.updated_at = datetime.now(timezone.utc)

    # Status history
    hist = StatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=ComplaintStatus.REOPENED.value,
        changed_by_id=current_user.id,
        remarks=f"Reopened by citizen: {remarks}"
    )
    db.add(hist)

    # Notify Assigned worker & Admin
    if complaint.assigned_worker_id:
        notification_service.send_notification(
            db=db,
            user_id=complaint.assigned_worker_id,
            title=f"Complaint Reopened: {complaint.complaint_id}",
            message=f"Citizen has reopened ticket '{complaint.title}' stating: {remarks}",
            notification_type="reopened",
            complaint_id=complaint.id
        )

    db.commit()
    db.refresh(complaint)
    return map_complaint_response(complaint)

@router.post("/{id}/comments", response_model=CommentResponse)
def add_comment(
    id: int,
    comment_in: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    # Internal comments restricted to staff
    is_internal = comment_in.is_internal and current_user.role in [UserRole.ADMIN, UserRole.WORKER]

    new_comment = Comment(
        complaint_id=complaint.id,
        user_id=current_user.id,
        content=comment_in.content,
        is_internal=is_internal
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    # If staff commented, notify citizen (if not internal)
    if not is_internal and current_user.id != complaint.citizen_id:
        notification_service.send_notification(
            db=db,
            user_id=complaint.citizen_id,
            title=f"New Update on {complaint.complaint_id}",
            message=f"{current_user.full_name} commented: '{comment_in.content[:100]}...'",
            notification_type="comment",
            complaint_id=complaint.id
        )

    return CommentResponse(
        id=new_comment.id,
        complaint_id=new_comment.complaint_id,
        user_id=new_comment.user_id,
        author_name=current_user.full_name,
        author_role=current_user.role.value,
        content=new_comment.content,
        is_internal=new_comment.is_internal,
        created_at=new_comment.created_at
    )

@router.post("/{id}/attachments", response_model=AttachmentResponse)
async def upload_attachment(
    id: int,
    file: UploadFile = File(...),
    attachment_type: str = Form("evidence"),  # evidence, before_photo, after_photo
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    rel_path, orig_name, size_bytes = await file_storage.save_upload(file, subfolder=attachment_type)

    attachment = Attachment(
        complaint_id=complaint.id,
        uploaded_by_id=current_user.id,
        file_path=rel_path,
        file_name=orig_name,
        file_type=file.content_type or "image/jpeg",
        file_size=size_bytes,
        attachment_type=attachment_type
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return AttachmentResponse.model_validate(attachment)
