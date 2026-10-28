from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Complaint, ComplaintStatus, Feedback, StatusHistory
from app.schemas.schemas import FeedbackCreate, FeedbackResponse

router = APIRouter(prefix="/feedback", tags=["Citizen Feedback & CSAT"])

@router.post("/{complaint_id}", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_resolution_feedback(
    complaint_id: int,
    feedback_in: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    if complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the reporting citizen can submit feedback for this complaint.")

    if complaint.status not in [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Feedback can only be submitted for Resolved or Closed complaints.")

    # Check if feedback already submitted
    existing = db.query(Feedback).filter(Feedback.complaint_id == complaint.id).first()
    if existing:
        existing.rating = feedback_in.rating
        existing.review_text = feedback_in.review_text
        db.commit()
        db.refresh(existing)
        fb = existing
    else:
        fb = Feedback(
            complaint_id=complaint.id,
            citizen_id=current_user.id,
            rating=feedback_in.rating,
            review_text=feedback_in.review_text
        )
        db.add(fb)

    # If currently Resolved, transition to Closed upon citizen rating satisfaction
    if complaint.status == ComplaintStatus.RESOLVED:
        old_status = complaint.status.value
        complaint.status = ComplaintStatus.CLOSED
        complaint.closed_at = datetime.now(timezone.utc)
        hist = StatusHistory(
            complaint_id=complaint.id,
            old_status=old_status,
            new_status=ComplaintStatus.CLOSED.value,
            changed_by_id=current_user.id,
            remarks=f"Citizen submitted {feedback_in.rating}-star review; complaint officially confirmed and closed."
        )
        db.add(hist)

    db.commit()
    db.refresh(fb)

    return FeedbackResponse(
        id=fb.id,
        complaint_id=fb.complaint_id,
        citizen_id=fb.citizen_id,
        citizen_name=current_user.full_name,
        rating=fb.rating,
        review_text=fb.review_text,
        created_at=fb.created_at
    )

@router.get("/recent", response_model=List[FeedbackResponse])
def get_recent_feedback(db: Session = Depends(get_db)):
    feedbacks = db.query(Feedback).order_by(Feedback.created_at.desc()).limit(10).all()
    return [
        FeedbackResponse(
            id=f.id,
            complaint_id=f.complaint_id,
            citizen_id=f.citizen_id,
            citizen_name=f.citizen.full_name if f.citizen else "Citizen",
            rating=f.rating,
            review_text=f.review_text,
            created_at=f.created_at
        ) for f in feedbacks
    ]
