from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.dependencies import db_session, get_current_user, get_optional_user, require_officer_or_admin
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

_ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}
_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
_MAX_FILES = 5

# Magic-byte signatures for supported types
_MAGIC = {
    b"%PDF": "application/pdf",
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG": "image/png",
    b"RIFF": "image/webp",
}

_FALLBACK_TYPES_BY_SUFFIX = {
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
}


def _validate_attachments(files: list[UploadFile]) -> None:
    if len(files) > _MAX_FILES:
        raise HTTPException(status_code=400, detail=f"Maximum {_MAX_FILES} attachments allowed.")


async def _read_and_validate(file: UploadFile) -> tuple[str, str, bytes]:
    content = await file.read()
    if len(content) > _MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"{file.filename}: exceeds the 10 MB size limit.")
    # Validate by magic bytes, not just the client-supplied content_type
    detected = next(
        (mime for magic, mime in _MAGIC.items() if content[:len(magic)] == magic),
        None,
    )
    if detected is None:
        suffix = Path(file.filename or "").suffix.lower()
        fallback_type = _FALLBACK_TYPES_BY_SUFFIX.get(suffix)
        if fallback_type == "text/plain":
            try:
                content.decode("utf-8")
            except UnicodeDecodeError:
                fallback_type = None
        if fallback_type and file.content_type == fallback_type:
            detected = fallback_type
    if detected is None or detected not in _ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"{file.filename}: unsupported file type. Allowed: PDF, JPEG, PNG, WEBP, DOC, DOCX, TXT.")
    # Sanitize filename — strip path components, keep only the basename
    safe_name = (file.filename or "attachment").replace("/", "_").replace("\\", "_").replace("..", "_")
    return safe_name, detected, content


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
    _validate_attachments(attachments)
    attachment_payloads: list[tuple[str, str, bytes]] = []
    attachment_meta: list[dict[str, object]] = []
    for file in attachments:
        safe_name, mime, content = await _read_and_validate(file)
        attachment_payloads.append((safe_name, mime, content))
        attachment_meta.append({"name": safe_name, "size": len(content), "type": mime})
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
def complaint_detail(complaint_id: str, user: User = Depends(get_current_user), db: Session = Depends(db_session)):
    service = ComplaintService(db)
    detail = service.get_detail(complaint_id, user=user, role=_role_for_user(db, user))
    if not detail:
        raise HTTPException(status_code=404, detail="Complaint not found")
    complaint = detail["complaint"]
    officer = AuthRepository(db).get_user_by_id(complaint.assigned_to_user_id)
    return present_complaint_detail(detail, officer=officer)


@router.get("/api/complaints/{complaint_id}/messages")
def complaint_messages(complaint_id: str, user: User = Depends(get_current_user), db: Session = Depends(db_session)):
    detail = ComplaintService(db).get_detail(complaint_id, user=user, role=_role_for_user(db, user))
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
    message = ComplaintService(db).add_message(complaint_id, body=content, user=user, role=_role_for_user(db, user))
    if not message:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return {"success": True, "message": present_complaint_messages([message])[0]}


@router.post("/api/complaints/{complaint_id}/action")
async def officer_complaint_action(
    complaint_id: str,
    request: Request,
    user: User = Depends(require_officer_or_admin),
    db: Session = Depends(db_session),
):
    body = await request.json()
    action = str(body.get("action", "")).strip().lower()
    note = str(body.get("note", "")).strip()
    if not action:
        raise HTTPException(status_code=400, detail="action is required")
    try:
        complaint = ComplaintService(db).officer_action(complaint_id, action=action, officer=user, note=note)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    db.commit()
    return {"success": True, "complaintNumber": complaint.complaint_number, "status": complaint.current_status_code}


@router.get("/api/complaints/{complaint_id}/attachments/{attachment_id}")
def download_attachment(
    complaint_id: str,
    attachment_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    result = ComplaintService(db).get_attachment_bytes(complaint_id, attachment_id, user=user, role=_role_for_user(db, user))
    if not result:
        raise HTTPException(status_code=404, detail="Attachment not found")
    attachment, content = result
    headers = {"Content-Disposition": f'attachment; filename="{attachment.file_name}"'}
    return Response(content=content, media_type=attachment.content_type, headers=headers)
