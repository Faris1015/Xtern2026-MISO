"""
MISO OmniSearch - LLM Service
Grounded RAG and Multi-Persona Intelligence Layer powering:
- Issue #9: Persona Narrative Synthesis (Trader, Co-op, Regulator, Public)
- Issue #10: Contextual "Chat with this Canvas" Copilot
- Issue #11: Semantic Intent Classifier & Out-of-Scope Domain Error Checking
- Issue #12: AI-Generated Executive Commentary for 1-Page PDF Fact Sheets
- Issue #13: Context-Aware Dynamic Research Follow-Up Action Chips

Features automatic zero-downtime fallback: if no GEMINI_API_KEY is configured,
or if any network timeout occurs, every method falls back immediately to
deterministic MISO data and templates without interrupting the user.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
import httpx

# Load .env manually if present in backend or root
def _load_env_file():
    candidates = [
        Path(__file__).resolve().parent / ".env",
        Path(__file__).resolve().parent.parent / ".env",
    ]
    for env_path in candidates:
        if env_path.exists():
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("\"'")
                            if k and k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass

_load_env_file()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest").strip()

# Common energy / grid / MISO terminology for fast offline domain validation
MISO_DOMAIN_TERMS = {
    "miso", "lmp", "hub", "indiana", "michigan", "illinois", "texas", "louisiana", "minn", "minnesota",
    "fuel", "solar", "wind", "coal", "gas", "nuclear", "peak", "demand", "mix", "generation",
    "mtep", "lrtp", "jtiq", "transmission", "lines", "grid", "congestion", "loss", "energy",
    "mwh", "gw", "mw", "megawatt", "gigawatt", "cone", "pra", "iccp", "tariff", "ferc", "dayahead",
    "realtime", "spread", "arbitrage", "clearing", "reserve", "voltage", "substation", "interconnection",
    "coop", "co-op", "utility", "generator", "dispatch", "outage", "market", "pricing", "rate"
}

class LLMService:
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.model = GEMINI_MODEL
        self.enabled = bool(self.api_key)
        self.client = httpx.Client(timeout=8.0)

    def reload_config(self):
        """Reloads API key and model if updated at runtime in .env."""
        _load_env_file()
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest").strip()
        self.enabled = bool(self.api_key)

    def _call_gemini(self, prompt: str, temperature: float = 0.2, max_tokens: int = 400) -> Optional[str]:
        """Calls Google Gemini REST API using httpx with automatic fallback."""
        if not self.enabled:
            return None

        candidate_models = [self.model]
        for fallback in ["gemini-flash-lite-latest", "gemini-3.5-flash-lite", "gemini-3.8-flash"]:
            if fallback not in candidate_models:
                candidate_models.append(fallback)

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }

        for model_name in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
            try:
                resp = self.client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "").strip()
            except Exception:
                continue

        return None

    # -----------------------------------------------------------------------
    # Issue #9: Grounded Persona Synthesizer
    # -----------------------------------------------------------------------
    def synthesize_narrative(
        self,
        query: str,
        data_summary: Dict[str, Any],
        persona: str,
        fallback_text: str,
    ) -> str:
        """Synthesizes an executive narrative strictly grounded in verified MISO numbers."""
        if not self.enabled:
            return fallback_text

        prompt = f"""You are the MISO OmniSearch Energy Intelligence Engine.
User query: "{query}"
Target Audience Persona: {persona}

VERIFIED MISO TELEMETRY & DATA (IMMUTABLE GROUND TRUTH):
{json.dumps(data_summary, indent=2)}

INSTRUCTIONS:
1. Provide a concise, professional 2-3 sentence executive answer explaining the key metrics.
2. Adapt your tone and vocabulary to the active persona:
   - Power Trader: Emphasize Day-Ahead vs. Real-Time arbitrage spread ($/MWh), peak hour net ramp, and congestion.
   - Municipal Co-op: Focus on wholesale power procurement cost stability, off-peak hedging, and customer rate impact.
   - State Regulator: Highlight non-discriminatory clearing, reserve margins, price formation, and FERC tariff compliance.
   - Public / Media: Provide a clear, plain-English overview of wholesale electricity costs and regional grid reliability.
3. CRITICAL RULE: Rely ONLY on the verified numbers provided above. Do NOT invent any prices, hours, or volumes.
Do not include markdown headers or bullet points; write standard flowing prose.
"""
        result = self._call_gemini(prompt, temperature=0.2, max_tokens=250)
        return result if result else fallback_text

    # -----------------------------------------------------------------------
    # Issue #10: Contextual "Chat with this Canvas" Copilot
    # -----------------------------------------------------------------------
    def chat_with_canvas(
        self,
        message: str,
        canvas_context: Dict[str, Any],
        persona: str = "Power Trader",
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """Provides an interactive analytical chat response grounded in the active canvas chart."""
        if not self.enabled:
            # Smart deterministic fallback
            return self._fallback_canvas_chat(message, canvas_context)

        # Build recent conversation history snippet
        conv_history = ""
        if history:
            for turn in history[-4:]:
                role = "User" if turn.get("role") == "user" else "Assistant"
                conv_history += f"{role}: {turn.get('content', '')}\n"

        prompt = f"""You are the MISO OmniSearch Canvas Copilot, a grid intelligence assistant embedded inside the 360° Knowledge Canvas.
