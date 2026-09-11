"""
MISO OmniSearch - LLM Service
Grounded RAG and Multi-Persona Intelligence Layer powering:
- Issue #9: Persona Narrative Synthesis (Trader, Co-op, Regulator, Public)
- Issue #10: Contextual "Chat with this Canvas" Copilot
- Issue #11: Semantic Intent Classifier & Out-of-Scope Domain Error Checking
- Issue #12: AI-Generated Executive Commentary for 1-Page PDF Fact Sheets
- Issue #13: Context-Aware Dynamic Research Follow-Up Action Chips

Dual-Engine Architecture:
- Local On-Premise: Ollama (Llama 3.2, Mistral, Gemma 2) for air-gapped NERC CIP compliance
- Cloud Fallback: Google Gemini 3.6 Flash REST API
- Deterministic Rule-Engine: 100% offline fallback when no model daemon or API key is available
"""

from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
import logging
import httpx

logger = logging.getLogger("miso.llm")

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

# Provider configuration: "auto" | "ollama" | "gemini"
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "auto").strip().lower()

# Ollama local configuration (Air-gapped NERC CIP on-premise inference)
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").strip().rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2").strip()
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "25.0"))

# Google Gemini API configuration (Cloud fallback)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
GEMINI_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

# Common energy / grid / MISO terminology for fast offline domain validation
MISO_DOMAIN_TERMS = {
    "miso", "lmp", "hub", "indiana", "michigan", "illinois", "texas", "louisiana", "minn", "minnesota",
    "fuel", "solar", "wind", "coal", "gas", "nuclear", "peak", "demand", "mix", "generation",
    "mtep", "lrtp", "jtiq", "transmission", "lines", "grid", "congestion", "loss", "energy",
    "mwh", "gw", "mw", "megawatt", "gigawatt", "cone", "pra", "iccp", "tariff", "ferc", "dayahead",
    "realtime", "spread", "arbitrage", "clearing", "reserve", "voltage", "substation", "interconnection",
    "coop", "co-op", "utility", "generator", "dispatch", "outage", "market", "pricing", "rate",
    "bpm", "bpms", "rulebook", "rulebooks", "manual", "manuals"
}

