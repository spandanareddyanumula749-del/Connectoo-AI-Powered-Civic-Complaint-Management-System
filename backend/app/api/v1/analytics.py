import io
import csv
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.deps import get_current_admin
from app.models.models import (
    Complaint, ComplaintStatus, ComplaintPriority,
    Department, Category, Ward, Feedback, User
)
from app.services.ai_forecasting import forecasting_service

router = APIRouter(prefix="/analytics", tags=["Civic Analytics & Reporting"])

@router.get("/summary")
def get_dashboard_summary_metrics(db: Session = Depends(get_db)):
    """
    Computes live, database-backed summary metrics.
    """
    total = db.query(Complaint).count()
    new_submitted = db.query(Complaint).filter(Complaint.status == ComplaintStatus.SUBMITTED).count()
    in_progress = db.query(Complaint).filter(Complaint.status == ComplaintStatus.IN_PROGRESS).count()
    assigned = db.query(Complaint).filter(Complaint.status == ComplaintStatus.ASSIGNED).count()
    resolved = db.query(Complaint).filter(Complaint.status == ComplaintStatus.RESOLVED).count()
    reopened = db.query(Complaint).filter(Complaint.status == ComplaintStatus.REOPENED).count()
    escalated = db.query(Complaint).filter(Complaint.status == ComplaintStatus.ESCALATED).count()

    now = datetime.now(timezone.utc)
    overdue = db.query(Complaint).filter(
        Complaint.status.in_([ComplaintStatus.SUBMITTED, ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS]),
        Complaint.expected_resolution_at < now
    ).count()

    critical = db.query(Complaint).filter(Complaint.priority == ComplaintPriority.CRITICAL).count()

    # Calculate Average Resolution Time
    resolved_complaints = db.query(Complaint).filter(
        Complaint.status.in_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]),
        Complaint.resolved_at.isnot(None)
    ).all()

    avg_resolution_hours = 0.0
    if resolved_complaints:
        diffs = []
        for c in resolved_complaints:
            # Handle timezone-aware or naive datetimes safely
            res_at = c.resolved_at
            cr_at = c.created_at
            if res_at and cr_at:
                delta = (res_at - cr_at).total_seconds() / 3600.0
                if delta >= 0:
                    diffs.append(delta)
        if diffs:
            avg_resolution_hours = round(sum(diffs) / len(diffs), 1)

    # Citizen Satisfaction CSAT
    ratings = db.query(Feedback.rating).all()
    avg_csat = 0.0
    if ratings:
        avg_csat = round(sum(r[0] for r in ratings) / len(ratings), 2)

    return {
        "total_complaints": total,
        "newly_submitted": new_submitted,
        "in_progress": in_progress,
        "assigned": assigned,
        "resolved": resolved,
        "reopened": reopened,
        "escalated": escalated,
        "overdue_complaints": overdue,
        "critical_priority_complaints": critical,
        "average_resolution_hours": avg_resolution_hours,
        "citizen_satisfaction_score": avg_csat,
        "total_feedbacks_recorded": len(ratings)
    }

@router.get("/charts")
def get_analytics_charts_data(db: Session = Depends(get_db)):
    """
    Provides aggregated datasets for Recharts visualizations.
    """
    # 1. By Category
    cats = db.query(Category.name, func.count(Complaint.id)).join(Complaint, Complaint.category_id == Category.id, isouter=True).group_by(Category.name).all()
    by_category = [{"name": c[0], "count": c[1]} for c in cats if c[1] > 0]
    if not by_category:
        by_category = [{"name": c.name, "count": 0} for c in db.query(Category).limit(6).all()]

    # 2. By Priority
    pri_counts = db.query(Complaint.priority, func.count(Complaint.id)).group_by(Complaint.priority).all()
    by_priority = [{"priority": p[0].value, "count": p[1]} for p in pri_counts]

    # 3. By Ward
    wards = db.query(Ward.name, func.count(Complaint.id)).join(Complaint, Complaint.ward_id == Ward.id, isouter=True).group_by(Ward.name).all()
    by_ward = [{"ward": w[0], "count": w[1]} for w in wards if w[1] > 0]

    # 4. Department Performance (Resolved vs Pending)
    depts = db.query(Department).all()
    dept_perf = []
    for d in depts:
        tot = db.query(Complaint).filter(Complaint.department_id == d.id).count()
        res = db.query(Complaint).filter(Complaint.department_id == d.id, Complaint.status.in_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED])).count()
        dept_perf.append({
            "department": d.name,
            "code": d.code,
            "total": tot,
            "resolved": res,
            "pending": tot - res
        })

    # 5. Complaints Over Time (Last 6 Months or timeline intervals)
    all_complaints = db.query(Complaint.created_at).all()
    month_counts = {}
    for c in all_complaints:
        if c[0]:
            key = c[0].strftime("%b %Y")
            month_counts[key] = month_counts.get(key, 0) + 1
    
    complaints_over_time = [{"month": k, "complaints": v} for k, v in month_counts.items()]
    if not complaints_over_time:
        complaints_over_time = [{"month": "Oct 2026", "complaints": len(all_complaints)}]

    # 6. Status distribution
    status_counts = db.query(Complaint.status, func.count(Complaint.id)).group_by(Complaint.status).all()
    by_status = [{"status": s[0].value, "count": s[1]} for s in status_counts]

    # 7. CSAT Breakdown
    ratings_query = db.query(Feedback.rating, func.count(Feedback.id)).group_by(Feedback.rating).all()
    csat_breakdown = [{"rating": f"{r[0]} Stars", "count": r[1]} for r in ratings_query]

    return {
        "by_category": by_category,
        "by_priority": by_priority,
        "by_ward": by_ward,
        "by_status": by_status,
        "department_performance": dept_perf,
        "complaints_over_time": complaints_over_time,
        "csat_breakdown": csat_breakdown
    }

@router.get("/forecasting")
def get_predictive_civic_analytics(db: Session = Depends(get_db)):
    return forecasting_service.generate_civic_forecasts(db)

@router.get("/export-csv")
def export_complaints_csv(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Complaint ID", "Title", "Category", "Department", "Ward", "Priority",
        "Status", "Citizen Name", "Citizen Email", "Address", "Latitude", "Longitude",
        "AI Suggested Category", "AI Suggested Severity", "AI Confidence",
        "Expected Resolution", "Resolved At", "Created At"
    ])

    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    for c in complaints:
        writer.writerow([
            c.complaint_id,
            c.title,
            c.category.name if c.category else "",
            c.department.name if c.department else "",
            c.ward.name if c.ward else "",
            c.priority.value,
            c.status.value,
            c.citizen.full_name if c.citizen else "",
            c.citizen.email if c.citizen else "",
            c.address,
            c.latitude,
            c.longitude,
            c.ai_category_suggested or "",
            c.ai_severity_suggested or "",
            f"{int(c.ai_confidence_score * 100)}%" if c.ai_confidence_score else "",
            c.expected_resolution_at.strftime('%Y-%m-%d %H:%M') if c.expected_resolution_at else "",
            c.resolved_at.strftime('%Y-%m-%d %H:%M') if c.resolved_at else "",
            c.created_at.strftime('%Y-%m-%d %H:%M') if c.created_at else ""
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=connectoo_complaints_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"}
    )
