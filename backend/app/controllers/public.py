from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import db_session
from app.integrations.customer_portal import CustomerPortalClient
from app.models.schemas import PublicChatRequest
from app.services.portal import LicensingService, PublicService
from app.views.presenters import present_public_chat, present_statistics

router = APIRouter(tags=["public"])


@router.get("/api/statistics")
def statistics(db: Session = Depends(db_session)):
    return present_statistics(PublicService(db).statistics())


@router.post("/api/chat")
def public_chat(payload: PublicChatRequest, db: Session = Depends(db_session)):
    return present_public_chat(PublicService(db).chat(payload.message))


@router.get("/api/licence-verification")
def licence_verification_search(
    clientId: str = "",
    licenseNumber: str = "",
    licenseType: str = "",
    page: int = 1,
    pageSize: int = 10,
    name: str = "",
    db: Session = Depends(db_session),
):
    """Licence verification search — calls the customer portal API with a local DB fallback."""
    portal_result = CustomerPortalClient().search_licences(
        client_id=clientId,
        licence_number=licenseNumber,
        licence_type=licenseType,
        page=page,
        page_size=pageSize,
        name=name,
    )
    # If the remote returned real data, use it; otherwise fall back to local DB
    if portal_result.get("source") != "fallback" and portal_result.get("data"):
        return portal_result
    return LicensingService(db).public_action(
        action="search",
        params={
            "clientId": clientId,
            "licenseNumber": licenseNumber,
            "licenseType": licenseType,
            "page": str(page),
            "pageSize": str(pageSize),
            "name": name,
        },
    )
