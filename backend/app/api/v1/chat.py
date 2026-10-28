from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user_optional
from app.models.models import User
from app.schemas.schemas import ChatRequest, ChatResponse
from app.services.ai_chatbot import chatbot_service

router = APIRouter(prefix="/chat", tags=["Civic AI Chatbot"])

@router.post("/", response_model=ChatResponse)
def chat_with_civic_ai(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    result = chatbot_service.process_query(
        message=payload.message,
        user=current_user,
        db=db
    )
    return ChatResponse(
        reply=result["reply"],
        suggested_actions=result.get("suggested_actions", []),
        related_complaint_id=result.get("related_complaint_id")
    )
