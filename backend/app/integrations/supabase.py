from __future__ import annotations

from pathlib import Path
from typing import Any

import httpx

from app.config import get_settings

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
        params = {"grant_type": "password"}
        payload = {"email": email, "password": password}
        headers = {"apikey": settings.supabase_anon_key, "Content-Type": "application/json"}
        response = httpx.post(url, params=params, json=payload, headers=headers, timeout=10.0)
        if response.is_success:
            return response.json()
        return None

    def get_user(self, access_token: str) -> dict[str, Any] | None:
        if not self.enabled or not access_token:
            return None
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
        return None


class StorageAdapter:
    """Local-first storage adapter with a Supabase-compatible boundary."""

    def __init__(self, base_dir: Path | None = None) -> None:
        self.base_dir = base_dir or settings.storage_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_bytes(self, *, folder: str, file_name: str, content: bytes) -> str:
        safe_folder = folder.strip("/").replace("..", "_")
        safe_name = file_name.replace("/", "_")
        destination = self.base_dir / safe_folder / safe_name
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(content)
        return str(destination)

    def read_bytes(self, path: str) -> bytes:
        return Path(path).read_bytes()
