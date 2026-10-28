from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Complaint, ComplaintStatus, ComplaintPriority, Category, Ward
from app.services.ai_duplicate import haversine_distance_meters

router = APIRouter(prefix="/map", tags=["Interactive Civic Map"])

@router.get("/markers")
def get_map_markers(
    category_id: Optional[int] = None,
    status: Optional[ComplaintStatus] = None,
    priority: Optional[ComplaintPriority] = None,
    ward_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    if category_id:
        query = query.filter(Complaint.category_id == category_id)
    if status:
        query = query.filter(Complaint.status == status)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if ward_id:
        query = query.filter(Complaint.ward_id == ward_id)

    complaints = query.all()
    markers = []
    for c in complaints:
        # Determine marker color based on severity
        color_map = {
            ComplaintPriority.CRITICAL: "#ef4444",  # Red
            ComplaintPriority.HIGH: "#f97316",      # Orange
            ComplaintPriority.MEDIUM: "#3b82f6",    # Blue
            ComplaintPriority.LOW: "#10b981"        # Green
        }
        marker_color = color_map.get(c.priority, "#6b7280")

        markers.append({
            "id": c.id,
            "complaint_id": c.complaint_id,
            "title": c.title,
            "category_name": c.category.name if c.category else "Civic Issue",
            "category_icon": c.category.icon_name if c.category else "AlertCircle",
            "department_name": c.department.name if c.department else "Municipal",
            "status": c.status.value,
            "priority": c.priority.value,
            "color": marker_color,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "address": c.landmark or c.address,  # Privacy safe landmark/area
            "created_at": c.created_at,
            "has_photos": len(c.attachments) > 0
        })

    return markers

@router.get("/nearby")
def get_nearby_complaints(
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius_meters: float = Query(1000.0, ge=50, le=10000),
    db: Session = Depends(get_db)
):
    complaints = db.query(Complaint).all()
    nearby = []
    for c in complaints:
        dist = haversine_distance_meters(latitude, longitude, c.latitude, c.longitude)
        if dist <= radius_meters:
            nearby.append({
                "id": c.id,
                "complaint_id": c.complaint_id,
                "title": c.title,
                "category_name": c.category.name if c.category else "General",
                "status": c.status.value,
                "priority": c.priority.value,
                "distance_meters": round(dist, 1),
                "latitude": c.latitude,
                "longitude": c.longitude,
                "address": c.landmark or c.address
            })
    nearby.sort(key=lambda x: x["distance_meters"])
    return nearby
