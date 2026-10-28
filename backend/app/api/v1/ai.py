from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Category, Department
from app.schemas.schemas import (
    AIClassifyRequest, AIClassifyResponse,
    AISeverityRequest, AISeverityResponse,
    AIDuplicateCheckRequest, AIDuplicateCheckResponse, DuplicateMatchItem,
    AISummaryRequest, AISummaryResponse
)
from app.services.ai_classifier import classifier_service
from app.services.ai_severity import severity_service
from app.services.ai_duplicate import duplicate_detector_service
from app.services.ai_summary import summarizer_service
from app.services.ai_vision import vision_service
from app.services.file_storage import file_storage

router = APIRouter(prefix="/ai", tags=["AI Services"])

@router.post("/classify", response_model=AIClassifyResponse)
def classify_text(payload: AIClassifyRequest, db: Session = Depends(get_db)):
    result = classifier_service.classify(payload.text)
    
    # Resolve Category and Department IDs from DB
    cat = db.query(Category).filter(Category.name == result["category_name"]).first()
    dept = db.query(Department).filter(Department.code == result["department_code"]).first()
    
    cat_id = cat.id if cat else 1
    dept_id = dept.id if dept else (cat.department_id if cat else 1)

    return AIClassifyResponse(
        suggested_category_id=cat_id,
        suggested_category_name=result["category_name"],
        suggested_department_id=dept_id,
        suggested_department_name=result["department_name"],
        confidence=result["confidence"],
        suggested_next_action=result["suggested_next_action"]
    )

@router.post("/severity", response_model=AISeverityResponse)
def predict_severity(payload: AISeverityRequest, db: Session = Depends(get_db)):
    cat_name = ""
    if payload.category_id:
        cat = db.query(Category).filter(Category.id == payload.category_id).first()
        if cat:
            cat_name = cat.name

    result = severity_service.evaluate(payload.title, payload.description, cat_name)
    return AISeverityResponse(
        severity=result["severity"],
        confidence=result["confidence"],
        reasoning=result["reasoning"],
        risk_factors=result["risk_factors"]
    )

@router.post("/duplicate-check", response_model=AIDuplicateCheckResponse)
def check_duplicate_complaint(payload: AIDuplicateCheckRequest, db: Session = Depends(get_db)):
    result = duplicate_detector_service.find_potential_duplicates(
        db=db,
        title=payload.title,
        description=payload.description,
        category_id=payload.category_id,
        latitude=payload.latitude,
        longitude=payload.longitude
    )
    items = [
        DuplicateMatchItem(
            complaint_id=m["complaint_id"],
            id=m["id"],
            title=m["title"],
            category_name=m["category_name"],
            similarity_score=m["similarity_score"],
            distance_meters=m["distance_meters"],
            status=m["status"],
            created_at=m["created_at"]
        ) for m in result["potential_duplicates"]
    ]
    return AIDuplicateCheckResponse(
        is_likely_duplicate=result["is_likely_duplicate"],
        highest_score=result["highest_score"],
        potential_duplicates=items
    )

@router.post("/summarize", response_model=AISummaryResponse)
def summarize_complaint(payload: AISummaryRequest):
    result = summarizer_service.summarize(payload.description)
    return AISummaryResponse(
        summary=result["summary"],
        reported_issue=result["reported_issue"],
        location_clues=result["location_clues"],
        impact_assessment=result["impact_assessment"],
        missing_information=result["missing_information"]
    )

@router.post("/vision")
async def analyze_image_issue(file: UploadFile = File(...)):
    rel_path, orig_name, size_bytes = await file_storage.save_upload(file, subfolder="vision_temp")
    # Resolve physical absolute file path for analysis
    import os
    from app.core.config import settings
    full_path = os.path.join(settings.UPLOAD_DIR, "vision_temp", os.path.basename(rel_path))
    analysis = vision_service.analyze_image(full_path)
    analysis["file_url"] = rel_path
    return analysis
