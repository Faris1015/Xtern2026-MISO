"""
MISO OmniSearch - Real-Time MISO Ingestion Client
Provides live, rate-limited, cached connectivity to MISO's public operations API
(public-api.misoenergy.org) and MISO Data Exchange portal (Azure APIM).
"""

from __future__ import annotations

import logging
import os
import time
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
import httpx

# Load .env variables
load_dotenv()

logger = logging.getLogger("miso.client")

# Color mapping matching MISO Knowledge Canvas Design Tokens
FUEL_COLOR_MAP: Dict[str, str] = {
    "Natural Gas": "#0284C7",
    "Coal": "#475569",
    "Nuclear": "#8B5CF6",
    "Solar": "#F59E0B",
    "Wind": "#10B981",
    "Battery Storage": "#06B6D4",
    "Hydro": "#38BDF8",
    "Other": "#94A3B8",
    "Imports": "#6366F1",
}

# Regional Installed Capacity Baseline (GW) from MISO Corporate Fact Sheet
INSTALLED_GW_MAP: Dict[str, float] = {
    "Natural Gas": 81.2,
    "Coal": 52.8,
    "Wind": 30.5,
    "Nuclear": 28.4,
    "Solar": 6.1,
    "Hydro": 4.1,
    "Battery Storage": 1.9,
    "Other": 2.5,
    "Imports": 3.5,
}


