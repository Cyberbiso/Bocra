from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.dependencies import db_session, get_current_user
from app.models.entities import User
from app.models.schemas import AgentChatRequest
from app.services.agent import AgentService

router = APIRouter(tags=["agent"])


@router.post("/api/agent")
def agent_chat(
    payload: AgentChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    if not payload.messages:
        raise HTTPException(status_code=400, detail="messages is required and must be non-empty.")
    service = AgentService(db)
    _, stream = service.stream_chat(
        messages=[message.model_dump() for message in payload.messages],
        external_thread_id=payload.threadId,
        user=user,
    )
    return StreamingResponse(stream, media_type="text/plain; charset=utf-8", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
