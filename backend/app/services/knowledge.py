from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.models.entities import KnowledgeChunk, KnowledgeDocument
from app.repositories.bocra import KnowledgeRepository

_CHUNK_SIZE = 800   # approximate characters per chunk
_CHUNK_OVERLAP = 80


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _split_into_chunks(text: str, size: int = _CHUNK_SIZE, overlap: int = _CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks at paragraph or sentence boundaries."""
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
    chunks: list[str] = []
    current = ""
    for para in paragraphs:
        if not current:
            current = para
        elif len(current) + len(para) + 1 <= size:
            current += "\n\n" + para
        else:
            chunks.append(current)
            # keep overlap from the end of the previous chunk
            current = current[-overlap:] + "\n\n" + para if overlap else para
    if current:
        chunks.append(current)
    return chunks or [text[:size]]


def _fetch_text_from_url(url: str) -> str:
    """Fetch plain text from a URL. HTML tags are stripped naively."""
    response = httpx.get(url, timeout=15.0, follow_redirects=True)
    response.raise_for_status()
    content_type = response.headers.get("content-type", "")
    text = response.text
    if "html" in content_type:
        # strip HTML tags
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"&[a-zA-Z]+;", " ", text)
        text = re.sub(r"\s{3,}", "\n\n", text)
    return text.strip()


class KnowledgeIngestionService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = KnowledgeRepository(db)

    def ingest_url(
        self,
        *,
        url: str,
        title: str,
        document_type: str = "POLICY",
        category: str | None = None,
        replace: bool = False,
    ) -> dict[str, Any]:
        """Fetch a URL, chunk the content, and persist as a KnowledgeDocument."""
        existing = self.repo.get_document_by_source(url)
        if existing and not replace:
            return {"status": "exists", "document_id": existing.id, "chunks": 0}

        raw_text = _fetch_text_from_url(url)
        return self._persist(
            source_url=url,
            title=title,
            document_type=document_type,
            category=category,
            text=raw_text,
            existing=existing,
        )

    def ingest_text(
        self,
        *,
        text: str,
        title: str,
        document_type: str = "REGULATION",
        category: str | None = None,
        source_url: str | None = None,
        replace: bool = False,
    ) -> dict[str, Any]:
        """Ingest raw text directly."""
        if source_url:
            existing = self.repo.get_document_by_source(source_url)
            if existing and not replace:
                return {"status": "exists", "document_id": existing.id, "chunks": 0}
        else:
            existing = None
        return self._persist(
            source_url=source_url,
            title=title,
            document_type=document_type,
            category=category,
            text=text,
            existing=existing,
        )

    def _persist(
        self,
        *,
        source_url: str | None,
        title: str,
        document_type: str,
        category: str | None,
        text: str,
        existing: KnowledgeDocument | None,
    ) -> dict[str, Any]:
        if existing:
            self.repo.delete_chunks_for_document(existing.id)
            document = existing
            document.title = title
            document.document_type_code = document_type
            document.category = category
        else:
            document = KnowledgeDocument(
                title=title,
                document_type_code=document_type,
                source_url=source_url,
                published_at=_utcnow(),
                status_code="PUBLISHED",
                excerpt=text[:300],
                category=category,
            )
            self.repo.create_document(document)

        chunks_text = _split_into_chunks(text)
        for index, chunk_content in enumerate(chunks_text):
            self.repo.create_chunk(
                KnowledgeChunk(
                    document_id=document.id,
                    chunk_index=index,
                    source_url=source_url,
                    content=chunk_content,
                    token_count=len(chunk_content.split()),
                )
            )

        self.db.commit()
        return {"status": "ingested", "document_id": document.id, "chunks": len(chunks_text)}

    def list_documents(self) -> list[dict[str, Any]]:
        docs = self.repo.list_documents()
        return [
            {
                "id": doc.id,
                "title": doc.title,
                "type": doc.document_type_code,
                "category": doc.category,
                "sourceUrl": doc.source_url,
                "status": doc.status_code,
                "publishedAt": doc.published_at.isoformat() if doc.published_at else None,
            }
            for doc in docs
        ]
