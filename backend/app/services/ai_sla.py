from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import Complaint, ComplaintStatus, ComplaintPriority

BASE_HOURS_PER_CATEGORY = {
    "Potholes and damaged roads": 72.0,
    "Garbage accumulation": 24.0,
    "Water leakage and water supply": 18.0,
    "Drainage and sewage problems": 36.0,
    "Broken streetlights": 24.0,
    "Damaged footpaths": 96.0,
    "Illegal dumping": 48.0,
    "Public park maintenance": 72.0,
    "Traffic signals and road safety": 16.0,
    "Other civic issues": 48.0
}

PRIORITY_MULTIPLIER = {
    ComplaintPriority.CRITICAL: 0.40,  # Emergency response
    ComplaintPriority.HIGH: 0.70,
    ComplaintPriority.MEDIUM: 1.00,
    ComplaintPriority.LOW: 1.35
}

class AISLAResolutionEstimator:
    def estimate_resolution_time(
        self,
        category_name: str,
        priority: ComplaintPriority,
        department_id: Optional[int] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        base_hours = BASE_HOURS_PER_CATEGORY.get(category_name, 48.0)
        pri_factor = PRIORITY_MULTIPLIER.get(priority, 1.0)

        # Workload factor: check count of uncompleted tasks in that department
        workload_factor = 1.0
        active_dept_count = 0
        if db and department_id:
            try:
                active_dept_count = db.query(Complaint).filter(
                    Complaint.department_id == department_id,
                    Complaint.status.in_([ComplaintStatus.SUBMITTED, ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS])
                ).count()
                if active_dept_count > 15:
                    workload_factor = 1.35
                elif active_dept_count > 8:
                    workload_factor = 1.15
            except Exception:
                pass

        estimated_hours = round(base_hours * pri_factor * workload_factor, 1)

        # Confidence calculation based on data availability
        confidence = 0.85 if db else 0.75

        return {
            "estimated_hours": estimated_hours,
            "estimated_days": round(estimated_hours / 24.0, 1),
            "confidence": confidence,
            "base_hours": base_hours,
            "workload_factor": workload_factor,
            "department_backlog": active_dept_count,
            "explanation": f"Estimated {estimated_hours}h based on {category_name} baseline ({base_hours}h), {priority.value} urgency factor ({pri_factor}x), and active department queue ({active_dept_count} tickets)."
        }

sla_service = AISLAResolutionEstimator()
