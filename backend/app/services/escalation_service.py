from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.models import Complaint, ComplaintStatus, StatusHistory, User, UserRole
from app.services.notification_service import notification_service

class EscalationService:
    @staticmethod
    def check_and_escalate_overdue_complaints(db: Session) -> int:
        """
        Scans uncompleted complaints. If current time > expected_resolution_at and not yet escalated,
        transitions them to ESCALATED status, records history, and notifies administrators.
        """
        now = datetime.now(timezone.utc)
        overdue_complaints = db.query(Complaint).filter(
            Complaint.status.in_([ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW, ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS]),
            Complaint.expected_resolution_at < now
        ).all()

        escalated_count = 0
        admin_users = db.query(User).filter(User.role == UserRole.ADMIN).all()

        for comp in overdue_complaints:
            old_status = comp.status.value
            comp.status = ComplaintStatus.ESCALATED
            escalated_count += 1

            # Log status history
            history = StatusHistory(
                complaint_id=comp.id,
                old_status=old_status,
                new_status=ComplaintStatus.ESCALATED.value,
                changed_by_id=comp.citizen_id,  # System attribution or citizen
                remarks=f"Automatic SLA breach escalation: resolution deadline elapsed on {comp.expected_resolution_at.strftime('%Y-%m-%d %H:%M UTC')}."
            )
            db.add(history)

            # Notify Citizen
            notification_service.send_notification(
                db=db,
                user_id=comp.citizen_id,
                title=f"Complaint Escalated: {comp.complaint_id}",
                message=f"Your complaint has exceeded target SLA turnaround and has been automatically escalated to senior municipal leadership for expedited handling.",
                notification_type="escalation",
                complaint_id=comp.id
            )

            # Notify Admins
            for admin in admin_users:
                notification_service.send_notification(
                    db=db,
                    user_id=admin.id,
                    title=f"SLA Breach Escalation Alert: {comp.complaint_id}",
                    message=f"Complaint '{comp.title}' ({comp.priority.value} priority) breached deadline and is now ESCALATED.",
                    notification_type="admin_alert",
                    complaint_id=comp.id
                )

        if overdue_complaints:
            db.commit()

        return escalated_count

escalation_service = EscalationService()
