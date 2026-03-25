from __future__ import annotations

import io
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class CloudinaryAdapter:
    """
    Cloudinary storage adapter for BOCRA file assets.

    All uploads land in the `bocra/<sub-folder>` folder on Cloudinary.
    Uses resource_type="auto" so images, PDFs, and DOCX are all handled.
    Falls back gracefully (returns None) when Cloudinary is not configured
    or a request fails — callers should then use local disk.
    """

    def __init__(
        self,
        *,
        cloud_name: str,
        api_key: str,
        api_secret: str,
        root_folder: str = "bocra",
    ) -> None:
        self._enabled = bool(cloud_name and api_key and api_secret)
        if not self._enabled:
            return

        import cloudinary
        import cloudinary.uploader
        import cloudinary.api

        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True,
        )
        self._root_folder = root_folder.strip("/")
        self._uploader = cloudinary.uploader
        self._api = cloudinary.api

    @property
    def enabled(self) -> bool:
        return self._enabled

    # ── Upload ────────────────────────────────────────────────────────────────

    def upload(
        self,
        content: bytes,
        *,
        sub_folder: str,
        file_name: str,
        content_type: str = "application/octet-stream",
    ) -> dict[str, Any] | None:
        """
        Upload bytes to Cloudinary.

        Returns the Cloudinary result dict (contains `public_id`, `secure_url`,
        `resource_type`, etc.) or None on failure.
        """
        if not self._enabled:
            return None

        folder = f"{self._root_folder}/{sub_folder.strip('/')}" if sub_folder else self._root_folder
        # Strip extension from file_name — Cloudinary appends the right one.
        public_id = f"{folder}/{file_name}"

        try:
            result = self._uploader.upload(
                io.BytesIO(content),
                public_id=public_id,
                resource_type="auto",
                overwrite=True,
                use_filename=True,
                unique_filename=False,
            )
            logger.info("Cloudinary upload OK: %s", result.get("secure_url"))
            return result
        except Exception as exc:
            logger.error("Cloudinary upload failed for %s: %s", public_id, exc)
            return None

    # ── Download ──────────────────────────────────────────────────────────────

    def download(self, secure_url: str) -> bytes | None:
        """Fetch raw bytes from a Cloudinary secure_url."""
        if not self._enabled or not secure_url:
            return None
        try:
            response = httpx.get(secure_url, timeout=30.0)
            if response.is_success:
                return response.content
            logger.error("Cloudinary download error %s for %s", response.status_code, secure_url)
        except httpx.RequestError as exc:
            logger.error("Cloudinary download request error: %s", exc)
        return None

    # ── Delete ────────────────────────────────────────────────────────────────

    def delete(self, public_id: str, resource_type: str = "auto") -> bool:
        """Delete an asset by public_id. Returns True on success."""
        if not self._enabled:
            return False
        try:
            result = self._uploader.destroy(public_id, resource_type=resource_type)
            return result.get("result") == "ok"
        except Exception as exc:
            logger.error("Cloudinary delete failed for %s: %s", public_id, exc)
            return False

    # ── URL helpers ───────────────────────────────────────────────────────────

    def secure_url(self, public_id: str, resource_type: str = "image") -> str:
        """Build a secure URL for a known public_id without an API call."""
        import cloudinary
        return cloudinary.CloudinaryImage(public_id).build_url(secure=True, resource_type=resource_type)
