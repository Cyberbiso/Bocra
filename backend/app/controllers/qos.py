from __future__ import annotations

from fastapi import APIRouter

from app.services.portal import QosService

router = APIRouter(tags=["qos"])


@router.get("/api/dqos/locations")
def locations():
    return QosService().locations()


@router.get("/api/dqos/nms-summary")
def nms_summary():
    return QosService().summary()
