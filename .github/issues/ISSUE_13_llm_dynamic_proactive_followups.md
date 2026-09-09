# [Issue #13] [Member 3: Data & Member 1: Backend] Context-Aware Dynamic Research Follow-Up Generator

## 📌 Context & Objective
In Issue #6, we created a static proactive intent graph in `backend/data/related_queries.json` to populate the follow-up suggestion chips at the bottom of the 360° Knowledge Canvas (e.g. *"Compare Indiana vs. Michigan Hub"*, *"Show Day-Ahead Price Spread"*). 

While static chips cover standard pathways, real market research is multi-step and unpredictable. This issue builds a **Context-Aware Dynamic Follow-Up Generator** powered by an LLM. Given the user's original query and the data returned, the model suggests the top 3 most insightful follow-up research questions or analytical comparisons, complete with executable action parameters for the frontend.

---

## 🛠️ Files to Create / Modify
* `backend/llm_service.py` *(Add `generate_proactive_followups()`)*
* `backend/search_engine.py` *(Blend dynamic chips with static `related_queries.json`)*
* `backend/data/related_queries.json` *(Serve as deterministic baseline fallback)*

---

## 📋 Specific Tasks

1. **Implement `generate_proactive_followups()` in `backend/llm_service.py`:**
   * Accepts `query: str`, `chart_type: str`, `summary_data: Dict[str, Any]`, and `persona: str`.
   * Prompts the LLM to return a structured JSON array of exactly 3 `FollowUpAction` objects:
     ```json
     [
       {
         "label": "Compare Indiana with PJM Pnode Seam",
         "action": "compare_hubs",
         "params": {"hubs": ["INDIANA.HUB", "MICHIGAN.HUB"]}
       },
       {
         "label": "Analyze Congestion Breakdown at HE 18",
         "action": "show_spread",
         "params": {"hub": "INDIANA.HUB"}
       },
       {
         "label": "Export Hourly Dispatch CSV",
         "action": "download_csv",
         "params": {"hub": "INDIANA.HUB"}
       }
     ]
     ```
   * Enforces valid frontend `action` types (`compare_hubs`, `compare_fuels`, `show_spread`, `search_query`, `download_csv`, `explain_acronym`).

2. **Blend and Fallback in `backend/search_engine.py`:**
   * If `llm_service.enabled` is `True`, invoke `generate_proactive_followups()` with a strict 400ms timeout.
   * If LLM is disabled, times out, or returns invalid actions, immediately fall back to the pre-curated chips from `data_manager.get_related_queries()`.
   * Ensure returned chips always validate against the Pydantic `FollowUpAction` schema.

---

## ✅ Acceptance Criteria
* [ ] Follow-up chips dynamically adapt to specific queries (e.g. querying wind generation suggests comparing against solar records and reserve margins).
* [ ] Generated action chips are 100% clickable on the frontend, triggering real comparisons or search executions.
* [ ] Seamless fallback to static `related_queries.json` when LLM is offline.
* [ ] Zero frontend regression: Returned JSON matches existing `SearchResponse.proactiveFollowUps` type definition.

---

## 🤖 Copy-Paste LLM Prompt (For Member 3 & Member 1)
> *"Act as an Energy Data Scientist and FastAPI Backend Engineer. Implement `generate_proactive_followups()` in `backend/llm_service.py` that generates 3 executable, high-value research follow-up actions (`compare_hubs`, `show_spread`, `search_query`, `download_csv`) based on the query and current market data. Update `backend/search_engine.py` to seamlessly blend these dynamic follow-ups with our fallback `backend/data/related_queries.json` graph."*