The user is viewing a live data canvas and has a question.

ACTIVE CANVAS CONTEXT:
Dataset Query: {canvas_context.get('query', '')}
Hub ID: {canvas_context.get('hubId', 'N/A')}
Chart Type: {canvas_context.get('chartType', '')}
Executive KPIs: {json.dumps(canvas_context.get('kpis', []))}
Sample Series Data: {json.dumps(canvas_context.get('data', [])[:8] if isinstance(canvas_context.get('data'), list) else canvas_context.get('data'))}
User Persona: {persona}

PREVIOUS CONVERSATION:
{conv_history}

USER QUESTION:
"{message}"

INSTRUCTIONS:
1. Answer the question directly in 2-4 sentences using the active canvas numbers.
2. If asked about prices, spreads, hours, or fuel percentages, quote the exact values from the context.
3. Keep the tone helpful, sharp, and tailored to {persona}.
4. Provide 2 short, clickable follow-up exploration questions for the user. Format the last line as:
FOLLOW_UPS: ["Question 1", "Question 2"]
"""
        response = self._call_gemini(prompt, temperature=0.3, max_tokens=350)
        if not response:
            return self._fallback_canvas_chat(message, canvas_context)

        # Parse follow-ups if returned
        answer_text = response
        follow_ups = ["Show Day-Ahead Price Spread", "Compare with Michigan Hub"]
        if "FOLLOW_UPS:" in response:
            parts = response.split("FOLLOW_UPS:", 1)
            answer_text = parts[0].strip()
            try:
                parsed_fus = json.loads(parts[1].strip())
                if isinstance(parsed_fus, list) and len(parsed_fus) >= 1:
                    follow_ups = [str(f) for f in parsed_fus[:3]]
            except Exception:
                pass

        return {
            "response": answer_text,
            "citations": [canvas_context.get("sourceCitation", "MISO Data Exchange API")],
            "suggestedFollowUps": follow_ups,
            "isAiGenerated": True,
        }

    def _fallback_canvas_chat(self, message: str, canvas_context: Dict[str, Any]) -> Dict[str, Any]:
        """Deterministic fallback when LLM API key is absent or offline."""
        kpis = canvas_context.get("kpis", [])
        hub_id = canvas_context.get("hubId", "INDIANA.HUB")
        kpi_summary = ", ".join(f"{k.get('label')}: {k.get('value')}" for k in kpis if isinstance(k, dict))
        
        q_lower = message.lower()
        if "peak" in q_lower or "high" in q_lower or "spike" in q_lower:
            ans = f"Based on current {hub_id} telemetry, peak price cleared at evening net-load ramp ({kpi_summary}). Generation dispatch margins tightened as solar generation subsided."
        elif "spread" in q_lower or "day-ahead" in q_lower or "real-time" in q_lower:
            ans = f"Wholesale price spreads at {hub_id} reflect real-time balancing against scheduled Day-Ahead positions ({kpi_summary}). Non-zero spreads indicate localized ramp and congestion adjustments."
        else:
            ans = f"Analyzing active telemetry for {hub_id}. Current verified metrics indicate {kpi_summary}. Dispatch conditions remain in normal operating parameters across the MISO region."

        return {
            "response": ans,
            "citations": [canvas_context.get("sourceCitation", "MISO Data Exchange API")],
            "suggestedFollowUps": ["Show Day-Ahead Price Spread", "Compare with Michigan Hub"],
            "isAiGenerated": False,
        }

    # -----------------------------------------------------------------------
    # Issue #11: Semantic Intent Classifier & Out-of-Scope Error Checking
    # -----------------------------------------------------------------------
    def classify_intent_and_entities(self, query: str) -> Dict[str, Any]:
        """Classifies intent, extracts entities, and identifies out-of-scope non-MISO queries."""
        q_clean = query.strip()
        q_tokens = set(re.findall(r"\w+", q_clean.lower()))

        # Fast offline domain check: If query has 0 MISO/energy terms and is multi-word
        if len(q_tokens) >= 3 and not (q_tokens & MISO_DOMAIN_TERMS):
            # Clearly non-energy/non-MISO (e.g. "how to bake cookies", "who won the super bowl")
            return {
                "intent": "out_of_scope",
                "reason": "Query contains no MISO, power grid, or wholesale market terminology.",
            }

        if not self.enabled:
            return {"intent": "standard"}

        prompt = f"""Classify this search query for the MISO Energy OmniSearch system:
