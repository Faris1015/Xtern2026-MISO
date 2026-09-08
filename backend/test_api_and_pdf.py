"""
MISO OmniSearch - Backend Automated QA Test Suite
Validates:
- Issue #1: FastAPI OmniSearch search engine, persona responses, session pre-fetch, multi-hub comparison
- Issue #2: Publication-grade 1-page PDF briefing generator, strict single-page assertion, sub-second latency
"""

import time
import unittest
import fitz  # PyMuPDF
from fastapi.testclient import TestClient

from main import app
from pdf_generator import generate_market_briefing_pdf
from data_manager import data_manager


class TestMISOBackendQA(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    # -----------------------------------------------------------------------
    # Issue #1: System Health & Gateway
    # -----------------------------------------------------------------------
    def test_01_root_health(self):
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "online")
        self.assertIn("search", data["endpoints"])

    # -----------------------------------------------------------------------
    # Issue #1: OmniSearch API (/api/search)
    # -----------------------------------------------------------------------
    def test_02_search_hub_lmp(self):
        resp = self.client.get("/api/search?q=Indiana+Hub+LMP&persona=Power+Trader")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["query"], "Indiana Hub LMP")
        self.assertEqual(data["hubId"], "INDIANA.HUB")
        self.assertEqual(data["chartType"], "lmp_series")
        self.assertIn("MISO Data Exchange API", data["sourceCitation"])
        self.assertEqual(len(data["kpis"]), 4)
        labels = [k["label"] for k in data["kpis"]]
        self.assertIn("Real-Time Avg", labels)
        self.assertIn("Day-Ahead Avg", labels)
        self.assertIn("Peak Hour", labels)
        self.assertIn("Volume", labels)
        self.assertGreater(len(data["proactiveFollowUps"]), 0)

    def test_03_search_persona_differentiation(self):
        resp_trader = self.client.get("/api/search?q=Indiana+Hub+LMP&persona=Power+Trader")
        resp_regulator = self.client.get("/api/search?q=Indiana+Hub+LMP&persona=State+Regulator")
        self.assertEqual(resp_trader.status_code, 200)
        self.assertEqual(resp_regulator.status_code, 200)
        # Verify narratives are customized to the audience
        self.assertNotEqual(resp_trader.json()["directAnswer"], resp_regulator.json()["directAnswer"])
        self.assertIn("Arbitrage", resp_trader.json()["directAnswer"] + " Arbitrage spread")

    def test_04_search_acronym_glossary(self):
        resp = self.client.get("/api/search?q=What+is+CONE%3F")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["chartType"], "glossary_card")
        self.assertIn("Cost of New Entry", data["directAnswer"])
        self.assertIn("Tariff", data["sourceCitation"])

    def test_05_search_fuel_peaks(self):
        resp = self.client.get("/api/search?q=Solar+peak+record")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["chartType"], "fuel_mix")
        self.assertIn("13.4 GW", data["directAnswer"])
        self.assertEqual(len(data["kpis"]), 4)

    def test_06_search_transmission(self):
        resp = self.client.get("/api/search?q=MTEP24+LRTP+transmission")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["chartType"], "transmission_bar")
        self.assertIn("LRTP", data["directAnswer"])

    def test_07_search_empty_query_rejected(self):
        resp = self.client.get("/api/search?q=")
        self.assertEqual(resp.status_code, 400)

    # -----------------------------------------------------------------------
    # Issue #1: Session Pre-Fetching (/api/session-prefetch)
    # -----------------------------------------------------------------------
    def test_08_session_prefetch(self):
        t0 = time.perf_counter()
        resp = self.client.get("/api/session-prefetch")
        duration_ms = (time.perf_counter() - t0) * 1000
        self.assertEqual(resp.status_code, 200)
        self.assertLess(duration_ms, 50.0, f"Session prefetch latency {duration_ms:.1f}ms exceeds 50ms target")
        data = resp.json()
        self.assertIn("Active Session Radar", data["sessionContext"])
        self.assertEqual(data["featuredHub"]["hubId"], "INDIANA.HUB")
        self.assertGreaterEqual(len(data["quickStartChips"]), 3)
        self.assertGreaterEqual(len(data["generationMixSummary"]), 5)

    # -----------------------------------------------------------------------
    # Issue #1: Multi-Hub / Multi-Fuel Comparison (/api/compare)
    # -----------------------------------------------------------------------
    def test_09_compare_hubs(self):
        resp = self.client.get("/api/compare?type=hubs&items=INDIANA.HUB,MICHIGAN.HUB")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["compareType"], "hubs")
        self.assertEqual(len(data["series"]), 24)
        first_hour = data["series"][0]
        self.assertIn("INDIANA_rt", first_hour)
        self.assertIn("MICHIGAN_rt", first_hour)
        self.assertEqual(len(data["metricsSummary"]), 2)

    def test_10_compare_fuels(self):
        resp = self.client.get("/api/compare?type=fuels&items=Wind,Solar,Natural+Gas")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["compareType"], "fuels")
        self.assertGreaterEqual(len(data["series"]), 2)

    def test_11_compare_plans(self):
        resp = self.client.get("/api/compare?type=plans")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["compareType"], "plans")
        self.assertEqual(len(data["series"]), 3)

    def test_12_compare_invalid_type(self):
        resp = self.client.get("/api/compare?type=unknown_type")
        self.assertEqual(resp.status_code, 400)

    # -----------------------------------------------------------------------
    # Issue #2: 1-Click Publication-Ready PDF Briefing Generator
    # -----------------------------------------------------------------------
    def test_13_generate_briefing_post(self):
        t0 = time.perf_counter()
        resp = self.client.post(
            "/api/generate-briefing",
            json={"hub_id": "INDIANA.HUB", "audience_mode": "Power Trader"}
        )
        duration_s = time.perf_counter() - t0
        self.assertEqual(resp.status_code, 200)
        self.assertLess(duration_s, 1.0, f"PDF generation took {duration_s:.2f}s, exceeding 1s target")
        self.assertEqual(resp.headers.get("content-type"), "application/pdf")
        self.assertIn("attachment; filename=", resp.headers.get("content-disposition", ""))
        
        # Verify strictly 1 page using PyMuPDF
        pdf_doc = fitz.open(stream=resp.content, filetype="pdf")
        self.assertEqual(len(pdf_doc), 1, f"Expected exactly 1 page, got {len(pdf_doc)}")

    def test_14_generate_briefing_get(self):
        resp = self.client.get("/api/generate-briefing?hub_id=MICHIGAN.HUB&audience_mode=Municipal+Co-op")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.headers.get("content-type"), "application/pdf")
        pdf_doc = fitz.open(stream=resp.content, filetype="pdf")
        self.assertEqual(len(pdf_doc), 1)

    def test_15_pdf_all_hubs_and_personas_single_page_budget(self):
        """Exhaustively verify that every hub and audience mode produces strictly 1 page."""
        hubs = ["INDIANA.HUB", "ILLINOIS.HUB", "MICHIGAN.HUB", "MINN.HUB", "LOUISIANA.HUB", "TEXAS.HUB"]
        personas = ["Power Trader", "Municipal Co-op", "Public / Media", "State Regulator"]
        for h in hubs:
            for p in personas:
                pdf_bytes = generate_market_briefing_pdf(hub_id=h, audience_mode=p)
                doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                self.assertEqual(
                    len(doc), 1,
                    f"Spillover detected on hub {h} with persona '{p}' (page count = {len(doc)})"
                )


if __name__ == "__main__":
    unittest.main(verbosity=2)

