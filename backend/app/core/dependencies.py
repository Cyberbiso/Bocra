from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.database import get_db
from app.models.entities import User
from app.repositories.bocra import AuthRepository
from app.services.auth import AuthService

settings = get_settings()


def db_session(db: Session = Depends(get_db)) -> Session:
    return db


def _extract_token(request: Request) -> str | None:
    """Read the Supabase JWT from the session cookie or Authorization header."""
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    return token or None


def get_current_session(
    request: Request,
    db: Session = Depends(get_db),
) -> tuple[str, User]:
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    result = AuthService(db).get_user_from_token(token)
    if not result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
    return token, result.user


def get_optional_session(
    request: Request,
    db: Session = Depends(get_db),
) -> tuple[str, User] | None:
    token = _extract_token(request)
    if not token:
        return None
    result = AuthService(db).get_user_from_token(token)
    if not result:
        return None
    return token, result.user


def get_current_user(
    current: tuple[str, User] = Depends(get_current_session),
) -> User:
    return current[1]


def get_optional_user(
    current: tuple[str, User] | None = Depends(get_optional_session),
) -> User | None:
    if current is None:
        return None
    return current[1]


def require_officer_or_admin(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    """Dependency that enforces officer or admin role. Raises 403 for applicants."""
    roles = AuthRepository(db).get_roles_for_user(user.id)
    role = AuthService.primary_role(roles)
    if role not in {"officer", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Officer or admin role required.")
    return user


def require_admin(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    """Dependency that enforces admin role only."""
    roles = AuthRepository(db).get_roles_for_user(user.id)
    if AuthService.primary_role(roles) != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")
    return user