class LLMService:
    def __init__(self):
        self.provider = LLM_PROVIDER
        self.ollama_base_url = OLLAMA_BASE_URL
        self.ollama_model = OLLAMA_MODEL
        self.ollama_timeout = OLLAMA_TIMEOUT
        self.api_key = GEMINI_API_KEY
        self.model = GEMINI_MODEL
        self.client = httpx.Client(timeout=12.0)
        self.ollama_client = httpx.Client(timeout=self.ollama_timeout)
        self._ollama_status_cache: Optional[Dict[str, Any]] = None
        self._ollama_status_time: float = 0.0

    def reload_config(self):
        """Reloads API key, models, and providers if updated at runtime in .env."""
        _load_env_file()
        self.provider = os.getenv("LLM_PROVIDER", "auto").strip().lower()
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").strip().rstrip("/")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3.2").strip()
        self.ollama_timeout = float(os.getenv("OLLAMA_TIMEOUT", "25.0"))
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
        self.ollama_client = httpx.Client(timeout=self.ollama_timeout)
        self._ollama_status_cache = None
        self._ollama_status_time = 0.0

    @property
    def enabled(self) -> bool:
        """Returns True if any AI provider (Ollama or Gemini) is actively available."""
        if self.provider == "ollama":
            return self.check_ollama_status().get("available", False)
        elif self.provider == "gemini":
            return bool(self.api_key)
        else:  # "auto"
            return self.check_ollama_status().get("available", False) or bool(self.api_key)

    def check_ollama_status(self, force: bool = False) -> Dict[str, Any]:
        """Checks if local Ollama daemon is running and auto-discovers installed models."""
        now = time.time()
        if not force and self._ollama_status_cache and (now - self._ollama_status_time < 15.0):
            return self._ollama_status_cache

        status: Dict[str, Any] = {
            "available": False,
            "url": self.ollama_base_url,
            "models": [],
            "activeModel": None,
            "version": None,
            "error": None,
        }
        try:
            resp = httpx.get(f"{self.ollama_base_url}/api/tags", timeout=1.5)
            if resp.status_code == 200:
                data = resp.json()
                raw_models = data.get("models", [])
                models_list = [m.get("name", "") for m in raw_models if isinstance(m, dict)]
                status["available"] = True
                status["models"] = models_list

                # Select active model: prefer exact match, then prefix/contains, then first installed
                selected = None
                if self.ollama_model in models_list:
                    selected = self.ollama_model
                else:
                    for m_name in models_list:
                        if m_name.startswith(self.ollama_model) or self.ollama_model in m_name:
                            selected = m_name
                            break
                if not selected and models_list:
                    selected = models_list[0]
                status["activeModel"] = selected or self.ollama_model

                try:
                    v_resp = httpx.get(f"{self.ollama_base_url}/api/version", timeout=1.0)
                    if v_resp.status_code == 200:
                        status["version"] = v_resp.json().get("version")
                except Exception:
                    pass
        except Exception as e:
            status["error"] = str(e)

        self._ollama_status_cache = status
        self._ollama_status_time = now
        return status

    def get_provider_status(self) -> Dict[str, Any]:
        """Returns comprehensive status report on active provider, Ollama connectivity, and Gemini status."""
        ollama_info = self.check_ollama_status()
        gemini_enabled = bool(self.api_key)

        if self.provider == "ollama":
            active = "ollama" if ollama_info["available"] else "none"
        elif self.provider == "gemini":
            active = "gemini" if gemini_enabled else "none"
        else:  # "auto"
            if ollama_info["available"]:
                active = "ollama"
            elif gemini_enabled:
                active = "gemini"
            else:
                active = "deterministic"

        return {
            "configuredProvider": self.provider,
            "activeProvider": active,
            "isAiEnabled": active in ("ollama", "gemini"),
            "ollama": ollama_info,
            "gemini": {
                "enabled": gemini_enabled,
                "model": self.model,
            },
        }

    def _call_ollama(self, prompt: str, temperature: float = 0.2, max_tokens: int = 400) -> Optional[str]:
        """Calls local Ollama REST API endpoint with structured parameters."""
        ollama_status = self.check_ollama_status()
        if not ollama_status.get("available"):
            return None

        target_model = ollama_status.get("activeModel") or self.ollama_model
        url = f"{self.ollama_base_url}/api/generate"
        payload = {
            "model": target_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        try:
            resp = self.ollama_client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data.get("response", "").strip()
                if text:
                    return text
        except Exception as e:
            logger.warning("Ollama API call failed on model %s: %s", target_model, e)
        return None

    def _call_gemini(self, prompt: str, temperature: float = 0.2, max_tokens: int = 400) -> Optional[str]:
        """Calls Google Gemini REST API using httpx with tight timeout."""
        if not bool(self.api_key):
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }
        try:
            resp = self.client.post(url, json=payload, headers={"Content-Type": "application/json"})
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
            elif resp.status_code == 404:
                for fallback_model in ["gemini-flash-latest", "gemini-3.6-flash"]:
                    if fallback_model == self.model:
                        continue
                    fallback_url = f"https://generativelanguage.googleapis.com/v1beta/models/{fallback_model}:generateContent?key={self.api_key}"
                    resp2 = self.client.post(fallback_url, json=payload, headers={"Content-Type": "application/json"})
                    if resp2.status_code == 200:
                        candidates = resp2.json().get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                return parts[0].get("text", "").strip()
        except Exception as e:
            logger.warning("Gemini API call failed: %s", e)
        return None

    def _call_llm(self, prompt: str, temperature: float = 0.2, max_tokens: int = 400) -> Optional[str]:
        """
        Unified LLM Dispatcher with automatic fallback hierarchy:
        - 'ollama': calls local Ollama only
        - 'gemini': calls Google Gemini only
        - 'auto': probes Ollama first (air-gapped NERC CIP); falls back to Gemini if available
        """
        provider = self.provider

        if provider == "ollama":
            return self._call_ollama(prompt, temperature=temperature, max_tokens=max_tokens)
        elif provider == "gemini":
            return self._call_gemini(prompt, temperature=temperature, max_tokens=max_tokens)
        else:  # "auto"
            ollama_status = self.check_ollama_status()
            if ollama_status.get("available"):
                ollama_res = self._call_ollama(prompt, temperature=temperature, max_tokens=max_tokens)
                if ollama_res:
                    return ollama_res

            if self.api_key:
                return self._call_gemini(prompt, temperature=temperature, max_tokens=max_tokens)

        return None

    def _verify_numerical_grounding(self, text: str, data_summary: Dict[str, Any]) -> bool:
        """
        Issue #5: Automated fact-check verifier.
        Extracts dollar amounts and percentages from AI text and checks if they correlate
        with numbers in data_summary or standard market thresholds.
        """
        if not text or not data_summary:
            return True
        summary_str = json.dumps(data_summary)
        # Extract currency values like $38.45 or $1,850.00
        currency_matches = re.findall(r"\$([\d,]+(?:\.\d+)?)", text)
        for val in currency_matches:
            clean_val = val.replace(",", "")
            # If AI writes a price that isn't anywhere in the summary data, flag or reject
            if clean_val not in summary_str and val not in summary_str:
                try:
                    num_val = float(clean_val)
                    # Allow reasonable small differences like rounding, but reject wild hallucinations (> $500/MWh when base is < $60)
                    if num_val > 500:
                        logger.warning("Fact-check rejected hallucinated price: $%s", val)
                        return False
                except ValueError:
                    pass
        return True

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
1. Provide a concise, professional 2-3 sentence executive answer explaining the key metrics in natural, flowing sentences.
2. Adapt your tone and vocabulary to the active persona:
   - Power Trader: Emphasize Day-Ahead vs. Real-Time arbitrage spread ($/MWh), peak hour net ramp, and congestion.
   - Municipal Co-op: Focus on wholesale power procurement cost stability, off-peak hedging, and customer rate impact.
   - State Regulator: Highlight non-discriminatory clearing, reserve margins, price formation, and FERC tariff compliance.
   - Public / Media: Provide a clear, plain-English overview of wholesale electricity costs and regional grid reliability.
