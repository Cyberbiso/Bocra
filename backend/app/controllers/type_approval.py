from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session

from fastapi import Query

from app.core.dependencies import db_session, get_current_user, require_type_approver_or_admin
from app.models.entities import User
from app.models.schemas import (
    TypeApprovalApplicationCreate,
    TypeApprovalCommentCreate,
    TypeApprovalDocumentReviewCreate,
    TypeApprovalPartyCreate,
)
from app.repositories.bocra import AuthRepository
from app.services.auth import AuthService
from app.services.portal import TypeApprovalService
from app.views.presenters import present_accreditation, present_type_approval_search

router = APIRouter(tags=["type-approval"])


def _role_for_user(db: Session, user: User | None) -> str:
    if not user:
        return "public"
    roles = AuthRepository(db).get_roles_for_user(user.id)
    return AuthService.primary_role(roles)


@router.get("/api/type-approval")
def search_type_approval(q: str = "", page: int = 0, size: int = 12, db: Session = Depends(db_session)):
    return present_type_approval_search(TypeApprovalService(db).search_public(q, page, size))


@router.get("/api/type-approval/applications")
def list_type_approval_applications(
    status: str | None = None,
    q: str | None = None,
    page: int = 1,
    size: int = 10,
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    role = _role_for_user(db, user)
    return TypeApprovalService(db).list_applications(
        user=user,
        role=role,
        status=status,
        query=q,
        page=page,
        page_size=size,
    )


@router.get("/api/type-approval/queue")
def list_type_approval_queue(
    q: str | None = None,
    page: int = 1,
    size: int = 10,
    user: User = Depends(require_type_approver_or_admin),
    db: Session = Depends(db_session),
):
    role = _role_for_user(db, user)
    return TypeApprovalService(db).queue(user=user, role=role, query=q, page=page, page_size=size)


@router.get("/api/type-approval/applications/{reference}")
def type_approval_detail(
    reference: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    role = _role_for_user(db, user)
    detail = TypeApprovalService(db).detail(reference, user=user, role=role)
    if not detail:
        raise HTTPException(status_code=404, detail="Type approval application not found")
    return detail


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
        "id": result["workflow"].id,
    }


@router.post("/api/type-approval/applications/{application_id}/action")
async def officer_type_approval_action(
    application_id: str,
    request: Request,
    user: User = Depends(require_type_approver_or_admin),
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


@router.post("/api/type-approval/applications/{reference}/comments")
def add_type_approval_comment(
    reference: str,
    payload: TypeApprovalCommentCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    role = _role_for_user(db, user)
    try:
        comment = TypeApprovalService(db).add_comment(
            reference,
            user=user,
            role=role,
            body=payload.body,
            visibility=payload.visibility,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not comment:
        raise HTTPException(status_code=404, detail="Type approval application not found")
    db.commit()
    return comment


@router.post("/api/type-approval/applications/{reference}/parties")
def add_type_approval_party(
    reference: str,
    payload: TypeApprovalPartyCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    role = _role_for_user(db, user)
    try:
        party = TypeApprovalService(db).add_party(reference, user=user, role=role, payload=payload.model_dump())
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not party:
        raise HTTPException(status_code=404, detail="Type approval application not found")
    db.commit()
    return party


@router.post("/api/type-approval/applications/{reference}/documents")
async def upload_type_approval_document(
    reference: str,
    documentType: str = Form(...),
    isRequired: bool = Form(False),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    role = _role_for_user(db, user)
    content = await file.read()
    try:
        document = TypeApprovalService(db).upload_document(
            reference,
            user=user,
            role=role,
            file_name=file.filename or "upload.bin",
            content_type=file.content_type or "application/octet-stream",
            content=content,
            document_type=documentType,
            is_required=isRequired,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not document:
        raise HTTPException(status_code=404, detail="Type approval application not found")
    db.commit()
    return document


@router.post("/api/type-approval/applications/{reference}/documents/{document_id}/review")
def review_type_approval_document(
    reference: str,
    document_id: str,
    payload: TypeApprovalDocumentReviewCreate,
    user: User = Depends(require_type_approver_or_admin),
    db: Session = Depends(db_session),
):
    role = _role_for_user(db, user)
    try:
        document = TypeApprovalService(db).review_document(
            reference,
            document_id=document_id,
            reviewer=user,
            role=role,
            review_status=payload.reviewStatus,
            note=payload.note or "",
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not document:
        raise HTTPException(status_code=404, detail="Type approval document not found")
    db.commit()
    return document


@router.get("/api/type-approval/applications/{reference}/documents/{document_id}/download")
def download_type_approval_document(
    reference: str,
    document_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    role = _role_for_user(db, user)
    try:
        payload = TypeApprovalService(db).download_document(reference, document_id=document_id, user=user, role=role)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    if not payload:
        raise HTTPException(status_code=404, detail="Type approval document not found")
    if payload["storageKey"].startswith("https://"):
        return RedirectResponse(payload["storageKey"])
    return FileResponse(payload["storageKey"], media_type=payload["mimeType"], filename=payload["name"])
