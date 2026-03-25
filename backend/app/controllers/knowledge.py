from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.dependencies import db_session, get_current_user
from app.models.entities import User
from app.repositories.bocra import AuthRepository
from app.services.auth import AuthService
from app.services.knowledge import KnowledgeIngestionService

router = APIRouter(tags=["knowledge"])


def _require_officer_or_admin(db: Session, user: User) -> str:
    roles = AuthRepository(db).get_roles_for_user(user.id)
    role = AuthService.primary_role(roles)
    if role not in {"officer", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Officer or admin role required.")
    return role


@router.get("/api/knowledge/documents")
def list_knowledge_documents(
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    _require_officer_or_admin(db, user)
    return {"documents": KnowledgeIngestionService(db).list_documents()}


@router.post("/api/knowledge/ingest/url", status_code=status.HTTP_201_CREATED)
async def ingest_url(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    _require_officer_or_admin(db, user)
    body = await request.json()
    url = str(body.get("url", "")).strip()
    title = str(body.get("title", "")).strip()
    if not url or not title:
        raise HTTPException(status_code=400, detail="url and title are required")
    try:
        result = KnowledgeIngestionService(db).ingest_url(
            url=url,
            title=title,
            document_type=str(body.get("documentType", "POLICY")),
            category=body.get("category"),
            replace=bool(body.get("replace", False)),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch document: {exc}")
    return result


@router.post("/api/knowledge/ingest/text", status_code=status.HTTP_201_CREATED)
async def ingest_text(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    _require_officer_or_admin(db, user)
    body = await request.json()
    text = str(body.get("text", "")).strip()
    title = str(body.get("title", "")).strip()
    if not text or not title:
        raise HTTPException(status_code=400, detail="text and title are required")
    result = KnowledgeIngestionService(db).ingest_text(
        text=text,
        title=title,
        document_type=str(body.get("documentType", "REGULATION")),
        category=body.get("category"),
        source_url=body.get("sourceUrl"),
        replace=bool(body.get("replace", False)),
    )
    return result
