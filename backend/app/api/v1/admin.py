from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_admin
from app.models.models import (
    User, UserRole, Complaint, ComplaintStatus, ComplaintPriority,
    Department, Category, Ward, ComplaintAssignment, StatusHistory, AuditLog
)
import secrets
from app.core.security import get_password_hash
from app.services.email_service import email_service
from app.services.ai_summary import summarizer_service
from app.schemas.schemas import (
    ComplaintResponse, ComplaintAssignRequest, ComplaintStatusUpdate,
    ComplaintPriorityUpdate, DepartmentResponse, DepartmentCreate,
    CategoryResponse, CategoryCreate, WorkerCreateRequest, UserResponse
)
from app.api.v1.complaints import map_complaint_response
from app.services.notification_service import notification_service
from app.services.escalation_service import escalation_service

router = APIRouter(prefix="/admin", tags=["Municipal Administrator"])

def log_admin_action(
    db: Session,
    user_id: int,
    action: str,
    resource_type: str,
    resource_id: str,
    details: str
):
    audit = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details
    )
    db.add(audit)
    db.commit()

@router.post("/complaints/{id}/assign", response_model=ComplaintResponse)
def assign_complaint(
    id: int,
    payload: ComplaintAssignRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    worker = db.query(User).filter(User.id == payload.worker_id, User.role == UserRole.WORKER).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid field worker specified.")

    old_status = complaint.status.value
    complaint.assigned_worker_id = worker.id

    if payload.department_id:
        dept = db.query(Department).filter(Department.id == payload.department_id).first()
        if dept:
            complaint.department_id = dept.id

    if payload.priority:
        complaint.priority = payload.priority

    complaint.status = ComplaintStatus.ASSIGNED
    complaint.updated_at = datetime.now(timezone.utc)

    # Deactivate previous active assignments
    db.query(ComplaintAssignment).filter(
        ComplaintAssignment.complaint_id == complaint.id
    ).update({"is_current": False})

    # Create new assignment record
    assignment = ComplaintAssignment(
        complaint_id=complaint.id,
        worker_id=worker.id,
        assigned_by_id=current_admin.id,
        notes=payload.notes or "Assigned by Municipal Administrator",
        is_current=True
    )
    db.add(assignment)

    # Log status history
    history = StatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=ComplaintStatus.ASSIGNED.value,
        changed_by_id=current_admin.id,
        remarks=f"Assigned to field worker {worker.full_name}. Notes: {payload.notes or 'None'}"
    )
    db.add(history)

    # Log audit
    log_admin_action(
        db=db,
        user_id=current_admin.id,
        action="ASSIGN_COMPLAINT",
        resource_type="Complaint",
        resource_id=str(complaint.id),
        details=f"Assigned {complaint.complaint_id} to worker {worker.full_name} ({worker.email})"
    )

    # Notify Citizen
    notification_service.send_notification(
        db=db,
        user_id=complaint.citizen_id,
        title=f"Worker Dispatched: {complaint.complaint_id}",
        message=f"Officer {worker.full_name} has been assigned to address your complaint.",
        notification_type="assigned",
        complaint_id=complaint.id
    )

    # Notify Worker
    notification_service.send_notification(
        db=db,
        user_id=worker.id,
        title=f"New Task Assigned: {complaint.complaint_id}",
        message=f"You have been assigned '{complaint.title}' at {complaint.address}. Priority: {complaint.priority.value}.",
        notification_type="task_assigned",
        complaint_id=complaint.id
    )

    db.commit()
    db.refresh(complaint)
    return map_complaint_response(complaint)

@router.patch("/complaints/{id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    id: int,
    payload: ComplaintStatusUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    old_status = complaint.status.value
    new_status = payload.status

    complaint.status = new_status
    now = datetime.now(timezone.utc)
    complaint.updated_at = now

    if new_status == ComplaintStatus.RESOLVED and not complaint.resolved_at:
        complaint.resolved_at = now
    elif new_status == ComplaintStatus.CLOSED:
        complaint.closed_at = now

    history = StatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=new_status.value,
        changed_by_id=current_admin.id,
        remarks=payload.remarks or f"Status changed to {new_status.value} by Administrator"
    )
    db.add(history)

    log_admin_action(
        db=db,
        user_id=current_admin.id,
        action="UPDATE_STATUS",
        resource_type="Complaint",
        resource_id=str(complaint.id),
        details=f"Status changed from {old_status} to {new_status.value}. Reason: {payload.remarks}"
    )

    notification_service.notify_complaint_status_change(
        db=db,
        complaint=complaint,
        old_status=old_status,
        new_status=new_status.value,
        remarks=payload.remarks
    )

    db.commit()
    db.refresh(complaint)
    return map_complaint_response(complaint)

