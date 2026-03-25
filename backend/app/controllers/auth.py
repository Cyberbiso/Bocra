from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.dependencies import db_session, get_optional_session
from app.models.entities import User
from app.models.schemas import LoginRequest
from app.services.auth import AuthService
from app.views.presenters import present_session, present_user

router = APIRouter(tags=["auth"])
settings = get_settings()
limiter = Limiter(key_func=get_remote_address)

_COOKIE_MAX_AGE = settings.session_ttl_hours * 3600


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        settings.session_cookie_name,
        token,
        httponly=True,
        samesite="lax",
        path="/",
        max_age=_COOKIE_MAX_AGE,
    )


@router.post("/api/auth/login")
@limiter.limit("10/minute")
async def login(
    request: Request,
    response: Response,
    db: Session = Depends(db_session),
):
    try:
        payload = LoginRequest.model_validate(await request.json())
    except ValidationError as exc:
        raise RequestValidationError(exc.errors()) from exc

    result = AuthService(db).login(payload.email, payload.password)
    if not result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    _set_session_cookie(response, result.access_token)
    return present_session(result)


@router.post("/api/auth/logout")
def logout(
    response: Response,
    current: tuple[str, User] | None = Depends(get_optional_session),
    db: Session = Depends(db_session),
):
    access_token = current[0] if current else None
    AuthService(db).logout(access_token)
    response.delete_cookie(settings.session_cookie_name, path="/")
    return {"success": True}


@router.get("/api/auth/session")
def session_status(
    current: tuple[str, User] | None = Depends(get_optional_session),
    db: Session = Depends(db_session),
):
    if not current:
        return {"authenticated": False}
    token, _ = current
    result = AuthService(db).get_user_from_token(token)
    if not result:
        return {"authenticated": False}
    return {"authenticated": True, "user": present_user(result.user, result.roles, result.permissions)}


@router.get("/api/me")
def me(
    current: tuple[str, User] | None = Depends(get_optional_session),
    db: Session = Depends(db_session),
):
    if not current:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    token, _ = current
    result = AuthService(db).get_user_from_token(token)
    if not result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    return present_user(result.user, result.roles, result.permissions)
