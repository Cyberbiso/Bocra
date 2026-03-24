from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from fastapi import Query

from app.core.dependencies import db_session, get_current_user, get_optional_user
from app.models.entities import User
from app.models.schemas import TypeApprovalApplicationCreate
from app.services.portal import TypeApprovalService
from app.views.presenters import present_accreditation, present_type_approval_search

router = APIRouter(tags=["type-approval"])


@router.get("/api/type-approval")
def search_type_approval(q: str = "", page: int = 0, size: int = 12, db: Session = Depends(db_session)):
    return present_type_approval_search(TypeApprovalService(db).search_public(q, page, size))


@router.get("/api/accreditation")
def accreditation_status(
    type: str | None = Query(default=None),
    query: str | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    accreditation_type = (type or query or "").strip()
    if not accreditation_type:
        raise HTTPException(status_code=400, detail="type is required")
    return present_accreditation(TypeApprovalService(db).get_accreditation(user, accreditation_type))


@router.post("/api/type-approval/applications")
def create_type_approval_application(
    payload: TypeApprovalApplicationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    try:
        result = TypeApprovalService(db).create_application(payload.model_dump(), user)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {
        "applicationNumber": result["workflow"].application_number,
        "status": result["workflow"].current_status_code,
    }
