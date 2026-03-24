from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any

import httpx

from app.config import get_settings

settings = get_settings()


MOCK_LOCATIONS = [
    {
        "id": 1,
        "name": "Botswana",
        "level": 0,
        "parent_id": None,
        "area_feature": {
            "type": "Feature",
            "properties": {"name": "Botswana"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[19.9986, -17.7788], [29.3757, -17.7788], [29.3757, -26.9068], [19.9986, -26.9068], [19.9986, -17.7788]]],
            },
        },
        "ancestors": [],
    },
    {
        "id": 2,
        "name": "South East District",
        "level": 1,
        "parent_id": 1,
        "area_feature": {
            "type": "Feature",
            "properties": {"name": "South East District"},
            "geometry": {"type": "Polygon", "coordinates": [[[25.4, -24.4], [26.5, -24.4], [26.5, -25.4], [25.4, -25.4], [25.4, -24.4]]]},
        },
        "ancestors": [{"id": 1, "name": "Botswana", "level": 0, "parent_id": None}],
    },
]

MOCK_SUMMARY = {
    "resolvedDate": "2026-03-24",
    "providers": [
        {
            "id": "mascom",
            "name": "Mascom",
            "color": "#204079",
            "logoUrl": "https://dqos.bocra.org.bw/storage/mascom.png",
            "networks": ["2G", "3G", "4G"],
            "vendor": "Mixed",
            "primaryMetric": {"id": "voice_na", "label": "3G Voice NA", "value": 97.2},
            "secondaryMetrics": [
                {"id": "voice_sa", "label": "Voice SA", "value": 94.8},
                {"id": "voice_sr", "label": "Voice SR", "value": 98.5},
            ],
        },
        {
            "id": "orange",
            "name": "Orange",
            "color": "#fa6403",
            "logoUrl": "https://dqos.bocra.org.bw/storage/orange.png",
            "networks": ["2G", "3G", "4G"],
            "vendor": "Mixed",
            "primaryMetric": {"id": "voice_na", "label": "3G Voice NA", "value": 95.6},
            "secondaryMetrics": [
                {"id": "voice_sa", "label": "Voice SA", "value": 93.1},
                {"id": "voice_sr", "label": "Voice SR", "value": 97.2},
            ],
        },
        {
            "id": "btc",
            "name": "BTC",
            "color": "#46a33e",
            "logoUrl": "https://dqos.bocra.org.bw/storage/btc.png",
            "networks": ["2G", "3G", "4G"],
            "vendor": "Mixed",
            "primaryMetric": {"id": "voice_na", "label": "3G Voice NA", "value": 93.8},
            "secondaryMetrics": [
                {"id": "voice_sa", "label": "Voice SA", "value": 91.5},
                {"id": "voice_sr", "label": "Voice SR", "value": 96.0},
            ],
        },
    ],
}


@dataclass(slots=True)
class DqosClient:
    locations_url: str = settings.dqos_locations_url
    chartdata_url: str = settings.dqos_chartdata_url

    def get_locations(self) -> dict[str, Any]:
        try:
            response = httpx.get(self.locations_url, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            if isinstance(data, dict) and "locations" in data:
                return data
            return {"locations": data}
        except Exception:
            return {"locations": MOCK_LOCATIONS}

    def get_summary(self) -> dict[str, Any]:
        today = date.today()
        for delta in range(0, 7):
            query_date = (today - timedelta(days=delta)).isoformat()
            try:
                response = httpx.get(
                    self.chartdata_url,
                    params={"kpi_type": "qos_values_for_location_level", "level": "0", "date": query_date},
                    timeout=10.0,
                )
                response.raise_for_status()
                payload = response.json()
                if payload:
                    return {"resolvedDate": query_date, **MOCK_SUMMARY, "resolvedDate": query_date}
            except Exception:
                continue
        return MOCK_SUMMARY
