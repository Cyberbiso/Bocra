from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import db_session, get_current_user, get_optional_user
from app.models.entities import CyberIncidentReport, User

router = APIRouter(tags=["cirt"])

VALID_INCIDENT_TYPES = {
    "PHISHING",
    "MALWARE",
    "RANSOMWARE",
    "DATA_BREACH",
    "DDOS",
    "UNAUTHORIZED_ACCESS",
    "FRAUD",
    "SCAM",
    "SOCIAL_ENGINEERING",
    "OTHER",
}

VALID_SEVERITIES = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _present(report: CyberIncidentReport) -> dict[str, Any]:
    return {
        "id": report.id,
        "referenceNumber": report.reference_number,
        "incidentType": report.incident_type_code,
        "severity": report.severity_code,
        "title": report.title,
        "status": report.status_code,
        "reporterName": report.reporter_name,
        "reporterOrg": report.reporter_org,
        "incidentDate": report.incident_date.isoformat() if report.incident_date else None,
        "createdAt": report.created_at.isoformat() if report.created_at else None,
    }


@router.post("/api/cirt/incidents", status_code=status.HTTP_201_CREATED)
async def report_incident(
    request: Request,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(db_session),
):
    body = await request.json()

    incident_type = str(body.get("incidentType", "OTHER")).upper()
    if incident_type not in VALID_INCIDENT_TYPES:
        raise HTTPException(status_code=400, detail=f"incidentType must be one of: {', '.join(sorted(VALID_INCIDENT_TYPES))}")

    severity = str(body.get("severity", "MEDIUM")).upper()
    if severity not in VALID_SEVERITIES:
        raise HTTPException(status_code=400, detail=f"severity must be one of: {', '.join(sorted(VALID_SEVERITIES))}")

    title = str(body.get("title", "")).strip()
    description = str(body.get("description", "")).strip()
    reporter_name = str(body.get("reporterName", "")).strip()
    reporter_email = str(body.get("reporterEmail", "")).strip()
    if not title or not description or not reporter_name or not reporter_email:
        raise HTTPException(status_code=400, detail="title, description, reporterName and reporterEmail are required")

    incident_date_raw = body.get("incidentDate")
    from datetime import date as _date
    incident_date = None
    if incident_date_raw:
        try:
            incident_date = _date.fromisoformat(str(incident_date_raw))
        except ValueError:
            pass

    year = _utcnow().year
    reference = f"CIRT-{year}-{uuid4().hex[:6].upper()}"

    report = CyberIncidentReport(
        reference_number=reference,
        reporter_user_id=user.id if user else None,
        reporter_name=reporter_name,
        reporter_email=reporter_email,
        reporter_phone=body.get("reporterPhone"),
        reporter_org=body.get("reporterOrg"),
        incident_type_code=incident_type,
        severity_code=severity,
        title=title,
        description=description,
        affected_systems=body.get("affectedSystems"),
        incident_date=incident_date,
        status_code="RECEIVED",
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {
        "referenceNumber": report.reference_number,
        "status": report.status_code,
        "message": f"Incident report {report.reference_number} received. bw-CIRT will contact you within 24 hours.",
    }


@router.get("/api/cirt/incidents/{reference}")
def get_incident(reference: str, db: Session = Depends(db_session)):
    report = db.scalar(
        select(CyberIncidentReport).where(CyberIncidentReport.reference_number == reference)
    )
    if not report:
        raise HTTPException(status_code=404, detail="Incident report not found")
    return _present(report)


@router.get("/api/cirt/incidents")
def list_incidents(
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    """Officers/admins see all; regular users see only their own."""
    from app.repositories.bocra import AuthRepository
    from app.services.auth import AuthService
    roles = AuthRepository(db).get_roles_for_user(user.id)
    role = AuthService.primary_role(roles)
    stmt = select(CyberIncidentReport).order_by(CyberIncidentReport.created_at.desc())
    if role not in {"officer", "admin"}:
        stmt = stmt.where(CyberIncidentReport.reporter_user_id == user.id)
    reports = list(db.scalars(stmt))
    return {"incidents": [_present(r) for r in reports]}
