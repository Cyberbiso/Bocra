from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.config import get_settings
from app.controllers.agent import router as agent_router
from app.controllers.integrations import router as integrations_router
from app.controllers.cirt import router as cirt_router
from app.controllers.knowledge import router as knowledge_router
from app.controllers.auth import router as auth_router
from app.controllers.billing import router as billing_router
from app.controllers.certificates import router as certificates_router
from app.controllers.complaints import router as complaints_router
from app.controllers.dashboard import router as dashboard_router
from app.controllers.device_verification import router as device_router
from app.controllers.licensing import router as licensing_router
from app.controllers.notifications import router as notifications_router
from app.controllers.public import router as public_router
from app.controllers.qos import router as qos_router
from app.controllers.search import router as search_router
from app.controllers.type_approval import router as type_approval_router
from app.core.database import Base, SessionLocal, create_schemas, engine
from app.data.seed import seed_database

settings = get_settings()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")

# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_schemas()
    Base.metadata.create_all(bind=engine)
    if settings.seed_demo_data:
        try:
            with SessionLocal() as session:
                seed_database(session)
        except Exception as exc:  # noqa: BLE001
            logging.getLogger(__name__).warning(
                "Demo seed skipped (data may already exist): %s", exc
            )
    yield


# ── Security headers middleware ───────────────────────────────────────────────
_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
}


async def security_headers_middleware(request: Request, call_next) -> Response:
    response = await call_next(request)
    for header, value in _SECURITY_HEADERS.items():
        response.headers.setdefault(header, value)
    return response


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

    # Rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    # Security headers
    app.middleware("http")(security_headers_middleware)

    # CORS — never allow wildcard when credentials=True
    origins = settings.origins
    if not origins:
        origins = ["http://localhost:3000"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Session-Token", "Cookie"],
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
        cirt_router,
        knowledge_router,
        notifications_router,
        integrations_router,
        public_router,
    ):
        app.include_router(router)
    return app


app = create_app()
