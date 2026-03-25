from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import db_session, get_current_user, require_officer_or_admin
from app.models.entities import User
from app.repositories.bocra import AuthRepository
from app.services.auth import AuthService
from app.services.portal import DashboardService
from app.views.presenters import (
    present_dashboard_activity,
    present_dashboard_summary,
    present_notices,
    present_queue_summary,
)

router = APIRouter(tags=["dashboard"])


def _role_for_user(db: Session, user: User | None) -> str:
    if not user:
        return "public"
    roles = AuthRepository(db).get_roles_for_user(user.id)
    return AuthService.primary_role(roles)


@router.get("/api/dashboard/summary")
def summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    service = DashboardService(db)
    role = _role_for_user(db, user)
    return present_dashboard_summary(service.summary(role=role, user=user))


@router.get("/api/dashboard/activity")
def activity(limit: int = 5, _: User = Depends(get_current_user), db: Session = Depends(db_session)):
    return present_dashboard_activity(DashboardService(db).activity(limit=limit))


@router.get("/api/officer/queue-summary")
def queue_summary(_: User = Depends(require_officer_or_admin), db: Session = Depends(db_session)):
    return present_queue_summary(DashboardService(db).queue_summary())


@router.get("/api/notices")
def notices(limit: int = 3, db: Session = Depends(db_session)):
    return present_notices(DashboardService(db).notices(limit=limit))
