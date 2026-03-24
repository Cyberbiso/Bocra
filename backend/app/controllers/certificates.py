from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.dependencies import db_session, get_current_user
from app.models.entities import User
from app.repositories.bocra import AuthRepository
from app.services.auth import AuthService
from app.services.portal import CertificateService
from app.views.presenters import present_certificate_verification, present_certificates

router = APIRouter(tags=["certificates"])


def _role_for_user(db: Session, user: User | None) -> str:
    if not user:
        return "public"
    roles = AuthRepository(db).get_roles_for_user(user.id)
    return AuthService.primary_role(roles)


@router.get("/api/certificates")
def list_certificates(
    type: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    role = _role_for_user(db, user)
    return present_certificates(CertificateService(db).list_certificates(user, role, cert_type=type))


@router.get("/api/certificates/verify/{token}")
def verify_certificate(token: str, db: Session = Depends(db_session)):
    certificate = CertificateService(db).verify(token)
    payload = present_certificate_verification(token, certificate)
    status_code = 404 if certificate is None else 200
    return JSONResponse(payload, status_code=status_code)