@router.patch("/complaints/{id}/priority", response_model=ComplaintResponse)
def override_priority(
    id: int,
    payload: ComplaintPriorityUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    old_pri = complaint.priority.value
    complaint.priority = payload.priority
    complaint.updated_at = datetime.now(timezone.utc)

    log_admin_action(
        db=db,
        user_id=current_admin.id,
        action="OVERRIDE_PRIORITY",
        resource_type="Complaint",
        resource_id=str(complaint.id),
        details=f"Admin overrode priority from {old_pri} to {payload.priority.value}. Reason: {payload.remarks}"
    )

    db.commit()
    db.refresh(complaint)
    return map_complaint_response(complaint)

@router.post("/complaints/{id}/duplicate/dismiss", response_model=ComplaintResponse)
def dismiss_duplicate(
    id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    complaint.is_duplicate_of_id = None
    complaint.duplicate_similarity_score = 0.0

    log_admin_action(
        db=db,
        user_id=current_admin.id,
        action="DISMISS_DUPLICATE",
        resource_type="Complaint",
        resource_id=str(complaint.id),
        details="Admin confirmed complaint is distinct and dismissed duplicate flag."
    )
    db.commit()
    db.refresh(complaint)
    return map_complaint_response(complaint)

@router.get("/departments", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    results = []
    for d in depts:
        active_count = db.query(Complaint).filter(
            Complaint.department_id == d.id,
            Complaint.status.in_([ComplaintStatus.SUBMITTED, ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS])
        ).count()
        results.append(DepartmentResponse(
            id=d.id,
            name=d.name,
            code=d.code,
            description=d.description,
            head_email=d.head_email,
            phone=d.phone,
            sla_hours_default=d.sla_hours_default,
            created_at=d.created_at,
            active_complaints_count=active_count
        ))
    return results

@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    dept_in: DepartmentCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(Department).filter(Department.code == dept_in.code.upper()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Department code already exists.")
    
    dept = Department(
        name=dept_in.name,
        code=dept_in.code.upper(),
        description=dept_in.description,
        head_email=dept_in.head_email,
        phone=dept_in.phone,
        sla_hours_default=dept_in.sla_hours_default
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return DepartmentResponse(
        id=dept.id,
        name=dept.name,
        code=dept.code,
        description=dept.description,
        head_email=dept.head_email,
        phone=dept.phone,
        sla_hours_default=dept.sla_hours_default,
        created_at=dept.created_at,
        active_complaints_count=0
    )

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).all()
    return [
        CategoryResponse(
            id=c.id,
            name=c.name,
            slug=c.slug,
            department_id=c.department_id,
            department_name=c.department.name if c.department else None,
            sla_hours=c.sla_hours,
            icon_name=c.icon_name,
            keywords=c.keywords
        ) for c in cats
    ]

@router.get("/audit-logs")
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": l.id,
            "user_name": l.user.full_name if l.user else "System",
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "details": l.details,
            "created_at": l.created_at
        } for l in logs
    ]

@router.post("/escalation/trigger")
def trigger_escalation_sweep(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    count = escalation_service.check_and_escalate_overdue_complaints(db)
    return {"message": f"Escalation sweep finished: {count} complaints marked as overdue and escalated."}

@router.post("/workers", status_code=status.HTTP_201_CREATED)
def create_worker_account(
    worker_in: WorkerCreateRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin-only: Provisions a new Field Worker account with department assignment
    and sends an invitation email with credentials.
    """
    clean_email = worker_in.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An account with this email already exists.")

    dept = db.query(Department).filter(Department.id == worker_in.department_id).first()
    if not dept:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected department does not exist.")

    # Generate temporary password if not provided
    temp_password = worker_in.password if worker_in.password else f"Work@{secrets.token_hex(4)}"

    worker = User(
        email=clean_email,
        hashed_password=get_password_hash(temp_password),
        full_name=worker_in.full_name.strip(),
        phone=worker_in.phone.strip() if worker_in.phone else None,
        role=UserRole.WORKER,
        department_id=dept.id,
        is_active=True,
        is_verified=True  # Workers provisioned by admin are pre-verified
    )
    db.add(worker)
    db.commit()
    db.refresh(worker)

    # Send invitation email
    sent, email_msg = email_service.send_worker_invitation_email(
        to_email=worker.email,
        full_name=worker.full_name,
        temp_password=temp_password,
        department_name=dept.name
    )

    log_admin_action(
        db=db,
        user_id=current_admin.id,
        action="PROVISION_WORKER",
        resource_type="User",
        resource_id=str(worker.id),
        details=f"Admin {current_admin.email} provisioned worker {worker.email} for {dept.name}. Dispatch: {email_msg}"
    )

    return {
        "message": f"Worker account provisioned for {worker.full_name}.",
        "worker": UserResponse.model_validate(worker),
        "temporary_password": temp_password,
        "email_dispatched": sent
    }

@router.patch("/workers/{worker_id}/toggle-status")
def toggle_worker_status(
    worker_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    worker = db.query(User).filter(User.id == worker_id, User.role == UserRole.WORKER).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found.")

    worker.is_active = not worker.is_active
    db.commit()
    db.refresh(worker)

    state = "activated" if worker.is_active else "deactivated"
    log_admin_action(
        db=db,
        user_id=current_admin.id,
        action="TOGGLE_WORKER_STATUS",
        resource_type="User",
        resource_id=str(worker.id),
        details=f"Worker {worker.email} account {state}."
    )
    return {"message": f"Worker account {state}.", "worker": UserResponse.model_validate(worker)}

@router.post("/complaints/{id}/summarize")
def summarize_complaint(
    id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    summary_result = summarizer_service.summarize(complaint.description)
    return summary_result

