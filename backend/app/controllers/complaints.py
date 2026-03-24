from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.dependencies import db_session, get_current_user, get_optional_user
from app.models.entities import User
from app.repositories.bocra import AuthRepository
from app.services.auth import AuthService
from app.services.portal import ComplaintService
from app.views.presenters import (
    present_complaint_detail,
    present_complaint_messages,
    present_complaint_submission,
    present_complaints,
)

router = APIRouter(tags=["complaints"])


def _role_for_user(db: Session, user: User | None) -> str:
    if not user:
        return "public"
    roles = AuthRepository(db).get_roles_for_user(user.id)
    return AuthService.primary_role(roles)


@router.get("/api/complaints")
def list_complaints(
    role: str | None = None,
    userId: str | None = None,
    status: str | None = None,
    operator: str | None = None,
    dateFrom: str | None = None,
    dateTo: str | None = None,
    page: int = 1,
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    effective_role = role or _role_for_user(db, user)
    complaints, total = ComplaintService(db).list_complaints(
        role=effective_role,
        user=user,
        status=status,
        operator=operator,
        date_from=dateFrom,
        date_to=dateTo,
        page=page,
        page_size=8,
    )
    return present_complaints(complaints, total, page, 8)


@router.post("/api/complaints")
async def submit_complaint(
    category: str = Form(...),
    operator: str = Form(...),
    subject: str = Form(...),
    description: str = Form(...),
    incidentDate: str = Form(""),
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    consentGiven: str = Form("false"),
    attachments: list[UploadFile] = File(default=[]),
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(db_session),
):
    service = ComplaintService(db)
    attachment_payloads: list[tuple[str, str, bytes]] = []
    attachment_meta: list[dict[str, object]] = []
    for file in attachments:
        content = await file.read()
        attachment_payloads.append((file.filename, file.content_type or "application/octet-stream", content))
        attachment_meta.append({"name": file.filename, "size": len(content), "type": file.content_type or "application/octet-stream"})
    draft = {
        "category": category,
        "operator": operator,
        "subject": subject,
        "description": description,
        "incidentDate": incidentDate,
        "name": name,
        "email": email,
        "phone": phone,
        "consentGiven": consentGiven == "true",
    }
    complaint = service.submit_complaint(draft=draft, attachments=attachment_payloads, user=user)
    return present_complaint_submission(complaint, draft, attachment_meta)


@router.get("/api/complaints/{complaint_id}")
def complaint_detail(complaint_id: str, _: User = Depends(get_current_user), db: Session = Depends(db_session)):
    service = ComplaintService(db)
    detail = service.get_detail(complaint_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Complaint not found")
    complaint = detail["complaint"]
    officer = AuthRepository(db).get_user_by_id(complaint.assigned_to_user_id)
    return present_complaint_detail(detail, officer=officer)


@router.get("/api/complaints/{complaint_id}/messages")
def complaint_messages(complaint_id: str, _: User = Depends(get_current_user), db: Session = Depends(db_session)):
    detail = ComplaintService(db).get_detail(complaint_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return present_complaint_messages(detail["messages"])


@router.post("/api/complaints/{complaint_id}/messages")
async def add_complaint_message(
    complaint_id: str,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    body = await request.json()
    content = str(body.get("content", "")).strip()
    if not content:
        raise HTTPException(status_code=400, detail="content is required")
    message = ComplaintService(db).add_message(complaint_id, body=content, user=user)
    if not message:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return {"success": True, "message": present_complaint_messages([message])[0]}


@router.get("/api/complaints/{complaint_id}/attachments/{attachment_id}")
def download_attachment(
    complaint_id: str,
    attachment_id: str,
    _: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    result = ComplaintService(db).get_attachment_bytes(complaint_id, attachment_id)
    if not result:
        raise HTTPException(status_code=404, detail="Attachment not found")
    attachment, content = result
    headers = {"Content-Disposition": f'attachment; filename="{attachment.file_name}"'}
    return Response(content=content, media_type=attachment.content_type, headers=headers)
