# [Issue #9] [Member 1: Backend & AI] Grounded LLM Persona Synthesizer with Zero-Hallucination Guardrails

## 📌 Context & Objective
Currently, `backend/search_engine.py` generates the `directAnswer` narrative using static `if/else` template strings for each audience persona (*Power Trader*, *Municipal Co-op*, *State Regulator*, *Public / Media*). 

This issue upgrades the direct answer generation to use an **LLM Persona Synthesizer (e.g. Gemini 2.5 Flash / GPT-4o-mini)**. To preserve our core value proposition—**100% verified provenance and zero hallucinations**—the LLM will operate in a strict **Grounded Retrieval-Augmented Generation (RAG)** mode: the deterministic engine first retrieves the exact market numbers (LMPs, peak hours, fuel percentages, congestion values), and the LLM is constrained to synthesize an executive narrative using *only* that verified data.

Additionally, the engine must feature a **zero-downtime graceful fallback**: if no API key is configured or the LLM call times out, it immediately returns the deterministic template narrative without interrupting the user experience.

---

## 🛠️ Files to Create / Modify
* `backend/llm_service.py` *(New)*
* `backend/search_engine.py` *(Modify to call `llm_service.synthesize_narrative`)*
* `backend/requirements.txt` *(Add `google-genai>=0.1.1` or equivalent SDK)*
* `.env.example` *(Add `GEMINI_API_KEY=` or `OPENAI_API_KEY=`)*

---

## 📋 Specific Tasks

1. **Create `backend/llm_service.py` with Singleton Service Pattern:**
   * Read API key (`GEMINI_API_KEY` or `OPENAI_API_KEY`) from environment variables.
   * If the key is absent or empty, set `self.enabled = False`.
   * Implement `synthesize_narrative(query: str, data_summary: Dict[str, Any], persona: str, fallback_text: str) -> str`:
     * Returns `fallback_text` immediately if `self.enabled` is `False`.
     * Formats a grounded prompt providing `data_summary` (JSON) as immutable ground truth.
     * Instructs the LLM to write a 2–3 sentence executive response tailored to `persona`:
       * **Power Trader:** Focus on Day-Ahead vs. Real-Time arbitrage spread, peak hour volatility, and transmission congestion.
       * **Municipal Co-op:** Focus on wholesale power procurement costs, off-peak hedging, and retail rate stability.
       * **State Regulator:** Focus on reliable price formation, non-discriminatory clearing, reserve margins, and FERC compliance.
       * **Public / Media:** Plain English explanation of wholesale electricity costs and clean energy contribution.
     * Sets temperature low (e.g. `0.2`) to minimize stylistic drift.
     * Wraps execution in a `try/except` block with a 1.5-second timeout, falling back seamlessly to `fallback_text` on any failure.

2. **Wire into `backend/search_engine.py`:**
   * In `_build_hub_response`, `_build_fuel_response`, and `_build_transmission_response`, replace the hardcoded `narrative` assignment with:
     ```python
     direct_answer = llm_service.synthesize_narrative(
         query=raw_query,
         data_summary=summary,
         persona=persona,
         fallback_text=fallback_narrative,
     )
     ```

3. **Response Model Tagging (Optional UI Badge):**
   * Add an optional metadata boolean or header indicating whether the response was `is_ai_synthesized: bool` so the frontend can display an optional subtle "✨ Grounded AI Synthesis" badge.

---

## ✅ Acceptance Criteria
* [ ] When `GEMINI_API_KEY` is provided, `/api/search` returns an eloquent, persona-tailored narrative accurately quoting the retrieved metrics.
* [ ] When no API key is provided, the API runs normally and outputs the deterministic template narrative without errors.
* [ ] Response latency remains under 800ms with LLM enabled, and < 50ms in fallback mode.
* [ ] Zero hallucination: The LLM does not invent any numbers, hub names, or hours not present in the data summary.

---

## 🤖 Copy-Paste LLM Prompt (For Member 1)
> *"Act as a Senior Python AI Engineer. We are building the LLM Persona Synthesizer for MISO OmniSearch. Create a modular, resilient `backend/llm_service.py` using `google-genai` (or `openai`) that implements `synthesize_narrative()`. The service must be strictly grounded on retrieved JSON telemetry data, adapt its tone to the active persona (Power Trader, Municipal Co-op, State Regulator, Public), and gracefully fall back to a provided deterministic template string if the API key is unset or any network error occurs. Update `backend/search_engine.py` to wire this service into the search response builder."*

