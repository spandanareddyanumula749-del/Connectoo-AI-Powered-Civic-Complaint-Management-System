from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_worker
from app.models.models import (
    User, Complaint, ComplaintStatus, StatusHistory, Attachment
)
from app.schemas.schemas import ComplaintResponse
from app.api.v1.complaints import map_complaint_response
from app.services.notification_service import notification_service
from app.services.file_storage import file_storage

router = APIRouter(prefix="/worker", tags=["Field Worker"])

@router.get("/tasks", response_model=List[ComplaintResponse])
def get_worker_tasks(
    status_filter: Optional[ComplaintStatus] = None,
    current_worker: User = Depends(get_current_worker),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint).filter(Complaint.assigned_worker_id == current_worker.id)
    if status_filter:
        query = query.filter(Complaint.status == status_filter)
    tasks = query.order_by(Complaint.created_at.desc()).all()
    return [map_complaint_response(t) for t in tasks]

@router.patch("/tasks/{id}/start", response_model=ComplaintResponse)
def start_task_work(
    id: int,
    current_worker: User = Depends(get_current_worker),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    if complaint.assigned_worker_id != current_worker.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update tasks assigned directly to you.")

    if complaint.status not in [ComplaintStatus.ASSIGNED, ComplaintStatus.REOPENED, ComplaintStatus.ESCALATED]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot transition to In Progress from '{complaint.status.value}'.")

    old_status = complaint.status.value
    complaint.status = ComplaintStatus.IN_PROGRESS
    complaint.updated_at = datetime.now(timezone.utc)

    history = StatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=ComplaintStatus.IN_PROGRESS.value,
        changed_by_id=current_worker.id,
        remarks=f"Field officer {current_worker.full_name} has arrived on-site and commenced remediation."
    )
    db.add(history)

    # Notify Citizen
    notification_service.send_notification(
        db=db,
        user_id=complaint.citizen_id,
        title=f"Work In Progress: {complaint.complaint_id}",
        message=f"Officer {current_worker.full_name} is currently on-site working to resolve this issue.",
        notification_type="in_progress",
        complaint_id=complaint.id
    )

    db.commit()
    db.refresh(complaint)
    return map_complaint_response(complaint)

@router.post("/tasks/{id}/complete", response_model=ComplaintResponse)
async def complete_task_work(
    id: int,
    resolution_notes: str = Form(...),
    after_photo: Optional[UploadFile] = File(None),
    current_worker: User = Depends(get_current_worker),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    if complaint.assigned_worker_id != current_worker.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only complete tasks assigned directly to you.")

    now = datetime.now(timezone.utc)
    old_status = complaint.status.value
    complaint.status = ComplaintStatus.RESOLVED
    complaint.resolved_at = now
    complaint.updated_at = now

    # If photo evidence uploaded
    if after_photo:
        rel_path, orig_name, size_bytes = await file_storage.save_upload(after_photo, subfolder="completion_evidence")
        attachment = Attachment(
            complaint_id=complaint.id,
            uploaded_by_id=current_worker.id,
            file_path=rel_path,
            file_name=orig_name,
            file_type=after_photo.content_type or "image/jpeg",
            file_size=size_bytes,
            attachment_type="after_photo"
        )
        db.add(attachment)

    history = StatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=ComplaintStatus.RESOLVED.value,
        changed_by_id=current_worker.id,
        remarks=f"Remediation completed by {current_worker.full_name}. Resolution Notes: {resolution_notes}"
    )
    db.add(history)

    # Notify citizen and invite feedback rating
    notification_service.send_notification(
        db=db,
        user_id=complaint.citizen_id,
        title=f"Issue Resolved: {complaint.complaint_id}",
        message=f"Your civic issue has been resolved! Notes: '{resolution_notes}'. Please rate the resolution quality.",
        notification_type="resolved",
        complaint_id=complaint.id
    )

    db.commit()
    db.refresh(complaint)
    return map_complaint_response(complaint)
