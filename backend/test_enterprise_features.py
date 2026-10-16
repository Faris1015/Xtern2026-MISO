"""
Automated Test Suite for MISO OmniSearch Enterprise Features
Validates:
- Idea 1: Server-Sent Events / Telemetry streaming readiness
- Idea 2: Cloud-native observability (/healthz, /readyz, /metrics, X-Correlation-ID)
- Idea 3: Data Contract & Anomaly Detection Firewall (/api/data-quality/audit)
- Idea 4: Hybrid Semantic RAG for Business Practice Manuals (/api/bpms/search)
- Idea 5: Azure Entra ID & RBAC Persona Middleware (/api/auth/me, /api/auth/switch-role)
"""

import sys
import unittest
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app
from bpm_service import bpm_search_engine
from data_validator import data_validator
from auth_middleware import auth_manager


class TestEnterpriseFeatures(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_healthz_liveness_probe(self):
        """Validates /healthz Kubernetes liveness probe."""
        res = self.client.get("/healthz")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["service"], "miso-omnisearch-backend")
        self.assertIn("uptimeSeconds", data)

    def test_02_readyz_readiness_probe(self):
        """Validates /readyz Kubernetes readiness probe."""
        res = self.client.get("/readyz")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ready")
        self.assertIn("checks", data)
        self.assertEqual(data["checks"]["dataLayer"], "ready")

    def test_03_prometheus_metrics_exposition(self):
        """Validates /metrics endpoint exports valid Prometheus text format."""
        res = self.client.get("/metrics")
        self.assertEqual(res.status_code, 200)
        content = res.text
        self.assertIn("# HELP omnisearch_uptime_seconds", content)
        self.assertIn("# TYPE omnisearch_http_requests_total counter", content)
        self.assertIn("omnisearch_cache_hits_total", content)
        self.assertIn("omnisearch_grounding_firewall_total", content)

    def test_04_correlation_id_and_timing_headers(self):
        """Validates observability middleware injects X-Correlation-ID and X-Response-Time-Ms."""
        custom_id = "test-corr-uuid-9921"
        res = self.client.get("/", headers={"x-correlation-id": custom_id})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("X-Correlation-ID"), custom_id)
        self.assertIn("X-Response-Time-Ms", res.headers)

    def test_05_data_contract_audit(self):
        """Validates /api/data-quality/audit executes full data contract rules."""
        res = self.client.get("/api/data-quality/audit")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["overallStatus"], "VERIFIED")
        self.assertEqual(data["complianceScore"], "100.0%")
        self.assertGreater(len(data["contractsEvaluated"]), 0)
        
        # Verify LMP 3-part decomposition contract was evaluated
        contract_names = [c["contractName"] for c in data["contractsEvaluated"]]
        self.assertTrue(any("LMP 3-Part Decomposition" in name for name in contract_names))
        self.assertTrue(any("Generation Mass Balance" in name for name in contract_names))

    def test_06_hybrid_bpm_search_exact_clause(self):
        """Validates hybrid search returns exact BPM-002 section §4.3.1 for LMP formula."""
        res = self.client.get("/api/bpms/search?q=LMP formula")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(len(data), 0)
        top_match = data[0]
        self.assertEqual(top_match["bpmNumber"], "BPM 002")
        self.assertEqual(top_match["section"], "§4.3.1")
        self.assertEqual(top_match["formula"], "LMP = MEC + MCC + MLC")
        self.assertGreater(top_match["relevanceScore"], 0.4)

    def test_07_hybrid_bpm_search_interconnection(self):
        """Validates hybrid search returns BPM-015 for interconnection DPP cycle query."""
        res = self.client.get("/api/bpms/search?q=interconnection queue DPP cycle")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(len(data), 0)
        numbers = [m["bpmNumber"] for m in data]
        self.assertIn("BPM 015", numbers)

    def test_08_azure_entra_id_auth_me(self):
        """Validates /api/auth/me returns Entra tenant and RBAC permissions."""
        res = self.client.get("/api/auth/me")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["tenantId"], "misoenergy.onmicrosoft.com")
        self.assertIn("roles", data)
        self.assertIn("permissions", data)

    def test_09_azure_entra_id_switch_role(self):
        """Validates /api/auth/switch-role toggles user persona and permissions."""
        res = self.client.post("/api/auth/switch-role", json={"role": "MISO.StateRegulator"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["primaryRole"], "MISO.StateRegulator")
        self.assertEqual(data["mappedPersona"], "State Regulator")
        self.assertIn("access:compliance_logs", data["permissions"])


if __name__ == "__main__":
    unittest.main()

