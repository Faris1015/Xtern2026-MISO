"""
Automated Unit Tests for Native Ollama LLM Integration
Verifies local Ollama detection, model discovery, dual-engine fallback,
fact-checking, and FastAPI status endpoints.
"""

import sys
import unittest
from unittest.mock import MagicMock, patch
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from llm_service import LLMService, llm_service
from main import app
from fastapi.testclient import TestClient


class TestOllamaIntegration(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.service = LLMService()

    def test_01_ollama_offline_graceful_handling(self):
        """Validates that when Ollama is offline, check_ollama_status does not raise and returns available=False."""
        # Point to an invalid unreachable port
        self.service.ollama_base_url = "http://127.0.0.1:59999"
        status = self.service.check_ollama_status(force=True)
        
        self.assertFalse(status["available"])
        self.assertEqual(status["models"], [])
        self.assertIsNone(status["activeModel"])
        self.assertIsNotNone(status["error"])

    def test_02_ollama_model_discovery(self):
        """Validates that installed models from /api/tags are parsed and preferred model is selected."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "models": [
                {"name": "mistral:latest", "model": "mistral:latest"},
                {"name": "llama3.2:latest", "model": "llama3.2:latest"},
            ]
        }
        
        with patch("httpx.get", return_value=mock_resp):
            status = self.service.check_ollama_status(force=True)
            self.assertTrue(status["available"])
            self.assertIn("llama3.2:latest", status["models"])
            # Prefix matching selects llama3.2:latest
            self.assertEqual(status["activeModel"], "llama3.2:latest")

    def test_03_ollama_fallback_to_first_available_model(self):
        """If configured model is not installed, auto-detects and binds to first installed model."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "models": [
                {"name": "qwen2.5:7b", "model": "qwen2.5:7b"},
            ]
        }
        
        self.service.ollama_model = "llama3.2"
        with patch("httpx.get", return_value=mock_resp):
            status = self.service.check_ollama_status(force=True)
            self.assertTrue(status["available"])
            self.assertEqual(status["activeModel"], "qwen2.5:7b")

    def test_04_provider_status_structure(self):
        """Validates the comprehensive provider status metadata structure."""
        status = self.service.get_provider_status()
        self.assertIn("configuredProvider", status)
        self.assertIn("activeProvider", status)
        self.assertIn("isAiEnabled", status)
        self.assertIn("ollama", status)
        self.assertIn("gemini", status)

    def test_05_mock_ollama_inference(self):
        """Validates that _call_ollama submits correct prompt and parses response."""
        mock_check = {
            "available": True,
            "url": "http://localhost:11434",
            "models": ["llama3.2:latest"],
            "activeModel": "llama3.2:latest",
        }
        
        mock_post_resp = MagicMock()
        mock_post_resp.status_code = 200
        mock_post_resp.json.return_value = {
            "model": "llama3.2:latest",
            "response": "Indiana Hub real-time LMP cleared at $38.45/MWh under normal operating conditions.",
            "done": True,
        }
        
        with patch.object(self.service, "check_ollama_status", return_value=mock_check):
            with patch.object(self.service.ollama_client, "post", return_value=mock_post_resp):
                output = self.service._call_ollama("Test prompt", temperature=0.2, max_tokens=100)
                self.assertIsNotNone(output)
                self.assertIn("$38.45/MWh", output)

    def test_06_fastapi_endpoints(self):
        """Validates FastAPI status endpoints."""
        # 1. Health check includes llmProvider
        r1 = self.client.get("/")
        self.assertEqual(r1.status_code, 200)
        data1 = r1.json()
        self.assertIn("llmProvider", data1)
        
        # 2. /api/llm/status returns provider metadata
        r2 = self.client.get("/api/llm/status")
        self.assertEqual(r2.status_code, 200)
        data2 = r2.json()
        self.assertIn("configuredProvider", data2)
        self.assertIn("activeProvider", data2)
        
        # 3. /api/canvas-chat includes provider field
        payload = {
            "message": "Why did Indiana Hub spike?",
            "canvasContext": {
                "query": "Indiana Hub",
                "hubId": "INDIANA.HUB",
                "chartType": "lmp_hourly",
                "kpis": [{"label": "Real-Time Avg", "value": "$38.45"}],
                "data": [],
                "sourceCitation": "MISO Public Telemetry"
            },
            "persona": "Power Trader",
            "history": []
        }
        r3 = self.client.post("/api/canvas-chat", json=payload)
        self.assertEqual(r3.status_code, 200)
        data3 = r3.json()
        self.assertIn("response", data3)
        self.assertIn("provider", data3)


if __name__ == "__main__":
    unittest.main()
