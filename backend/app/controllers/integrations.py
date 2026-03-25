from __future__ import annotations

import secrets
import time
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import db_session, require_admin
from app.core.security import utcnow
from app.models.entities import ExternalSystem, User

router = APIRouter(prefix="/api/integrations", tags=["integrations"])

DbSession = Annotated[Session, Depends(db_session)]
AdminUser = Annotated[User, Depends(require_admin)]


def _present(system: ExternalSystem, mask_key: bool = True) -> dict:
    key = system.api_key
    masked = f"{key[:8]}{'*' * (len(key) - 12)}{key[-4:]}" if mask_key and len(key) > 12 else key
    return {
        "id": system.id,
        "systemCode": system.system_code,
        "name": system.name,
        "description": system.description,
        "baseUrl": system.base_url,
        "healthEndpoint": system.health_endpoint,
        "apiKey": masked,
        "contactEmail": system.contact_email,
        "statusCode": system.status_code,
        "lastResponseMs": system.last_response_ms,
        "lastCheckedAt": system.last_checked_at.isoformat() if system.last_checked_at else None,
        "createdAt": system.created_at.isoformat() if system.created_at else None,
    }


def _check_health(system: ExternalSystem) -> tuple[str, int | None]:
    """Ping the system's health endpoint. Returns (status_code, response_ms)."""
    url = system.base_url.rstrip("/") + system.health_endpoint
    try:
        start = time.monotonic()
        response = httpx.get(url, timeout=8.0, follow_redirects=True)
        elapsed_ms = int((time.monotonic() - start) * 1000)
        if response.is_success:
            return "ONLINE", elapsed_ms
        return "DEGRADED", elapsed_ms
    except httpx.TimeoutException:
        return "OFFLINE", None
    except httpx.RequestError:
        return "OFFLINE", None


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("")
def list_integrations(db: DbSession, _: AdminUser):
    """List all registered external systems with their last known health status."""
    systems = db.scalars(select(ExternalSystem).order_by(ExternalSystem.name)).all()
    return [_present(s) for s in systems]


@router.post("/health/check")
def check_all_health(db: DbSession, _: AdminUser):
    """Ping every registered system's health endpoint and update stored status."""
    systems = db.scalars(select(ExternalSystem)).all()
    results = []
    for system in systems:
        status_code, response_ms = _check_health(system)
        system.status_code = status_code
        system.last_response_ms = response_ms
        system.last_checked_at = utcnow()
        results.append({
            "systemCode": system.system_code,
            "name": system.name,
            "statusCode": status_code,
            "responseMs": response_ms,
        })
    db.commit()
    return {"checked": len(results), "results": results}


@router.post("/{system_code}/health/check")
def check_single_health(system_code: str, db: DbSession, _: AdminUser):
    """Ping a single system's health endpoint."""
    system = db.scalar(select(ExternalSystem).where(ExternalSystem.system_code == system_code))
    if not system:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="System not found")

    status_code, response_ms = _check_health(system)
    system.status_code = status_code
    system.last_response_ms = response_ms
    system.last_checked_at = utcnow()
    db.commit()
    return _present(system)


@router.post("/{system_code}/rotate-key")
def rotate_api_key(system_code: str, db: DbSession, _: AdminUser):
    """Generate a new API key for a registered external system (admin action)."""
    system = db.scalar(select(ExternalSystem).where(ExternalSystem.system_code == system_code))
    if not system:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="System not found")

    new_key = f"bocra_{secrets.token_urlsafe(32)}"
    system.api_key = new_key
    db.commit()
    # Return full unmasked key once — this is the only time it's shown in full.
    return {"systemCode": system.system_code, "apiKey": new_key, "rotatedAt": utcnow().isoformat()}
