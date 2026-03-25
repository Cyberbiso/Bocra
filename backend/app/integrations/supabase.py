from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class SupabaseAuthAdapter:
    def __init__(self) -> None:
        self._enabled = bool(settings.supabase_url and settings.supabase_anon_key)

    @property
    def enabled(self) -> bool:
        return self._enabled

    def password_sign_in(self, email: str, password: str) -> dict[str, Any] | None:
        if not self.enabled:
            return None
        url = f"{settings.supabase_url}/auth/v1/token"
        try:
            response = httpx.post(
                url,
                params={"grant_type": "password"},
                json={"email": email, "password": password},
                headers={"apikey": settings.supabase_anon_key, "Content-Type": "application/json"},
                timeout=10.0,
            )
            if response.is_success:
                return response.json()
        except httpx.RequestError as exc:
            logger.warning("Supabase auth sign-in failed: %s", exc)
        return None

    def sign_up(self, email: str, password: str, metadata: dict[str, Any] | None = None) -> dict[str, Any] | None:
        if not self.enabled:
            return None
        try:
            response = httpx.post(
                f"{settings.supabase_url}/auth/v1/signup",
                json={"email": email, "password": password, "data": metadata or {}},
                headers={"apikey": settings.supabase_anon_key, "Content-Type": "application/json"},
                timeout=10.0,
            )
            if response.is_success:
                return response.json()
            logger.warning("Supabase sign_up error %s: %s", response.status_code, response.text)
        except httpx.RequestError as exc:
            logger.warning("Supabase sign_up failed: %s", exc)
        return None

    def get_user(self, access_token: str) -> dict[str, Any] | None:
        if not self.enabled or not access_token:
            return None
        try:
            response = httpx.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "apikey": settings.supabase_anon_key,
                    "Authorization": f"Bearer {access_token}",
                },
                timeout=10.0,
            )
            if response.is_success:
                return response.json()
        except httpx.RequestError as exc:
            logger.warning("Supabase get_user failed: %s", exc)
        return None

    def sign_out(self, access_token: str) -> None:
        if not self.enabled or not access_token:
            return
        try:
            httpx.post(
                f"{settings.supabase_url}/auth/v1/logout",
                headers={
                    "apikey": settings.supabase_anon_key,
                    "Authorization": f"Bearer {access_token}",
                },
                timeout=10.0,
            )
        except httpx.RequestError as exc:
            logger.warning("Supabase sign_out failed: %s", exc)

    def admin_create_user(
        self,
        email: str,
        password: str,
        *,
        email_confirm: bool = True,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any] | None:
        """Create a user via the Supabase Admin API (requires service role key).
        Used only for seeding — real users register via the external portal."""
        if not self.enabled or not settings.supabase_service_role_key:
            return None
        try:
            response = httpx.post(
                f"{settings.supabase_url}/auth/v1/admin/users",
                json={
                    "email": email,
                    "password": password,
                    "email_confirm": email_confirm,
                    "user_metadata": metadata or {},
                },
                headers={
                    "apikey": settings.supabase_service_role_key,
                    "Authorization": f"Bearer {settings.supabase_service_role_key}",
                    "Content-Type": "application/json",
                },
                timeout=15.0,
            )
            if response.is_success:
                return response.json()
            logger.warning("Supabase admin_create_user error %s: %s", response.status_code, response.text)
        except httpx.RequestError as exc:
            logger.error("Supabase admin_create_user failed: %s", exc)
        return None


class StorageAdapter:
    """
    Storage adapter — priority chain:
      1. Cloudinary  (primary, configured via CLOUDINARY_* env vars)
      2. Local disk  (fallback when Cloudinary is unavailable)

    Supabase Storage is intentionally removed in favour of Cloudinary.
    Supabase is still used for Auth (SupabaseAuthAdapter above).

    Stored paths:
      - Cloudinary: stores the `secure_url` returned by the API.
      - Local disk:  stores the absolute file-system path.
    """

    def __init__(self, base_dir: Path | None = None) -> None:
        from app.integrations.cloudinary_storage import CloudinaryAdapter

        self.base_dir = base_dir or settings.storage_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self._cloudinary = CloudinaryAdapter(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            root_folder=settings.cloudinary_folder,
        )

    # ── public API ────────────────────────────────────────────────────────────

    def save_bytes(
        self,
        *,
        folder: str,
        file_name: str,
        content: bytes,
        content_type: str = "application/octet-stream",
    ) -> str:
        """Upload content and return a retrievable path/URL string."""
        safe_folder = folder.strip("/").replace("..", "_")
        safe_name = file_name.replace("/", "_").replace("\\", "_")

        if self._cloudinary.enabled:
            result = self._cloudinary.upload(
                content,
                sub_folder=safe_folder,
                file_name=safe_name,
                content_type=content_type,
            )
            if result:
                # Store the secure_url — used directly for download & display.
                return result["secure_url"]
            logger.warning("Cloudinary upload failed — falling back to local disk for %s/%s", safe_folder, safe_name)

        return self._save_local(safe_folder, safe_name, content)

    def read_bytes(self, path: str) -> bytes:
        """Download content from a stored path or URL."""
        # Cloudinary paths are https:// URLs
        if path.startswith("https://"):
            data = self._cloudinary.download(path)
            if data is not None:
                return data
            logger.warning("Cloudinary download failed for %s — trying local fallback", path)

        return Path(path).read_bytes()

    def delete(self, path: str) -> bool:
        """Delete an asset. Returns True on success."""
        if path.startswith("https://") and self._cloudinary.enabled:
            # Extract public_id from secure_url: everything after /upload/[version/]
            try:
                segment = path.split("/upload/")[-1]
                # Drop optional version prefix v1234567890/
                if segment.startswith("v") and "/" in segment:
                    segment = segment.split("/", 1)[1]
                # Drop file extension
                public_id = segment.rsplit(".", 1)[0]
                return self._cloudinary.delete(public_id)
            except Exception as exc:
                logger.error("Could not parse Cloudinary public_id from %s: %s", path, exc)
                return False

        local = Path(path)
        if local.exists():
            local.unlink()
            return True
        return False

    def public_url(self, path: str) -> str | None:
        """Return a publicly accessible URL for a stored asset."""
        if path.startswith("https://"):
            return path         # Already a Cloudinary URL
        return None             # Local paths are not publicly accessible

    # ── local disk fallback ───────────────────────────────────────────────────

    def _save_local(self, folder: str, file_name: str, content: bytes) -> str:
        destination = self.base_dir / folder / file_name
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(content)
        return str(destination)
