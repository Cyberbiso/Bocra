from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from fastapi import Query

from app.core.dependencies import db_session, get_current_user, get_optional_user, require_officer_or_admin
from app.models.entities import User
from app.models.schemas import TypeApprovalApplicationCreate
from app.repositories.bocra import AuthRepository
from app.services.auth import AuthService
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


@router.get("/api/type-approval/applications")
def list_type_approval_applications(
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    """List type approval applications. Officers/admins see all; applicants see their own."""
    roles = AuthRepository(db).get_roles_for_user(user.id)
    is_officer = AuthService.primary_role(roles) in {"officer", "admin"}
    return TypeApprovalService(db).list_user_applications(user, is_officer=is_officer)


@router.get("/api/type-approval/applications/{application_id}")
def get_type_approval_application(
    application_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    """Get full detail for one application including events, invoice, and certificate."""
    roles = AuthRepository(db).get_roles_for_user(user.id)
    is_officer = AuthService.primary_role(roles) in {"officer", "admin"}
    detail = TypeApprovalService(db).get_application_detail(application_id, user, is_officer=is_officer)
    if not detail:
        raise HTTPException(status_code=404, detail="Application not found")
    return detail


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
        "id": result["workflow"].id,
    }


@router.post("/api/type-approval/applications/{application_id}/action")
async def officer_type_approval_action(
    application_id: str,
    request: Request,
    user: User = Depends(require_officer_or_admin),
    db: Session = Depends(db_session),
):
    """Officer actions: validate | approve | confirm_payment | reject | remand"""
    body = await request.json()
    action = str(body.get("action", "")).strip().lower()
    note = str(body.get("note", "")).strip()
    if not action:
        raise HTTPException(status_code=400, detail="action is required")
    try:
        workflow = TypeApprovalService(db).officer_action(application_id, action=action, officer=user, note=note)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not workflow:
        raise HTTPException(status_code=404, detail="Application not found")
    db.commit()
    return {"success": True, "applicationNumber": workflow.application_number, "status": workflow.current_status_code, "stage": workflow.current_stage_code}
