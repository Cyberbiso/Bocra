from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import db_session
from app.services.portal import DeviceService
from app.views.presenters import present_verification_result

router = APIRouter(tags=["device-verification"])


@router.post("/api/device-verification")
def verify_device(payload: dict, db: Session = Depends(db_session)):
    service = DeviceService(db)
    if isinstance(payload.get("imeis"), list):
        imeis = payload["imeis"]
        if len(imeis) > 500:
            raise HTTPException(status_code=400, detail="Batch limit is 500 IMEIs per request.")
        return {"results": [present_verification_result(service.verify_imei(imei)) for imei in imeis]}
    imei = str(payload.get("imei", "")).strip()
    if not imei:
        raise HTTPException(status_code=400, detail="imei is required.")
    return present_verification_result(service.verify_imei(imei))
