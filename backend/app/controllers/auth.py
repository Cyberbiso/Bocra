from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.dependencies import db_session, get_optional_session
from app.models.schemas import LoginRequest
from app.services.auth import AuthService
from app.views.presenters import present_session, present_user

router = APIRouter(tags=["auth"])
settings = get_settings()


@router.post("/api/auth/login")
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(db_session),
):
    service = AuthService(db)
    result = service.login(payload.email, payload.password)
    if not result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    response.set_cookie(
        settings.session_cookie_name,
        result.session.token,
        httponly=True,
        samesite="lax",
        path="/",
        max_age=settings.session_ttl_hours * 3600,
    )
    return present_session(result)


@router.post("/api/auth/logout")
def logout(
    response: Response,
    current: tuple | None = Depends(get_optional_session),
    db: Session = Depends(db_session),
):
    token = current[0].token if current else None
    AuthService(db).logout(token)
    response.delete_cookie(settings.session_cookie_name, path="/")
    return {"success": True}


@router.get("/api/auth/session")
def session_status(
    current: tuple | None = Depends(get_optional_session),
    db: Session = Depends(db_session),
):
    if not current:
        return {"authenticated": False}
    result = AuthService(db).get_session_context(current[0].token)
    if not result:
        return {"authenticated": False}
    return {"authenticated": True, "user": present_user(result.user, result.roles, result.permissions)}


@router.get("/api/me")
def me(
    current: tuple | None = Depends(get_optional_session),
    db: Session = Depends(db_session),
):
    if not current:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    result = AuthService(db).get_session_context(current[0].token)
    if not result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    return present_user(result.user, result.roles, result.permissions)
