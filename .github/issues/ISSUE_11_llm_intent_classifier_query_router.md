# [Issue #11] [Member 1: Backend & Member 3: Data] Semantic Intent Classifier & Entity Extraction Query Router

## 📌 Context & Objective
Currently, `backend/search_engine.py` routes queries through simple regular expressions and keyword checks (e.g. searching for substrings like `"indiana"`, `"lmp"`, `"what is"`). While this is sub-millisecond fast, it can stumble on ambiguous, multi-sentence, or conversational natural language queries like:
* *"Why did power prices spike in Detroit yesterday evening during the heatwave?"*
* *"Show me how much wind and solar contributed during the last net peak demand."*
* *"Is MISO planning any high-voltage lines between Indiana and Illinois to reduce congestion?"*

This issue builds an **LLM Semantic Intent Classifier & Entity Extractor** in `backend/llm_service.py`. When a query does not cleanly match a simple static pattern, the engine invokes a fast, structured classification prompt to extract entities (hub ID, comparison targets, metrics, time horizon) and map directly to the corresponding `data_manager.py` query.

---

## 🛠️ Files to Create / Modify
* `backend/llm_service.py` *(Add `classify_intent_and_entities()`)*
* `backend/search_engine.py` *(Update `search()` to use classifier when regex is ambiguous)*
* `backend/data_manager.py` *(Ensure query methods accept extracted entities)*

---

## 📋 Specific Tasks

1. **Implement `classify_intent_and_entities(query: str) -> Optional[Dict[str, Any]]` in `backend/llm_service.py`:**
   * Utilizes structured JSON output mode (or schema-constrained decoding) to classify the user's intent into one of five categories:
     * `hub_pricing` (with extracted `hub_id`: `INDIANA.HUB`, `MICHIGAN.HUB`, `ILLINOIS.HUB`, `MINN.HUB`, `LOUISIANA.HUB`, `TEXAS.HUB`)
     * `hub_comparison` (with extracted `hub_ids`: list of 2–3 hubs)
     * `fuel_mix_peak` (with extracted focus: `solar`, `wind`, `all`, `peak_demand`)
     * `transmission_planning` (with extracted portfolio: `lrtp_tranche_1`, `lrtp_tranche_2`, `jtiq`, `general`)
     * `glossary_acronym` (with extracted `acronym` or `term`)
   * Extracts implied `persona` if the query implies a specific role (e.g. *"arbitrage"* $\to$ *Power Trader*; *"residential bill impact"* $\to$ *Public*).
   * Sets low max tokens (e.g. 150 tokens) and temperature 0.0 for near-instant execution (< 300ms).

2. **Integrate into `search_engine.py`:**
   * Keep the ultra-fast regex check for direct, exact queries (e.g. `"LMP"`, `"Indiana Hub"`, `"What is CONE"`).
   * For complex, unclassified queries that would otherwise fall back to the default Indiana Hub, call `llm_service.classify_intent_and_entities()`.
   * Route execution directly to `_build_hub_response`, `_build_fuel_response`, or `_build_transmission_response` based on the structured classification.

3. **Out-of-Scope Error Checking & Query Guidance (Non-MISO Queries):**
   * Classify queries unrelated to MISO, power grids, or wholesale energy (e.g. *"recipe for pasta"*, *"who won the Super Bowl"*, *"Apple stock price"*) as `intent: "out_of_scope"`.
   * When `intent == "out_of_scope"`, do **not** silently dump baseline Indiana Hub pricing. Instead, return a helpful, structured error guidance response:
     * **Direct Answer:** *"It looks like your question isn't related to MISO's bulk power system, wholesale electricity markets, or regional grid planning. MISO OmniSearch is dedicated to MISO public energy data."*
     * **Reformulation Advice:** Explains how to phrase queries effectively for MISO data (e.g., searching for commercial hubs like Indiana or Michigan, peak generation records, transmission portfolios like LRTP, or acronyms like CONE).
     * **Proactive Recovery Chips:** Suggests 3 valid starter queries (*"Show Indiana Hub Real-Time LMP"*, *"Explore Fuel Generation Mix"*, *"Look up MISO Acronyms in Jargon HUD"*).
   * **Deterministic Offline Fallback:** Even when the LLM is offline, if a query contains zero energy/grid keywords (e.g. `lmp`, `price`, `hub`, `fuel`, `wind`, `solar`, `peak`, `grid`, `mtep`, `cone`, `miso`), trigger this guidance card instead of misleading market data.

---

## ✅ Acceptance Criteria
* [ ] Queries with typos or colloquial regional terms (e.g. *"Detroit energy costs"* $\to$ `MICHIGAN.HUB`, *"Twin Cities power rates"* $\to$ `MINN.HUB`) correctly resolve to the right hub.
* [ ] Multi-intent queries (e.g. *"Compare wind generation vs solar"* or *"Indiana vs Michigan"*) route directly to the comparison engine.
* [ ] **Error Checking & Domain Guardrail:** Asking queries unrelated to MISO returns a polite, constructive error message telling the user what was wrong and offering 3 clickable suggestions to redirect their search, instead of showing confusing electricity prices.
* [ ] Sub-500ms execution latency for classified queries.
* [ ] When the LLM service is offline or unkeyed, fallback regex continues to handle all standard searches seamlessly.

---

## 🤖 Copy-Paste LLM Prompt (For Member 1 & Member 3)
> *"Act as a Natural Language Processing & Backend Engineer. We want to add a fast Semantic Intent Classifier with Domain Error Checking to MISO OmniSearch. Implement `classify_intent_and_entities()` in `backend/llm_service.py` that parses unstructured queries into structured JSON entities (`intent`, `hub_id`, `compare_items`, `metric`, `suggested_persona`). If a user asks something unrelated to MISO or energy (intent == 'out_of_scope'), return an informative guidance response explaining that OmniSearch is dedicated to MISO grid data, with actionable tips and starter chips on how to change what they typed. Wire this into `backend/search_engine.py`."*

