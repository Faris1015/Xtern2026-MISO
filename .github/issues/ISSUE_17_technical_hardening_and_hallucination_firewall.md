# Issue #17: Technical Hardening, Hallucination Firewall & Footprint Reconciliation

## 📌 Context & Overview
Production-readiness requires strict guardrails preventing LLM numerical hallucinations, clean dead-code removal, rigorous error logging, secure CORS whitelisting, and resolving multi-jurisdictional footprint definitions.

## 🎯 Specific Tasks
1. **Automated Numerical Grounding Firewall (`backend/llm_service.py`):**
   - Implement `_verify_numerical_grounding(text: str, context: Dict[str, Any]) -> bool`.
   - Scan LLM-generated dollar values against ground-truth context bounds. Reject and fall back if hallucinated extreme figures (e.g. $1,850/MWh when base is <$60) appear.
2. **Dead-Code Elimination & Exception Logging:**
   - Ensure formatting cleanup and grounding checks execute before LLM return statements.
   - Replace bare `except: pass` blocks with structured `logger.warning(...)` statements.
3. **Footprint Schema Reconciliation (`fuel_peaks.json`):**
   - Add Manitoba Hydro Canadian province coverage: `provinces_served: 1`, `canadian_provinces: ["Manitoba"]`.
   - Document distinction between MISO Reliability Coordination footprint (15 states + Manitoba, 45M population) and internal Market Dispatch territory (LRZ 1–10).
4. **LRTP Tranche Reconciliation (`mtep_projects.json`):**
   - Clearly delineate LRTP Tranche 1 ($10.3B approved July 2022) from LRTP Tranche 2 ($21.8B approved December 2024), yielding total $32.1B investment.
5. **CORS Hardening:**
   - Restrict FastAPI CORS origins to explicit local development and staging hosts.

## 🧪 Acceptance Criteria
- [x] Hallucinated prices failing numerical bounds are automatically rejected.
- [x] Zero dead code or unreachable returns in `llm_service.py`.
- [x] Manitoba province schema gap resolved in `fuel_peaks.json`.
- [x] Comprehensive test suite in `backend/test_live_miso_and_hardening.py` passes 100%.
