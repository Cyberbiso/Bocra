from __future__ import annotations

from typing import Any

import httpx

from app.config import get_settings

settings = get_settings()


class CustomerPortalClient:
    """Thin wrapper around the BOCRA Customer Portal API for licence verification search.

    Falls back to an empty result set when the remote is unreachable.
    """

    def __init__(self, base_url: str = settings.customer_portal_url) -> None:
        self.base_url = base_url.rstrip("/")

    def search_licences(
        self,
        *,
        client_id: str = "",
        licence_number: str = "",
        licence_type: str = "",
        page: int = 1,
        page_size: int = 10,
        name: str = "",
    ) -> dict[str, Any]:
        params: dict[str, Any] = {
            "clientId": client_id,
            "licenseNumber": licence_number,
            "licenseType": licence_type,
            "page": page,
            "pageSize": page_size,
            "name": name,
        }
        try:
            response = httpx.get(
                f"{self.base_url}/licenses",
                params={k: v for k, v in params.items() if v},
                timeout=8.0,
            )
            response.raise_for_status()
            return response.json()
        except Exception:
            return {"totalCount": 0, "pageNumber": page, "pageSize": page_size, "data": [], "source": "fallback"}