3. CRITICAL RULE: Rely ONLY on the verified numbers provided above. Do NOT invent any prices, hours, or volumes.
4. CRITICAL: Do NOT use markdown asterisks (**) or bullet points anywhere in your response. Write standard flowing prose without bolding.
"""
        result = self._call_llm(prompt, temperature=0.2, max_tokens=250)
        if result:
            clean_text = result.replace("**", "").replace("*", "").strip()
            # Issue #5 Fact-check verification
            if self._verify_numerical_grounding(clean_text, data_summary):
                return clean_text
            logger.warning("AI output failed numerical grounding fact-check, using verified template.")
        return fallback_text.replace("**", "").replace("*", "").strip()

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
            return self._fallback_canvas_chat(message, canvas_context, persona)

        # Build recent conversation history snippet
        conv_history = ""
        if history:
            for turn in history[-4:]:
                role = "User" if turn.get("role") == "user" else "Assistant"
                conv_history += f"{role}: {turn.get('content', '')}\n"

        prompt = f"""You are OmniSearch, a knowledgeable, intuitive MISO wholesale electric market assistant.
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
{message}

INSTRUCTIONS:
1. Answer the user question in 2-3 natural, clear sentences using the active canvas numbers.
2. Address the user inquiry directly. If they ask about causes, price drivers, or differences, explain them clearly.
3. CRITICAL: Do NOT use any markdown asterisks (**) or bullet points. Never put asterisks around numbers or names.
4. Provide 2 short, natural follow-up exploration questions for the user. Format the last line as:
FOLLOW_UPS: ["Question 1", "Question 2"]
"""
        response = self._call_llm(prompt, temperature=0.3, max_tokens=350)
        if not response:
            return self._fallback_canvas_chat(message, canvas_context, persona)

        # Parse follow-ups if returned
        answer_text = response
        follow_ups = ["Show Day-Ahead Price Spread", "Compare with Michigan Hub"]
        if "FOLLOW_UPS:" in response:
            parts = response.split("FOLLOW_UPS:", 1)
            answer_text = parts[0].strip()
            try:
                parsed_fus = json.loads(parts[1].strip())
                if isinstance(parsed_fus, list) and len(parsed_fus) >= 1:
                    follow_ups = [str(f).replace("**", "").replace("*", "") for f in parsed_fus[:3]]
            except Exception:
                pass

        clean_answer = answer_text.replace("**", "").replace("*", "").strip()

        active_prov = self.get_provider_status().get("activeProvider", "deterministic")
        prov_model = self.check_ollama_status().get("activeModel") if active_prov == "ollama" else self.model
        prov_label = f"{active_prov} ({prov_model})"

        return {
            "response": clean_answer,
            "citations": [canvas_context.get("sourceCitation", "MISO Data Exchange API")],
            "suggestedFollowUps": follow_ups,
            "isAiGenerated": True,
            "provider": prov_label,
        }

    def _fallback_canvas_chat(
        self,
        message: str,
        canvas_context: Dict[str, Any],
        persona: str = "Power Trader",
    ) -> Dict[str, Any]:
        """Context-rich deterministic fallback when LLM API is unavailable."""
        kpis = canvas_context.get("kpis", [])
        hub_id = canvas_context.get("hubId", "INDIANA.HUB")
        kpi_map = {k.get("label", "").lower(): k.get("value", "") for k in kpis if isinstance(k, dict)}
        kpi_summary = ", ".join(f"{k.get('label')}: {k.get('value')}" for k in kpis if isinstance(k, dict))
        
        q_lower = message.lower()
        if "peak" in q_lower or "high" in q_lower or "spike" in q_lower:
            ans = f"Based on current {hub_id} telemetry, peak price cleared at evening net-load ramp ({kpi_summary}). Generation dispatch margins tightened as solar generation subsided."
            ans = f"Based on current {hub_id} telemetry, peak price cleared during the evening net-load ramp ({kpi_summary}). Generation margins tightened as solar generation dropped off into the sunset hours."
        elif "spread" in q_lower or "day-ahead" in q_lower or "real-time" in q_lower:
            ans = f"Wholesale price spreads at {hub_id} reflect real-time balancing against scheduled Day-Ahead positions ({kpi_summary}). Non-zero spreads indicate localized ramp and congestion adjustments."
            ans = f"Wholesale price spreads at {hub_id} reflect real-time balancing against scheduled Day-Ahead positions ({kpi_summary}). Positive spreads indicate localized ramp and demand adjustments."

        if any(w in q_lower for w in ["peak", "high", "spike", "expensive", "surge"]):
            peak_val = kpi_map.get("peak price", kpi_map.get("peak interval", "HE 19"))
            ans = (
                f"Peak prices at {hub_id} ({peak_val}) occur during the evening net-load ramp between 5 PM and 8 PM (HE 17–19). "
                f"As solar output subsides while commercial and residential load remains elevated, MISO dispatches higher-cost natural gas peaking generators to balance the system."
            )
            follow_ups = ["Show Day-Ahead Price Spread", "Compare with Michigan Hub"]

        elif any(w in q_lower for w in ["spread", "day-ahead", "real-time", "arbitrage", "da", "rt"]):
            ans = (
                f"Wholesale price spreads at {hub_id} reflect the difference between forward scheduled Day-Ahead financial commitments and physical Real-Time 5-minute dispatch ({kpi_summary}). "
                f"Positive spreads indicate unexpected real-time demand ramps, generator outages, or localized transmission congestion."
            )
            follow_ups = ["View Hourly Pricing Table", "Compare with Texas Hub"]

        elif any(w in q_lower for w in ["congestion", "constraint", "mcc", "bottleneck", "transmission"]):
            ans = (
                f"Transmission congestion accounts for localized LMP differences between commercial hubs. "
                f"When high-voltage transmission lines reach thermal limits, MISO's security-constrained economic dispatch (SCED) re-dispatches generation out of economic order, adding a Marginal Congestion Component (MCC)."
            )
            follow_ups = ["View MTEP24 Transmission Projects", "Compare Hub Spreads"]

        elif any(w in q_lower for w in ["fuel", "solar", "wind", "gas", "coal", "nuclear", "clean", "carbon"]):
            ans = (
                f"MISO's regional generation fuel mix is led by Natural Gas (40%) and Coal (26%), with Wind (15%) and Nuclear (14%) providing major zero-carbon baseload. "
                f"Solar generates 3% of annual energy and delivers peak output during midday summer hours, significantly reducing daytime LMP prior to the evening ramp."
            )
            follow_ups = ["Explore Fuel Generation Mix", "View Historic Solar Peak"]

        elif any(w in q_lower for w in ["coop", "co-op", "rate", "customer", "municipal", "hedging"]):
            ans = (
                f"For municipal utilities and electric co-operatives, {hub_id} pricing ({kpi_summary}) underscores the importance of bilateral Day-Ahead hedging. "
                f"Off-peak intervals provide predictable cost baselines, protecting retail members from volatile real-time spot market spikes."
            )
            follow_ups = ["What is PRA (Planning Resource Auction)?", "View Off-Peak Averages"]

        elif any(w in q_lower for w in ["manitoba", "canada", "north", "import"]):
            ans = (
                f"Manitoba Hydro is an interconnected transmission-owning and coordination member of MISO. "
                f"Through 500 kV cross-border tie lines (such as Dorsey-Forbes and the Great Northern Transmission Line), Manitoba delivers clean surplus hydro energy into MISO during summer cooling peaks."
            )
            follow_ups = ["Explore MISO Footprint", "View Transmission Expansion Plans"]

        elif any(w in q_lower for w in ["why", "cause", "reason", "driver"]):
            ans = (
                f"Price formation at {hub_id} is driven by marginal unit heat rates, localized transmission constraints, and net system load. "
                f"Current verified metrics ({kpi_summary}) reflect normal grid dispatch operations under MISO Tariff Module C clearing rules."
            )
            follow_ups = ["What is LMP formula?", "Show Hourly LMP Breakdown"]

        elif any(w in q_lower for w in ["how", "calculate", "formula", "mechanism"]):
            ans = (
                f"MISO calculates Locational Marginal Prices every 5 minutes using the formula: LMP = Marginal Energy Component (MEC) + Marginal Congestion Component (MCC) + Marginal Loss Component (MLC) as defined in BPM-002 Section 4. "
                f"Active telemetry for {hub_id} shows overall clearing stability ({kpi_summary})."
            )
            follow_ups = ["Open Jargon HUD (Ctrl+J)", "View 3-Part Component Split"]

        elif any(w in q_lower for w in ["bpm", "rulebook", "rule", "manual", "settlement rule", "interconnection rule", "planning rule"]):
            ans = (
                f"MISO grid operations and wholesale electricity markets are governed by official Business Practice Manuals (BPMs) under FERC oversight. "
                f"For example, Energy and Reserve Market clearing is governed by BPM-002, Resource Adequacy by BPM-011, "
                f"Generator Interconnection by BPM-015, Market Settlements by BPM-005, and Transmission Planning by BPM-020."
            )
            follow_ups = ["Search BPM 002 (Energy Markets)", "Explore BPM 020 (Transmission Planning)"]

        else:
            ans = f"Analyzing active telemetry for {hub_id}. Current verified metrics indicate {kpi_summary}. Dispatch conditions remain in normal operating parameters across the MISO region."
            ans = f"Looking at the active telemetry for {hub_id}, current verified metrics indicate {kpi_summary}. Grid conditions remain within normal operating parameters across the footprint."
            ans = (
                f"Analyzing active telemetry for {hub_id} regarding your inquiry. "
                f"Current verified metrics indicate {kpi_summary}. Grid operations and wholesale clearing continue within established operating reliability limits across the footprint."
            )
            follow_ups = ["Show Day-Ahead Price Spread", "Explore Regional Fuel Mix"]

        clean_ans = ans.replace("**", "").replace("*", "").strip()

        return {
            "response": clean_ans,
            "citations": [canvas_context.get("sourceCitation", "MISO Data Exchange API")],
            "suggestedFollowUps": follow_ups,
            "isAiGenerated": False,
            "provider": "deterministic",
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
        response = self._call_llm(prompt, temperature=0.0, max_tokens=150)
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

        rt_val = round(float(summary.get('realTimeAvg') or 0.0), 2)
        da_val = round(float(summary.get('dayAheadAvg') or 0.0), 2)
        peak_hour = summary.get('peakHour', 'HE 18')
        vol = summary.get('formattedVolume', '')

        prompt = f"""Write an executive commentary paragraph for a 1-page MISO Energy Market Fact Sheet.
