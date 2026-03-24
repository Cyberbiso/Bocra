from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import db_session
from app.services.portal import SearchService
from app.views.presenters import present_search

router = APIRouter(tags=["search"])


@router.get("/api/search")
def search(q: str = "", category: str = "all", db: Session = Depends(db_session)):
    return present_search(SearchService(db).search(q, category))
