from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import db_session, get_current_user
from app.models.entities import User
from app.repositories.bocra import NotificationRepository

router = APIRouter(tags=["notifications"])


def _present_notification(n) -> dict:
    return {
        "id": n.id,
        "title": n.title,
        "body": n.body,
        "channel": n.channel_code,
        "status": n.status_code,
        "sentAt": n.sent_at.isoformat() if n.sent_at else None,
        "createdAt": n.created_at.isoformat() if n.created_at else None,
        "sourceTable": n.source_table,
        "sourceId": n.source_id,
    }


@router.get("/api/notifications")
def list_notifications(
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    repo = NotificationRepository(db)
    items = repo.list_for_user(user.id)
    return {"notifications": [_present_notification(n) for n in items]}


@router.patch("/api/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    repo = NotificationRepository(db)
    notification = repo.mark_read(notification_id, user.id)
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    db.commit()
    return _present_notification(notification)
