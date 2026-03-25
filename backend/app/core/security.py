from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt

from app.config import get_settings

settings = get_settings()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt with a random per-user salt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    # Support legacy SHA-256 hashes so existing demo accounts still work.
    # On next login the password will be re-hashed with bcrypt by the auth service.
    if not password_hash.startswith("$2"):
        legacy = hashlib.sha256(
            f"{settings.local_auth_salt}:{password}".encode("utf-8")
        ).hexdigest()
        return secrets.compare_digest(legacy, password_hash)
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def is_legacy_hash(password_hash: str) -> bool:
    """Return True if the stored hash is the old SHA-256 format."""
    return not password_hash.startswith("$2")


def new_session_token() -> str:
    return secrets.token_urlsafe(32)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def session_expires_at() -> datetime:
    return utcnow() + timedelta(hours=settings.session_ttl_hours)
