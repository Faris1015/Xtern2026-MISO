# Issue #16: Dynamic Behavioral Persona Inference & Recommendation Banner

## 📌 Context & Overview
Previously, persona classification was 100% self-declared and static via a manual dropdown. If a user searched for complex trader arbitrage terms while registered as "Public / Media", they would receive high-level public summaries instead of the mathematical spread data they actually needed. This issue implements real-time behavioral query pattern inference to recommend the optimal persona.

## 🎯 Specific Tasks
1. **Query Pattern Classifier (`backend/search_engine.py`):**
   - Implement `_infer_likely_persona(query: str) -> Optional[str]` evaluating domain vocabulary:
     - **Power Trader:** "spread", "arbitrage", "congestion", "mec", "basis", "hedging", "da-rt", "day-ahead".
     - **Municipal Co-op:** "co-op", "wholesale", "peak", "reliability", "rto", "capacity", "cost", "tariff".
     - **State Regulator:** "compliance", "nerc", "ferc", "filing", "mtep", "lrtp", "clean energy", "cost allocation".
     - **Public / Media:** "what is", "how does", "eli5", "definition", "overview", "basics", "simple".
   - Expose `inferredPersona` field in `SearchResponse`.
2. **Interactive Recommendation Banner (`frontend/src/App.tsx`):**
   - If `result.inferredPersona` is detected and differs from `persona`, display a sleek banner.
   - Provide a 1-click button allowing users to switch immediately and re-execute the query with zero reload.

## 🧪 Acceptance Criteria
- [x] Trader queries (e.g. "Indiana Hub LMP spread") trigger `inferredPersona: "Power Trader"`.
- [x] Public definition queries (e.g. "What is CONE?") trigger `inferredPersona: "Public / Media"`.
- [x] Frontend presents interactive banner when inferred persona differs from selected persona.
- [x] Clicking the switch button re-runs search with the new persona seamlessly.
