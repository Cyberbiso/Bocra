from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import db_session
from app.models.schemas import PublicChatRequest
from app.services.portal import PublicService
from app.views.presenters import present_public_chat, present_statistics

router = APIRouter(tags=["public"])


@router.get("/api/statistics")
def statistics(db: Session = Depends(db_session)):
    return present_statistics(PublicService(db).statistics())


@router.post("/api/chat")
def public_chat(payload: PublicChatRequest, db: Session = Depends(db_session)):
    return present_public_chat(PublicService(db).chat(payload.message))
