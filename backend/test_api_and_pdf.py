"""
MISO OmniSearch - Backend Automated QA Test Suite
Validates:
- Issue #1: FastAPI OmniSearch search engine, persona responses, session pre-fetch, multi-hub comparison
- Issue #2: Publication-grade 1-page PDF briefing generator, strict single-page assertion, sub-second latency
"""

import sys
import time
import unittest
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

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
        self.assertTrue("LRTP" in data["directAnswer"] or "Transmission" in data["directAnswer"] or "transmission" in data["directAnswer"].lower())

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
        self.assertLess(duration_s, 2.5, f"PDF generation took {duration_s:.2f}s, exceeding 2.5s target")
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

    # -----------------------------------------------------------------------
    # Issue #1 & #6: Glossary & Single Source of Truth
    # -----------------------------------------------------------------------
    def test_16_glossary_all(self):
        resp = self.client.get("/api/glossary")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreaterEqual(len(data), 68)
        self.assertIn("LMP", data)
        self.assertIn("CONE", data)
        self.assertEqual(data["LMP"]["acronym"], "LMP")
        self.assertIn("Locational Marginal Price", data["LMP"]["term"])
        self.assertTrue(bool(data["LMP"]["eli5"]))

    def test_17_glossary_single_term(self):
        resp = self.client.get("/api/glossary/LMP")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["acronym"], "LMP")
        self.assertEqual(data["term"], "Locational Marginal Price")

        # Non-existent term returns 404
        resp_404 = self.client.get("/api/glossary/NON_EXISTENT_XYZ")
        self.assertEqual(resp_404.status_code, 404)

    def test_18_search_exact_acronym(self):
        # Querying exact acronym "LMP" must route to glossary card, not fallback hub
        resp = self.client.get("/api/search?q=LMP")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["chartType"], "glossary_card")
        self.assertIn("Locational Marginal Price", data["directAnswer"])

    # -----------------------------------------------------------------------
    # MISO Staff Operational Personas & Telemetry Terms (ICCP, EMS, COD, etc.)
    # -----------------------------------------------------------------------
    def test_19_staff_acronyms_and_telemetry(self):
        staff_terms = ["ICCP", "EMS", "COD", "NIC", "MP", "TO", "IC"]
        for term in staff_terms:
            resp = self.client.get(f"/api/glossary/{term}")
            self.assertEqual(resp.status_code, 200, f"Glossary term {term} failed to resolve")
            data = resp.json()
            self.assertEqual(data["acronym"], term)
            self.assertTrue(len(data["term"]) > 0)
            self.assertTrue(len(data["eli5"]) > 0)

        # Exact acronym search routing for ICCP and COD
        resp_iccp = self.client.get("/api/search?q=ICCP")
        self.assertEqual(resp_iccp.status_code, 200)
        self.assertEqual(resp_iccp.json()["chartType"], "glossary_card")

        resp_cod = self.client.get("/api/search?q=What is COD?")
        self.assertEqual(resp_cod.status_code, 200)
        self.assertEqual(resp_cod.json()["chartType"], "glossary_card")

        # Telemetry query returns ICCP/EMS follow-ups
        resp_telemetry = self.client.get("/api/search?q=telemetry")
        self.assertEqual(resp_telemetry.status_code, 200)
        labels = [f["label"] for f in resp_telemetry.json()["proactiveFollowUps"]]
        self.assertTrue(any("ICCP" in l for l in labels))

    def test_20_grid_telemetry(self):
        resp = self.client.get("/api/grid-telemetry")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["forecastedPeakDemandMw"], 107605)
        self.assertGreater(data["currentDemandMw"], 50000)
        self.assertEqual(data["marginalEnergyCost"], 45.01)
        self.assertEqual(data["scheduledNetInterchangeMw"], -4248)
        self.assertEqual(data["status"], "Normal Operations")
        self.assertIn("North", data["regions"])
        self.assertIn("Central", data["regions"])
        self.assertIn("South", data["regions"])
        self.assertIn("demand", data["drillDownQueries"])

    # -----------------------------------------------------------------------
    # Issues #9-#13: LLM Enhancements, Copilot Chat & Domain Guardrail Tests
    # -----------------------------------------------------------------------
    def test_21_out_of_scope_domain_guidance(self):
        """Issue #11: Non-MISO queries return structured guidance card instead of arbitrary market data."""
        resp = self.client.get("/api/search?q=how+to+bake+chocolate+chip+cookies")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["chartType"], "guidance_card")
        self.assertIn("outside the scope of MISO", data["directAnswer"])
        self.assertGreaterEqual(len(data["proactiveFollowUps"]), 3)
        self.assertIn("suggestedQueries", data["data"])

    def test_22_canvas_copilot_chat(self):
        """Issue #10: POST /api/canvas-chat returns grounded analytical response and follow-ups."""
        canvas_ctx = {
            "query": "Indiana Hub LMP",
            "chartType": "lmp_series",
            "hubId": "INDIANA.HUB",
            "kpis": [{"label": "Real-Time Avg", "value": "$38.45/MWh"}],
            "data": [{"hourEnding": 18, "realTimeLmp": 48.20}],
            "sourceCitation": "MISO Data Exchange API",
        }
        payload = {
            "message": "Why did price spike around hour 18?",
            "canvasContext": canvas_ctx,
            "persona": "Power Trader",
            "history": []
        }
        resp = self.client.post("/api/canvas-chat", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("response", data)
        self.assertGreater(len(data["response"]), 15)
        self.assertGreaterEqual(len(data["suggestedFollowUps"]), 1)
        self.assertIn("citations", data)

    def test_23_pdf_executive_commentary_single_page_budget(self):
        """Issue #12: 1-Page PDF budget strictly maintained with AI executive commentary included."""
        for hub_id in ["INDIANA.HUB", "MICHIGAN.HUB", "TEXAS.HUB"]:
            for persona in ["Power Trader", "State Regulator", "Municipal Co-op", "Public / Media"]:
                pdf_bytes = generate_market_briefing_pdf(hub_id=hub_id, audience_mode=persona)
                doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                self.assertEqual(
                    doc.page_count,
                    1,
                    f"PDF budget exceeded for {hub_id} ({persona}): got {doc.page_count} pages, expected exactly 1."
                )
                doc.close()

    # -----------------------------------------------------------------------
    # MISO Business Practice Manuals (BPM) Rulebooks Integration Tests
    # -----------------------------------------------------------------------
    def test_24_bpm_endpoint(self):
        """Verify GET /api/bpms and GET /api/bpms/{id}."""
        resp_all = self.client.get("/api/bpms")
        self.assertEqual(resp_all.status_code, 200)
        data_all = resp_all.json()
        self.assertGreaterEqual(data_all["count"], 20)
        self.assertIn("manuals", data_all)

        # Single BPM retrieval
        resp_single = self.client.get("/api/bpms/BPM 002")
        self.assertEqual(resp_single.status_code, 200)
        data_single = resp_single.json()
        self.assertEqual(data_single["bpmNumber"], "BPM 002")
        self.assertIn("Energy and Operating Reserve", data_single["title"])
        self.assertIn("questionsAnswered", data_single)
        self.assertGreater(len(data_single["questionsAnswered"]), 0)
        self.assertIn("downloadUrl", data_single)

        # 404 for unknown BPM
        resp_404 = self.client.get("/api/bpms/BPM 999")
        self.assertEqual(resp_404.status_code, 404)

    def test_25_bpm_search_routing(self):
        """Verify natural language search queries routing to bpm_card."""
        queries = ["BPM 002", "BPM 2", "BPM 020", "interconnection rules", "generator interconnection rules"]
        for q in queries:
            resp = self.client.get(f"/api/search?q={q}")
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertEqual(data["chartType"], "bpm_card", f"Query '{q}' failed to route to bpm_card")
            self.assertIn("data", data)
            self.assertIn("bpmNumber", data["data"])
            self.assertTrue(len(data["data"]["questionsAnswered"]) > 0)
            self.assertIn("downloadUrl", data["data"])

    def test_26_bpm_catalog_search(self):
        """Verify generic BPM/rulebook query returns full catalog directory."""
        resp = self.client.get("/api/search?q=MISO BPM Rulebooks")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["chartType"], "bpm_card")
        self.assertTrue(data["data"].get("isCatalog"))
        self.assertIn("manuals", data["data"])
        self.assertGreaterEqual(len(data["data"]["manuals"]), 10)

    def test_27_glossary_bpm_linkage(self):
        """Verify glossary terms are linked to governing BPMs."""
        resp = self.client.get("/api/glossary/LMP")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("governingBpm"), "BPM 002")

        resp_lrtp = self.client.get("/api/glossary/LRTP")
        self.assertEqual(resp_lrtp.status_code, 200)
        self.assertEqual(resp_lrtp.json().get("governingBpm"), "BPM 020")

        resp_all = self.client.get("/api/glossary")
        self.assertEqual(resp_all.status_code, 200)
        all_terms = resp_all.json()
        bpm_category_terms = [t for t in all_terms.values() if t.get("category") == "Rulebooks (BPMs)"]
        self.assertGreaterEqual(len(bpm_category_terms), 20)


if __name__ == "__main__":
    unittest.main(verbosity=2)


