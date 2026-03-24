from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.controllers.agent import router as agent_router
from app.controllers.auth import router as auth_router
from app.controllers.billing import router as billing_router
from app.controllers.certificates import router as certificates_router
from app.controllers.complaints import router as complaints_router
from app.controllers.dashboard import router as dashboard_router
from app.controllers.device_verification import router as device_router
from app.controllers.licensing import router as licensing_router
from app.controllers.public import router as public_router
from app.controllers.qos import router as qos_router
from app.controllers.search import router as search_router
from app.controllers.type_approval import router as type_approval_router
from app.core.database import Base, SessionLocal, create_schemas, engine
from app.data.seed import seed_database

settings = get_settings()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_schemas()
    Base.metadata.create_all(bind=engine)
    if settings.seed_demo_data:
        with SessionLocal() as session:
            seed_database(session)
    yield


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    for router in (
        auth_router,
        dashboard_router,
        complaints_router,
        licensing_router,
        type_approval_router,
        device_router,
        certificates_router,
        billing_router,
        search_router,
        qos_router,
        agent_router,
        public_router,
    ):
        app.include_router(router)
    return app


app = create_app()
