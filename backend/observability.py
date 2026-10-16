"""
MISO OmniSearch - Cloud-Native Observability & Telemetry Metrics
Provides Prometheus-compatible metric exposition, health/readiness probes (Kubernetes),
request duration tracking, and distributed correlation ID tracing.
"""

from __future__ import annotations

import os
import time
import uuid
from typing import Any, Dict, List, Optional
from threading import Lock

class MetricsRegistry:
    """Thread-safe in-memory metrics registry formatted for Prometheus scraping."""

    def __init__(self) -> None:
        self._lock = Lock()
        self.start_time = time.time()
        
        # Counters: key -> count
        self._requests_total: Dict[str, int] = {}
        self._cache_hits = 0
        self._cache_misses = 0
        self._grounding_verifications: Dict[str, int] = {"pass": 0, "reject": 0}
        self._sse_active_connections = 0
        
        # Latency tracking: endpoint -> [durations in seconds]
        self._request_durations: Dict[str, List[float]] = {}
        self._miso_api_latency = 0.045  # baseline seconds

    def record_request(self, method: str, endpoint: str, status_code: int, duration_sec: float) -> None:
        # Normalize endpoint path to avoid cardinality explosion
        clean_endpoint = endpoint.split("?")[0]
        key = f'{method}:{clean_endpoint}:{status_code}'
        with self._lock:
            self._requests_total[key] = self._requests_total.get(key, 0) + 1
            if clean_endpoint not in self._request_durations:
                self._request_durations[clean_endpoint] = []
            dur_list = self._request_durations[clean_endpoint]
            dur_list.append(duration_sec)
            if len(dur_list) > 200:
                self._request_durations[clean_endpoint] = dur_list[-200:]

    def record_cache_hit(self) -> None:
        with self._lock:
            self._cache_hits += 1

    def record_cache_miss(self) -> None:
        with self._lock:
            self._cache_misses += 1

    def record_grounding_result(self, passed: bool) -> None:
        key = "pass" if passed else "reject"
        with self._lock:
            self._grounding_verifications[key] = self._grounding_verifications.get(key, 0) + 1

    def increment_sse_connections(self) -> None:
        with self._lock:
            self._sse_active_connections += 1

    def decrement_sse_connections(self) -> None:
        with self._lock:
            self._sse_active_connections = max(0, self._sse_active_connections - 1)

    def set_miso_api_latency(self, latency_sec: float) -> None:
        with self._lock:
            self._miso_api_latency = latency_sec

    def generate_prometheus_text(self) -> str:
        """Renders metrics in Prometheus text exposition format (version 0.0.4)."""
        lines: List[str] = [
            "# HELP omnisearch_uptime_seconds Total runtime uptime of the MISO OmniSearch backend gateway.",
            "# TYPE omnisearch_uptime_seconds gauge",
            f"omnisearch_uptime_seconds {time.time() - self.start_time:.2f}",
            "",
            "# HELP omnisearch_http_requests_total Total number of HTTP API requests handled by OmniSearch.",
            "# TYPE omnisearch_http_requests_total counter",
        ]

        with self._lock:
            for key, count in sorted(self._requests_total.items()):
                method, endpoint, status = key.split(":")
                lines.append(f'omnisearch_http_requests_total{{method="{method}",endpoint="{endpoint}",status="{status}"}} {count}')

            lines.extend([
                "",
                "# HELP omnisearch_cache_hits_total In-memory and distributed cache hits for MISO telemetry.",
                "# TYPE omnisearch_cache_hits_total counter",
                f"omnisearch_cache_hits_total {self._cache_hits}",
                "",
                "# HELP omnisearch_cache_misses_total In-memory cache misses resulting in external MISO network fetch.",
                "# TYPE omnisearch_cache_misses_total counter",
                f"omnisearch_cache_misses_total {self._cache_misses}",
                "",
                "# HELP omnisearch_active_sse_connections Number of active Server-Sent Events real-time telemetry subscribers.",
                "# TYPE omnisearch_active_sse_connections gauge",
                f"omnisearch_active_sse_connections {self._sse_active_connections}",
                "",
                "# HELP omnisearch_miso_api_latency_seconds Roundtrip latency to public-api.misoenergy.org in seconds.",
                "# TYPE omnisearch_miso_api_latency_seconds gauge",
                f"omnisearch_miso_api_latency_seconds {self._miso_api_latency:.4f}",
                "",
                "# HELP omnisearch_grounding_firewall_total Verification results from the Zero-Hallucination numerical firewall.",
                "# TYPE omnisearch_grounding_firewall_total counter",
                f'omnisearch_grounding_firewall_total{{status="pass"}} {self._grounding_verifications.get("pass", 0)}',
                f'omnisearch_grounding_firewall_total{{status="reject"}} {self._grounding_verifications.get("reject", 0)}',
                "",
            ])

            # Latency summary
            lines.append("# HELP omnisearch_http_request_duration_seconds Average latency for key endpoints.")
            lines.append("# TYPE omnisearch_http_request_duration_seconds gauge")
            for endpoint, durations in sorted(self._request_durations.items()):
                if durations:
                    avg_dur = sum(durations) / len(durations)
                    lines.append(f'omnisearch_http_request_duration_seconds{{endpoint="{endpoint}"}} {avg_dur:.4f}')

        return "\n".join(lines) + "\n"

    def get_liveness(self) -> Dict[str, Any]:
        """Kubernetes Liveness Probe payload."""
        return {
            "status": "healthy",
            "service": "miso-omnisearch-backend",
            "version": "1.1.0",
            "uptimeSeconds": round(time.time() - self.start_time, 2),
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

    def get_readiness(self, miso_status: Dict[str, Any], data_ready: bool, llm_ready: bool) -> Dict[str, Any]:
        """Kubernetes Readiness Probe payload checking internal and external dependencies."""
        checks = {
            "dataLayer": "ready" if data_ready else "degraded",
            "misoOperationsFeed": "connected" if miso_status.get("operationsApi", {}).get("status") == "connected" else "offline",
            "aiDualEngine": "active" if llm_ready else "deterministic_fallback",
        }
        is_ready = data_ready  # Core engine is ready even if AI falls back to deterministic
        return {
            "status": "ready" if is_ready else "not_ready",
            "statusCode": 200 if is_ready else 503,
            "checks": checks,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

# Global singleton
metrics_registry = MetricsRegistry()