class MISOClient:
    """Client for pulling real-time operations data from MISO's public and authenticated APIs."""

    def __init__(self) -> None:
        self.public_base_url = os.getenv("MISO_PUBLIC_API_BASE", "https://public-api.misoenergy.org").rstrip("/")
        self.api_key = os.getenv("MISO_API_KEY", "").strip()
        self.cache_ttl = int(os.getenv("MISO_CACHE_TTL_SECONDS", "60"))
        
        # In-memory TTL cache: key -> {"data": Any, "expires_at": float}
        self._cache: Dict[str, Dict[str, Any]] = {}

    def is_cache_valid(self, cache_key: str) -> bool:
        entry = self._cache.get(cache_key)
        if not entry:
            return False
        return time.time() < entry["expires_at"]

    def get_cached(self, cache_key: str) -> Optional[Any]:
        if self.is_cache_valid(cache_key):
            return self._cache[cache_key]["data"]
        return None

    def set_cached(self, cache_key: str, data: Any, ttl: Optional[int] = None) -> None:
        effective_ttl = ttl if ttl is not None else self.cache_ttl
        self._cache[cache_key] = {
            "data": data,
            "expires_at": time.time() + effective_ttl,
            "cached_at": time.time(),
        }

    def get_api_status(self) -> Dict[str, Any]:
        """Returns MISO API connectivity status, key configuration, and active cache state."""
        return {
            "operationsApi": {
                "baseUrl": self.public_base_url,
                "endpoint": f"{self.public_base_url}/api/FuelMix",
                "authRequired": False,
                "status": "connected",
                "cadence": "5-minute live updates",
                "cacheTtlSeconds": self.cache_ttl,
                "cached": self.is_cache_valid("live_fuel_mix"),
            },
            "dataExchange": {
                "portal": "https://data-exchange.misoenergy.org",
                "authHeader": "Ocp-Apim-Subscription-Key",
                "isKeyConfigured": bool(self.api_key),
                "apiKeyMasked": f"{self.api_key[:4]}...{self.api_key[-4:]}" if self.api_key else None,
                "tier": "Azure API Management (APIM)",
            },
        }

    def fetch_live_fuel_mix(self) -> Optional[Dict[str, Any]]:
        """
        Fetches live 5-minute fuel mix from public-api.misoenergy.org/api/FuelMix.
        Respects in-memory TTL cache to strictly enforce MISO's <= 1 request/min guidance.
        """
        cache_key = "live_fuel_mix"
        cached = self.get_cached(cache_key)
        if cached is not None:
            return cached

        url = f"{self.public_base_url}/api/FuelMix"
        try:
            with httpx.Client(timeout=4.0) as client:
                resp = client.get(url)
                if resp.status_code != 200:
                    logger.warning("MISO FuelMix API returned HTTP %s: %s", resp.status_code, resp.text[:120])
                    return None
                payload = resp.json()
        except Exception as e:
            logger.warning("Failed to connect to live MISO FuelMix API (%s): %s", url, e)
            return None

        # Parse MISO JSON schema
        ref_id = payload.get("RefId", "Live Grid Interval")
        raw_total_mw = float(payload.get("TotalMW", 0.0) or 0.0)
        fuel_types = payload.get("Fuel", {}).get("Type", [])

        if not fuel_types:
            logger.warning("MISO FuelMix response missing 'Fuel.Type' array")
            return None

        # Tally and calculate percentages
        generation_mix: List[Dict[str, Any]] = []
        positive_mw_sum = 0.0

        for item in fuel_types:
            category = item.get("CATEGORY", "").strip()
            act_mw = float(item.get("ACT", 0.0) or 0.0)
            if act_mw > 0:
                positive_mw_sum += act_mw

        calc_base = positive_mw_sum if positive_mw_sum > 0 else (raw_total_mw if raw_total_mw > 0 else 1.0)

        for item in fuel_types:
            category = item.get("CATEGORY", "").strip()
            act_mw = float(item.get("ACT", 0.0) or 0.0)
            pct = round((act_mw / calc_base) * 100.0, 1) if act_mw > 0 else 0.0
            color = FUEL_COLOR_MAP.get(category, "#64748B")

            installed_gw = INSTALLED_GW_MAP.get(category, round(act_mw / 1000.0, 1))
            generation_mix.append({
                "fuel": category,
                "percentage": max(pct, 0.0),
                "actualMw": act_mw,
                "formattedMw": f"{act_mw:,.0f} MW",
                "installedGw": installed_gw,
                "color": color,
            })

        # Sort by actual generation descending
        generation_mix.sort(key=lambda x: x["actualMw"], reverse=True)

        formatted_result = {
            "reportTitle": "MISO Real-Time Grid Fuel Mix",
            "effectiveDate": ref_id,
            "isLive": True,
            "dataSource": "live_miso_public_api",
            "totalMw": raw_total_mw or positive_mw_sum,
            "formattedTotalMw": f"{(raw_total_mw or positive_mw_sum):,.0f} MW",
            "generationMix": generation_mix,
            "intervalEst": fuel_types[0].get("INTERVALEST", time.strftime("%Y-%m-%d %H:%M:%S")),
        }

        # Cache valid result
        self.set_cached(cache_key, formatted_result)
        logger.info("Successfully fetched and cached live MISO FuelMix (%s, Total: %s MW)", ref_id, raw_total_mw)
        return formatted_result

    def fetch_live_lmp(self, hub_id: str) -> Optional[Dict[str, Any]]:
        """
        Queries MISO Data Exchange for real-time LMP if MISO_API_KEY is present.
        Returns None if no key is configured, allowing fallback to verified model.
        """
        if not self.api_key:
            return None

        cache_key = f"live_lmp_{hub_id}"
        cached = self.get_cached(cache_key)
        if cached is not None:
            return cached

        # MISO Data Exchange Azure APIM Endpoint
        url = f"https://data-exchange.misoenergy.org/api/v1/realtime/lmp?hub={hub_id}"
        headers = {"Ocp-Apim-Subscription-Key": self.api_key}
        try:
            with httpx.Client(timeout=4.0) as client:
                resp = client.get(url, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    self.set_cached(cache_key, data)
                    return data
                logger.warning("MISO Data Exchange returned HTTP %s for hub %s", resp.status_code, hub_id)
        except Exception as e:
            logger.warning("Failed to query MISO Data Exchange for %s: %s", hub_id, e)
        return None


miso_client = MISOClient()
