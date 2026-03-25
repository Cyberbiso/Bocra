from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.core.dependencies import db_session, get_current_user, get_optional_user, require_officer_or_admin
from app.models.entities import User
from app.models.schemas import LicenseApplicationCreate
from app.repositories.bocra import AuthRepository
from app.services.auth import AuthService
from app.services.portal import LicensingService
from app.views.presenters import present_licensing_dashboard, present_licensing_detail

router = APIRouter(tags=["licensing"])


def _role_for_user(db: Session, user: User | None) -> str:
    if not user:
        return "public"
    roles = AuthRepository(db).get_roles_for_user(user.id)
    return AuthService.primary_role(roles)


@router.get("/api/licenses")
def list_or_search_licenses(
    action: str | None = Query(default=None),
    clientId: str | None = None,
    licenseNumber: str | None = None,
    licenseType: str | None = None,
    page: str | None = None,
    pageSize: str | None = None,
    name: str | None = None,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(db_session),
):
    service = LicensingService(db)
    if action:
        return service.public_action(
            action=action,
            params={
                "clientId": clientId or "",
                "licenseNumber": licenseNumber or "",
                "licenseType": licenseType or "",
                "page": page or "1",
                "pageSize": pageSize or "10",
                "name": name or "",
            },
        )
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    role = _role_for_user(db, user)
    return present_licensing_dashboard(service.dashboard_data(user=user, role=role))


@router.get("/api/licenses/{record_id}")
def license_detail(record_id: str, db: Session = Depends(db_session)):
    detail = LicensingService(db).detail(record_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Licence or application not found")
    return present_licensing_detail(detail)


@router.get("/api/applications/tracker/{reference}")
def application_tracker(reference: str, db: Session = Depends(db_session)):
    """Public endpoint — returns visible journey events for an application by number or tracker token."""
    result = LicensingService(db).tracker(reference)
    if not result:
        raise HTTPException(status_code=404, detail="Application not found")
    return result


@router.post("/api/licence-applications/{application_id}/action")
async def officer_licence_action(
    application_id: str,
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
        workflow = LicensingService(db).officer_action(application_id, action=action, officer=user, note=note)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not workflow:
        raise HTTPException(status_code=404, detail="Licence application not found")
    db.commit()
    return {"success": True, "applicationNumber": workflow.application_number, "status": workflow.current_status_code}


@router.post("/api/licence-applications")
def create_license_application(
    payload: LicenseApplicationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    result = LicensingService(db).create_application(payload.model_dump(), user)
    return {
        "applicationNumber": result["workflow"].application_number,
        "trackerToken": result["workflow"].public_tracker_token,
        "status": result["workflow"].current_status_code,
    }