Query: "{q_clean}"

Categories:
- "hub_pricing": User is asking about market pricing, LMP, or hubs (e.g. Indiana, Michigan, Illinois, Texas, Louisiana, Minnesota).
- "hub_comparison": User wants to compare two or more hubs.
- "fuel_mix_peak": User asks about generation fuel types (solar, wind, coal, gas, nuclear) or peak demand records.
- "transmission_planning": User asks about MTEP, LRTP, JTIQ, or transmission projects.
- "glossary_acronym": User asks for a definition of an energy acronym (LMP, CONE, PRA, etc.).
- "out_of_scope": The query is completely unrelated to MISO, power grids, or wholesale electricity (e.g. cooking, sports, celebrity trivia, tech programming, generic stock quotes).

Return ONLY raw JSON with these keys:
{{"intent": "hub_pricing"|"hub_comparison"|"fuel_mix_peak"|"transmission_planning"|"glossary_acronym"|"out_of_scope", "hub_id": "INDIANA.HUB"|null, "compare_items": ["HUB1", "HUB2"]|null, "persona": "Power Trader"|null}}
"""
        response = self._call_gemini(prompt, temperature=0.0, max_tokens=150)
        if response:
            try:
                # Strip any markdown code blocks
                clean_json = re.sub(r"```(?:json)?", "", response).strip()
                parsed = json.loads(clean_json)
                if isinstance(parsed, dict) and "intent" in parsed:
                    return parsed
            except Exception:
                pass

        return {"intent": "standard"}

    # -----------------------------------------------------------------------
    # Issue #12: AI Executive Commentary for 1-Page PDF Fact Sheets
    # -----------------------------------------------------------------------
    def generate_pdf_executive_commentary(
        self,
        hub_id: str,
        summary: Dict[str, Any],
        audience_mode: str,
        fallback_text: str,
    ) -> str:
        """Generates a strictly spatial-budgeted 50-word executive summary for the 1-page PDF fact sheet."""
        if not self.enabled:
            return fallback_text

        prompt = f"""Write an executive commentary paragraph for a 1-page MISO Energy Market Fact Sheet.
Hub: {hub_id}
Metrics: Real-Time Avg ${summary.get('realTimeAvg', 0):.2f}/MWh, Day-Ahead Avg ${summary.get('dayAheadAvg', 0):.2f}/MWh, Peak Hour {summary.get('peakHour', 'HE 18')}, Total Cleared Volume {summary.get('formattedVolume', '')}.
Audience: {audience_mode}

STRICT CONSTRAINTS:
1. Exactly 45 to 55 words total (will break layout if longer).
2. Authoritative, board-level tone summarizing price stability and net-load clearing.
3. No headers, bullets, or quotes.
"""
        result = self._call_gemini(prompt, temperature=0.2, max_tokens=120)
        if result and len(result.split()) <= 65:
            return result.strip()
        return fallback_text

    # -----------------------------------------------------------------------
    # Issue #13: Dynamic Proactive Follow-Up Generator
    # -----------------------------------------------------------------------
    def generate_proactive_followups(
        self,
        query: str,
        chart_type: str,
        summary_data: Dict[str, Any],
        persona: str,
        fallback_chips: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Generates 3 executable follow-up action chips tailored to the user's research path."""
        if not self.enabled:
            return fallback_chips

        prompt = f"""Given this user search and results on MISO OmniSearch:
Query: "{query}"
Chart Type: {chart_type}
Audience: {persona}
Key Data: {json.dumps(summary_data)}

Generate 3 logical, actionable follow-up research chips for the user.
Allowed actions and their param schemas:
- "compare_hubs": {{"hubs": ["INDIANA.HUB", "MICHIGAN.HUB"]}}
- "show_spread": {{"hub": "INDIANA.HUB"}}
- "download_csv": {{"hub": "INDIANA.HUB"}}
- "search_query": {{"q": "Search prompt text"}}

Return ONLY raw JSON array:
[
  {{"label": "Chip label", "action": "compare_hubs"|"show_spread"|"download_csv"|"search_query", "params": {{...}}}},
  ...
]
"""
        response = self._call_gemini(prompt, temperature=0.3, max_tokens=250)
        if response:
            try:
                clean_json = re.sub(r"```(?:json)?", "", response).strip()
                parsed = json.loads(clean_json)
                if isinstance(parsed, list) and len(parsed) >= 2:
                    valid_chips = []
                    for chip in parsed[:3]:
                        if isinstance(chip, dict) and "label" in chip and "action" in chip:
                            valid_chips.append({
                                "label": str(chip["label"]),
                                "action": str(chip["action"]),
                                "params": chip.get("params", {})
                            })
                    if len(valid_chips) >= 2:
                        return valid_chips
            except Exception:
                pass
        return fallback_chips

llm_service = LLMService()

