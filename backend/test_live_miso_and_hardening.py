"""
Automated Unit Tests for MISO Live Ingestion & Hardening Fixes
"""

import sys
import unittest
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from miso_client import miso_client
from data_manager import data_manager
from llm_service import llm_service
from search_engine import search_engine


class TestLiveMISOAndHardening(unittest.TestCase):

    def test_01_live_fuel_mix_ingestion(self):
        """Validates that MISOClient successfully ingests live public operations telemetry."""
        live = miso_client.fetch_live_fuel_mix()
        self.assertIsNotNone(live, "Live MISO FuelMix ingestion returned None")
        self.assertTrue(live["isLive"])
        self.assertEqual(live["dataSource"], "live_miso_public_api")
        self.assertGreater(live["totalMw"], 0)
        self.assertGreater(len(live["generationMix"]), 0)
        
        # Verify fuels have percentage, formatted MW, and colors
        top_fuel = live["generationMix"][0]
        self.assertIn("fuel", top_fuel)
        self.assertIn("percentage", top_fuel)
        self.assertIn("color", top_fuel)
        self.assertIn("formattedMw", top_fuel)

    def test_02_caching_layer_rate_limiting(self):
        """Validates that second consecutive call hits in-memory cache without outbound network call."""
        res1 = miso_client.fetch_live_fuel_mix()
        cached_entry = miso_client._cache.get("live_fuel_mix")
        self.assertIsNotNone(cached_entry)
        cached_time = cached_entry["cached_at"]

        res2 = miso_client.fetch_live_fuel_mix()
        second_cached_time = miso_client._cache["live_fuel_mix"]["cached_at"]
        self.assertEqual(cached_time, second_cached_time, "Expected cache hit on consecutive call")

    def test_03_data_manager_live_integration(self):
        """Validates data_manager exposes live data with fallback integrity."""
        fuel_peaks = data_manager.get_fuel_peaks()
        self.assertTrue(fuel_peaks.get("isLive"), "Expected isLive=True in fuel_peaks")
        self.assertEqual(fuel_peaks.get("dataSource"), "live_miso_public_api")
        
        telemetry = data_manager.get_grid_telemetry()
        self.assertEqual(telemetry.get("dataSource"), "live_miso_public_api")
        self.assertGreater(telemetry.get("currentDemandMw", 0), 0)

    def test_04_ai_fact_check_verifier(self):
        """Validates automated numeric grounding fact-check in LLM service."""
        ground_truth = {"realTimeAvg": 38.45, "dayAheadAvg": 37.20, "peakPrice": 49.80}
        
        # Grounded text should pass
        valid_text = "Real-time LMP cleared at $38.45/MWh with Day-Ahead averaging $37.20/MWh."
        self.assertTrue(llm_service._verify_numerical_grounding(valid_text, ground_truth))
        
        # Wildly hallucinated text should fail
        hallucinated_text = "Real-time prices surged uncontrollably to $1,850.00/MWh due to catastrophic failure."
        self.assertFalse(llm_service._verify_numerical_grounding(hallucinated_text, ground_truth))

    def test_05_search_response_live_telemetry_citation(self):
        """Validates search engine dynamically cites live MISO public feed."""
        resp = search_engine.search("current fuel mix", persona="Power Trader")
        self.assertEqual(resp.chartType, "fuel_mix")
        self.assertIn("MISO Live Public Operations Feed", resp.sourceCitation)
        self.assertIn("Interval", resp.sourceCitation)


if __name__ == "__main__":
    unittest.main()
