from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()


def schema_name(schema: str, table: str) -> str:
    return table if settings.is_postgres else f"{schema}_{table}"


def schema_args(schema: str) -> dict[str, str]:
    return {"schema": schema} if settings.is_postgres else {}


def fk(schema: str, table: str, column: str) -> str:
    if settings.is_postgres:
        return f"{schema}.{table}.{column}"
    return f"{schema}_{table}.{column}"


class Base(DeclarativeBase):
    pass


engine = create_engine(
    settings.database_url,
    future=True,
    echo=settings.debug,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def create_schemas() -> None:
    if not settings.is_postgres:
        return

    # Schema names are a fixed internal whitelist — never derived from user input.
    _SCHEMAS = frozenset({"iam", "workflow", "complaints", "licensing", "device", "billing", "docs", "knowledge", "agent", "notify", "cirt", "audit"})

    with engine.begin() as conn:
        for schema in _SCHEMAS:
            # Use sqlalchemy.sql.quoted_name to safely quote the identifier.
            from sqlalchemy.sql import quoted_name
            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {quoted_name(schema, quote=True)}"))


def get_db() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@contextmanager
def session_scope() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
