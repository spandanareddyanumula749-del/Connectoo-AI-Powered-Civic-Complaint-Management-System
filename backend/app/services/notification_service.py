from typing import Optional
from sqlalchemy.orm import Session
from app.models.models import Notification, User, Complaint

class NotificationService:
    @staticmethod
    def send_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        notification_type: str = "status_update",
        complaint_id: Optional[int] = None
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            complaint_id=complaint_id,
            title=title,
            message=message,
            type=notification_type,
            is_read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def notify_complaint_status_change(
        db: Session,
        complaint: Complaint,
        old_status: str,
        new_status: str,
        remarks: Optional[str] = None
    ):
        # 1. Notify the citizen who filed the complaint
        msg = f"Your civic report '{complaint.title}' ({complaint.complaint_id}) status has transitioned from '{old_status}' to '{new_status}'."
        if remarks:
            msg += f" Note: {remarks}"
        
        NotificationService.send_notification(
            db=db,
            user_id=complaint.citizen_id,
            title=f"Status Update: {complaint.complaint_id}",
            message=msg,
            notification_type="status_change",
            complaint_id=complaint.id
        )

        # 2. If assigned worker exists and changed, notify worker
        if complaint.assigned_worker_id:
            NotificationService.send_notification(
                db=db,
                user_id=complaint.assigned_worker_id,
                title=f"Task Status Change: {complaint.complaint_id}",
                message=f"Task '{complaint.title}' status updated to '{new_status}'.",
                notification_type="task_update",
                complaint_id=complaint.id
            )

notification_service = NotificationService()