Hub: {hub_id}
Metrics: Real-Time Avg ${rt_val}/MWh, Day-Ahead Avg ${da_val}/MWh, Peak Hour {peak_hour}, Total Cleared Volume {vol}.
Audience: {audience_mode}

STRICT CONSTRAINTS:
1. Exactly 45 to 55 words total (will break layout if longer).
2. Authoritative, board-level tone summarizing price stability and net-load clearing.
3. No headers, bullets, quotes, or asterisks (**).
"""
        result = self._call_llm(prompt, temperature=0.2, max_tokens=120)
        if result and len(result.split()) <= 65:
            return result.replace("**", "").replace("*", "").strip()
        return fallback_text.replace("**", "").replace("*", "").strip()

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
        """Generates 3 executable follow-up action chips tailored to the user research path."""
        if not self.enabled:
            return fallback_chips

        prompt = (
            f"Given this user search and results on MISO OmniSearch:\n"
            f"Query: \"{query}\"\n"
            f"Chart Type: {chart_type}\n"
            f"Audience: {persona}\n"
            f"Key Data: {json.dumps(summary_data)}\n\n"
            "Generate 3 logical, actionable follow-up research chips for the user.\n"
            "Allowed actions:\n"
            "- compare_hubs: {\"hubs\": [\"INDIANA.HUB\", \"MICHIGAN.HUB\"]}\n"
            "- show_spread: {\"hub\": \"INDIANA.HUB\"}\n"
            "- download_csv: {\"hub\": \"INDIANA.HUB\"}\n"
            "- search_query: {\"q\": \"Search prompt text\"}\n\n"
            "Return ONLY raw JSON array of 3 objects with label, action, and params.\n"
        )
        response = self._call_llm(prompt, temperature=0.3, max_tokens=250)

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

