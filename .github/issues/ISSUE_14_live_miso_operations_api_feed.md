# Issue #14: Live MISO Public Operations Feed & Azure APIM Integration

## 📌 Context & Overview
External energy market participants and public stakeholders require real-time visibility into MISO grid conditions. Previously, telemetry was anchored to static fact sheets or baseline generator functions. This issue connects MISO OmniSearch directly to MISO's live public operations API, streaming 5-minute generation and fuel mix data with high-resilience in-memory rate-limiting and Azure APIM support.

## 🎯 Specific Tasks
1. **Real-Time Client (`backend/miso_client.py`):**
   - Poll MISO's free public operations endpoint: `https://public-api.misoenergy.org/api/FuelMix`.
   - Implement an in-memory 60-second TTL cache to strictly respect MISO's $\le 1$ request/minute rate limit.
   - Provide seamless zero-downtime fallback to verified corporate fact-sheet baselines if network outages or API downtime occurs.
2. **MISO Data Exchange APIM Integration:**
   - Configure Azure API Management (APIM) header `Ocp-Apim-Subscription-Key` via `MISO_API_KEY` in `backend/.env` for authenticated Day-Ahead and Real-Time LMP queries.
3. **Telemetry & Search Engine Wiring:**
   - Wire `backend/data_manager.py`'s `get_fuel_peaks()` and `get_grid_telemetry()` to serve live MW and timestamped 5-minute intervals.
   - Update `backend/search_engine.py` to cite live MISO telemetry when answering generation queries.

## 🧪 Acceptance Criteria
- [x] `backend/miso_client.py` polls `public-api.misoenergy.org` without requiring an API key.
- [x] 60-second TTL cache prevents rate limit violations.
- [x] `GET /api/grid-telemetry` returns `"dataSource": "live_miso_public_api"`.
- [x] Network timeout or connection refusal gracefully falls back to static verified figures with zero 500 errors.
