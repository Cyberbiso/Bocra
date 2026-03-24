from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from app.config import get_settings

settings = get_settings()


def hash_password(password: str) -> str:
    material = f"{settings.local_auth_salt}:{password}".encode("utf-8")
    return hashlib.sha256(material).hexdigest()


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    return secrets.compare_digest(hash_password(password), password_hash)


def new_session_token() -> str:
    return secrets.token_urlsafe(32)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def session_expires_at() -> datetime:
    return utcnow() + timedelta(hours=settings.session_ttl_hours)
