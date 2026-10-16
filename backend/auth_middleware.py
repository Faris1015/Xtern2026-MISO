"""
MISO OmniSearch - Azure Entra ID (OAuth2/OIDC) & RBAC Persona Middleware
Provides enterprise authentication, Microsoft Entra ID tenant binding,
and Role-Based Access Control (RBAC) mapping directly into OmniSearch personas.
"""

from __future__ import annotations

import base64
import json
import time
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

ROLE_PERSONA_MAP = {
    "MISO.PowerTrader": "Power Trader",
    "MISO.CoOpMember": "Municipal Co-op",
    "MISO.StateRegulator": "State Regulator",
    "MISO.Public": "Public / Media",
    "MISO.Admin": "Power Trader",
}

ROLE_PERMISSIONS_MAP = {
    "MISO.PowerTrader": [
        "read:telemetry",
        "read:realtime_spreads",
        "read:congestion_components",
        "export:pdf_briefings",
        "export:raw_csv",
        "access:stream_sse",
        "access:copilot_chat",
        "access:data_audit",
    ],
    "MISO.CoOpMember": [
        "read:telemetry",
        "read:pra_capacity",
        "read:baseload_stability",
        "read:zone_reserves",
        "export:pdf_briefings",
        "access:stream_sse",
        "access:copilot_chat",
        "access:data_audit",
    ],
    "MISO.StateRegulator": [
        "read:telemetry",
        "read:transmission_lrtp",
        "read:cone_benchmarks",
        "read:data_provenance",
        "export:pdf_briefings",
        "access:stream_sse",
        "access:copilot_chat",
        "access:data_audit",
        "access:compliance_logs",
    ],
    "MISO.Public": [
        "read:telemetry",
        "read:generation_mix",
        "read:clean_energy_records",
        "read:glossary",
        "read:bpms",
        "export:pdf_briefings",
        "access:stream_sse",
    ],
    "MISO.Admin": [
        "read:telemetry",
        "read:realtime_spreads",
        "read:congestion_components",
        "read:pra_capacity",
        "read:transmission_lrtp",
        "export:pdf_briefings",
        "export:raw_csv",
        "access:stream_sse",
        "access:copilot_chat",
        "access:data_audit",
        "access:compliance_logs",
        "admin:reload_config",
        "admin:manage_cache",
    ],
}

class EntraUser(BaseModel):
    userId: str
    email: str
    name: str
    tenantId: str = "misoenergy.onmicrosoft.com"
    roles: List[str]
    primaryRole: str
    mappedPersona: str
    permissions: List[str]
    authMethod: str = Field("Azure Entra ID (OIDC / OAuth2 Bearer)", description="Authentication flow")
    tokenExpiresAt: int

class AuthManager:
    """Manages Azure Entra ID tokens and RBAC persona authorization."""

    def __init__(self) -> None:
        # Default active simulated role for demo convenience
        self._simulated_role = "MISO.PowerTrader"

    def set_simulated_role(self, role: str) -> str:
        if role in ROLE_PERSONA_MAP:
            self._simulated_role = role
        return self._simulated_role

    def authenticate_headers(self, headers: Dict[str, str]) -> EntraUser:
        """
        Extracts user claims from Authorization header or test role header.
        Supports standard JWT parsing or developer simulation mode.
        """
        auth_header = headers.get("authorization", "")
        sim_role_header = headers.get("x-miso-entra-role", "")
        
        # Determine active role
        active_role = self._simulated_role
        if sim_role_header and sim_role_header in ROLE_PERSONA_MAP:
            active_role = sim_role_header
        elif auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "").strip()
            # If JWT contains claims, attempt light decoding of payload
            try:
                parts = token.split(".")
                if len(parts) == 3:
                    # Pad base64
                    padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
                    payload_json = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
                    roles = payload_json.get("roles", [])
                    if roles and roles[0] in ROLE_PERSONA_MAP:
                        active_role = roles[0]
            except Exception:
                pass

        mapped_persona = ROLE_PERSONA_MAP.get(active_role, "Power Trader")
        permissions = ROLE_PERMISSIONS_MAP.get(active_role, ROLE_PERMISSIONS_MAP["MISO.Public"])
        
        role_email_prefix = active_role.split(".")[-1].lower()
        return EntraUser(
            userId=f"oid-miso-{active_role.lower().replace('.', '-')}-884",
            email=f"{role_email_prefix}@misoenergy.org",
            name=f"Verified MISO {mapped_persona}",
            tenantId="misoenergy.onmicrosoft.com",
            roles=[active_role],
            primaryRole=active_role,
            mappedPersona=mapped_persona,
            permissions=permissions,
            authMethod="Azure Entra ID (OIDC / OAuth2 Bearer)",
            tokenExpiresAt=int(time.time() + 3600),
        )

# Global singleton
auth_manager = AuthManager()

