from fastapi import APIRouter
from app.api.v1 import (
    auth, complaints, admin, worker, analytics, ai, chat, map, feedback, notifications
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(complaints.router)
api_router.include_router(admin.router)
api_router.include_router(worker.router)
api_router.include_router(analytics.router)
api_router.include_router(ai.router)
api_router.include_router(chat.router)
api_router.include_router(map.router)
api_router.include_router(feedback.router)
api_router.include_router(notifications.router)
