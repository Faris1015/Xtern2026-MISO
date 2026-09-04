"""
MISO OmniSearch - Search Engine
Core query intelligence engine delivering:
- Persona-tailored 360 Knowledge Canvas responses
- Zero cold-start Session-Aware Pre-Fetching
- Multi-Hub, Multi-Fuel, and Multi-Plan comparative series alignment
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from data_manager import data_manager


# ---------------------------------------------------------------------------
# Pydantic Schemas for OpenAPI Specification
# ---------------------------------------------------------------------------

class KpiCard(BaseModel):
    label: str = Field(..., description="Label of the executive metric")
    value: str = Field(..., description="Formatted value with units")
    color: str = Field(..., description="Accent color theme (sky, slate, red, emerald, amber, purple)")


class FollowUpAction(BaseModel):
    label: str = Field(..., description="Display label for the action chip")
    action: str = Field(..., description="Action identifier")
    params: Dict[str, Any] = Field(default_factory=dict, description="Parameters to trigger the action")


class SearchResponse(BaseModel):
    query: str
    directAnswer: str
    sourceCitation: str
    kpis: List[KpiCard]
    chartType: str = Field(..., description="lmp_series | fuel_mix | transmission_bar | glossary_card")
    hubId: Optional[str] = None
    data: Any = Field(None, description="Direct charting payload aligned for Recharts")
    proactiveFollowUps: List[FollowUpAction]


class SessionPrefetchResponse(BaseModel):
    sessionContext: str
    timestamp: str
    featuredHub: Dict[str, Any]
    generationMixSummary: List[Dict[str, Any]]
    recentPeaks: Dict[str, Any]
    quickStartChips: List[Dict[str, Any]]


class ComparisonSeriesPoint(BaseModel):
    hourEnding: int
    intervalLabel: str
    metrics: Dict[str, float]


class ComparisonResponse(BaseModel):
    compareType: str = Field(..., description="hubs | fuels | plans")
    items: List[str]
    title: str
    metricsSummary: List[Dict[str, Any]]
    series: List[Dict[str, Any]]
    sourceCitation: str


# ---------------------------------------------------------------------------
# Query Processing & Persona Adaptation
# ---------------------------------------------------------------------------

def normalize(text: str) -> str:
    return re.sub(r"[^\w\s]", "", text.lower()).strip()


class SearchEngine:
    """Intelligent parsing and retrieval engine for MISO OmniSearch."""

    def __init__(self):
        self.dm = data_manager

    def search(self, query: str, persona: str = "Power Trader") -> SearchResponse:
        q_norm = normalize(query)

        # 1. Check if user explicitly asked for an acronym / definition ("what is", "explain", "formula", or exact acronym)
        is_definitional = any(term in q_norm for term in ["what is", "define", "definition", "explain", "formula", "meaning", "acronym"])
        if is_definitional:
            glossary_match = self._match_glossary(q_norm)
            if glossary_match:
                return self._build_glossary_response(query, glossary_match, persona)

        # 2. Check for Specific Hub Intent (e.g. "Indiana Hub LMP", "Michigan Hub")
        hub_match = self._match_hub(q_norm)
        if hub_match:
            return self._build_hub_response(query, hub_match, persona)

        # 3. Check for Fuel Mix / Generation / Peak Intent
        if any(term in q_norm for term in ["fuel", "solar", "wind", "coal", "gas", "nuclear", "peak", "demand", "mix", "generation"]):
            return self._build_fuel_response(query, q_norm, persona)

        # 4. Check for Transmission / MTEP / LRTP / Seam Intent
        if any(term in q_norm for term in ["mtep", "lrtp", "jtiq", "transmission", "lines", "miles", "grid expansion"]):
            return self._build_transmission_response(query, q_norm, persona)

        # 5. Check for standalone Glossary / Acronym match (e.g. query is "CONE" or "PRA")
        glossary_match = self._match_glossary(q_norm)
        if glossary_match:
            return self._build_glossary_response(query, glossary_match, persona)

        # 6. Default / Fallback: Indiana Hub Market Pricing
        return self._build_hub_response(query, "INDIANA.HUB", persona, is_fallback=True)

    def _match_hub(self, q_norm: str) -> Optional[str]:
        mapping = {
            "indiana": "INDIANA.HUB",
            "michigan": "MICHIGAN.HUB",
            "illinois": "ILLINOIS.HUB",
            "minn": "MINN.HUB",
            "minnesota": "MINN.HUB",
            "louisiana": "LOUISIANA.HUB",
            "texas": "TEXAS.HUB",
        }
        for k, v in mapping.items():
            if k in q_norm:
                return v
        if "lmp" in q_norm or "price" in q_norm or "hub" in q_norm or "market" in q_norm:
            return "INDIANA.HUB"
        return None

    def _match_glossary(self, q_norm: str) -> Optional[Dict[str, Any]]:
        for acronym, entry in self.dm.glossary.items():
            # Match whole word or exact acronym in query
            if re.search(r"\b" + re.escape(acronym.lower()) + r"\b", q_norm) or acronym.lower() == q_norm:
                return {"acronym": acronym, **entry}
            if entry["term"].lower() in q_norm:
                return {"acronym": acronym, **entry}
        return None

    def _build_hub_response(self, raw_query: str, hub_id: str, persona: str, is_fallback: bool = False) -> SearchResponse:
        hub = self.dm.get_hub(hub_id) or self.dm.get_hub("INDIANA.HUB")
        summary = hub["summary"]
        hourly = hub["hourly"]

        # Persona narrative customization
        if "trader" in persona.lower():
            narrative = (
                f"{hub['hubName']} Real-Time LMP average is ${summary['realTimeAvg']:.2f}/MWh against a Day-Ahead average of "
                f"${summary['dayAheadAvg']:.2f}/MWh (net spread: ${round(summary['realTimeAvg'] - summary['dayAheadAvg'], 2):+.2f}/MWh). "
                f"Peak pricing materialized at {summary['peakHour']}, driven by evening net-load ramp and localized transmission constraints. "
                f"Congestion margins remained contained with total cleared day volume across the node at {summary['formattedVolume']}."
            )
        elif "co-op" in persona.lower() or "municipal" in persona.lower():
            narrative = (
                f"Wholesale power supply costs at {hub['hubName']} averaged ${summary['realTimeAvg']:.2f}/MWh over the last 24 hours. "
                f"Off-peak intervals offered stable cost hedging at ${min(h['realTimeLmp'] for h in hourly):.2f}/MWh, while peak load at "
                f"{summary['peakHour']} reflected heightened reserve margins. Cooperative purchasing strategies benefit from steady Day-Ahead clearing."
            )
        elif "regulator" in persona.lower():
            narrative = (
                f"Real-Time price formation at {hub['hubName']} demonstrated reliable clearing behavior with an average LMP of ${summary['realTimeAvg']:.2f}/MWh. "
                f"Day-Ahead convergence stood within normal bounds at ${summary['dayAheadAvg']:.2f}/MWh, indicating efficient resource commitment. "
                f"Transmission loss and congestion components exhibited standard non-discriminatory clearing."
            )
        else:  # Public / Media
            narrative = (
                f"The wholesale electricity price at {hub['hubName']} is currently averaging about ${summary['realTimeAvg']:.2f} per megawatt-hour. "
                f"Prices peaked during the high energy demand period at {summary['peakHour']}. MISO continues to operate the bulk electric power grid "
                f"with reliable dispatch across the region."
            )

        if is_fallback:
            narrative = f"Showing baseline market clearing data for {hub['hubName']}: " + narrative

        kpis = [
            KpiCard(label="Real-Time Avg", value=f"${summary['realTimeAvg']:.2f}/MWh", color="sky"),
            KpiCard(label="Day-Ahead Avg", value=f"${summary['dayAheadAvg']:.2f}/MWh", color="slate"),
            KpiCard(label="Peak Hour", value=summary["peakHour"], color="red"),
            KpiCard(label="Volume", value=summary["formattedVolume"], color="emerald"),
        ]

        follow_ups_raw = self.dm.get_related_queries(hub_id.replace(".HUB", "").lower())
        follow_ups = [FollowUpAction(**f) for f in follow_ups_raw]

        return SearchResponse(
            query=raw_query,
            directAnswer=narrative,
            sourceCitation="MISO Data Exchange API (GET /api/v1/markets/realtime/lmp)",
            kpis=kpis,
            chartType="lmp_series",
            hubId=hub["hubId"],
            data=hourly,
            proactiveFollowUps=follow_ups,
        )

    def _build_fuel_response(self, raw_query: str, q_norm: str, persona: str) -> SearchResponse:
        fuel_data = self.dm.get_fuel_peaks()
        peaks = fuel_data["recordPeaks"]
        mix = fuel_data["generationMix"]

        if "solar" in q_norm:
            sp = peaks["solarPeak"]
            narrative = (
                f"MISO registered an all-time utility-scale Solar Generation Peak of {sp['valueGw']} GW on {sp['date']} at {sp['time']}. "
                f"Solar now accounts for approximately 3% of instant fuel mix and represents over 55% of incoming capacity in the active generator interconnection queue."
            )
            kpis = [
                KpiCard(label="Solar Peak Record", value=f"{sp['valueGw']} GW", color="amber"),
                KpiCard(label="Peak Timestamp", value=sp["date"], color="slate"),
                KpiCard(label="Grid Share", value="3.0%", color="sky"),
                KpiCard(label="Installed Solar", value="6.1 GW", color="emerald"),
            ]
        elif "wind" in q_norm:
            wp = peaks["windPeak"]
            narrative = (
                f"MISO reached a historical Wind Generation Peak of {wp['valueGw']} GW on {wp['date']} at {wp['time']}. "
                f"Wind power currently delivers 15% of real-time supply with 30.5 GW of accredited capacity across the northern footprint."
            )
            kpis = [
                KpiCard(label="Wind Peak Record", value=f"{wp['valueGw']} GW", color="emerald"),
                KpiCard(label="Peak Timestamp", value=wp["date"], color="slate"),
                KpiCard(label="Grid Share", value="15.0%", color="sky"),
                KpiCard(label="Installed Wind", value="30.5 GW", color="purple"),
            ]
        else:
            dem = peaks["allTimeDemandRecord"]
            narrative = (
                f"MISO's real-time fuel generation is led by Natural Gas (40%) and Coal (26%), with Wind delivering 15% and Nuclear 14%. "
                f"All-time coincident system peak demand stands at {dem['valueGw']} GW, set on {dem['date']} across 15 states."
            )
            kpis = [
                KpiCard(label="Peak Demand Record", value=f"{dem['valueGw']} GW", color="red"),
                KpiCard(label="Natural Gas Share", value="40%", color="sky"),
                KpiCard(label="Renewables (W+S)", value="18%", color="emerald"),
                KpiCard(label="Installed Capacity", value="203 GW", color="slate"),
            ]

        follow_ups_raw = self.dm.get_related_queries("solar peak" if "solar" in q_norm else "fuel mix")
        follow_ups = [FollowUpAction(**f) for f in follow_ups_raw]

        return SearchResponse(
            query=raw_query,
            directAnswer=narrative,
            sourceCitation="MISO Operations & Real-Time Fuel Telemetry (Fact Sheet Baseline July 2025)",
            kpis=kpis,
            chartType="fuel_mix",
            hubId=None,
            data=mix,
            proactiveFollowUps=follow_ups,
        )

    def _build_transmission_response(self, raw_query: str, q_norm: str, persona: str) -> SearchResponse:
        mtep = self.dm.get_mtep_projects()
        cats = mtep["categories"]
        lrtp = next(c for c in cats if c["id"] == "lrtp_regional")
        local = next(c for c in cats if c["id"] == "mtep_local")
        jtiq = next(c for c in cats if c["id"] == "jtiq_interregional")

        narrative = (
            f"Under MISO Transmission Expansion Planning, Regional LRTP (Long Range Transmission Planning) encompasses "
            f"{lrtp['projectsCount']} critical regional projects spanning {lrtp['miles']:,} miles ({lrtp['investmentEst']}) to transmit clean energy. "
            f"Local MTEP reliability additions total {local['projectsCount']} projects ({local['miles']} miles), while Joint Seam (JTIQ) "
            f"addresses {jtiq['projectsCount']} interregional congestion points with SPP."
        )

        kpis = [
            KpiCard(label="LRTP Projects", value=f"{lrtp['projectsCount']}", color="sky"),
            KpiCard(label="LRTP Line Miles", value=f"{lrtp['miles']:,} mi", color="emerald"),
            KpiCard(label="Total Portfolio", value=f"{mtep['totalProjects']} Projects", color="purple"),
            KpiCard(label="Total Transmission", value=f"{mtep['totalMiles']:,} mi", color="slate"),
        ]

        follow_ups_raw = self.dm.get_related_queries("mtep24")
        follow_ups = [FollowUpAction(**f) for f in follow_ups_raw]

        return SearchResponse(
            query=raw_query,
            directAnswer=narrative,
            sourceCitation="MISO Board of Directors Approved MTEP24 & LRTP Filings",
            kpis=kpis,
            chartType="transmission_bar",
            hubId=None,
            data=cats,
            proactiveFollowUps=follow_ups,
        )

    def _build_glossary_response(self, raw_query: str, entry: Dict[str, Any], persona: str) -> SearchResponse:
        acronym = entry["acronym"]
        term = entry["term"]
        eli5 = entry["eli5"]
        technical = entry["technical"]
        formula = entry.get("formula", "")

        narrative = f"**{acronym} ({term})**: {eli5}\n\n*Technical Detail:* {technical}"
        if formula:
            narrative += f"\n\n*Reference Formula:* `{formula}`"

        kpis = [
            KpiCard(label="Category", value=entry.get("category", "Market Rule"), color="sky"),
            KpiCard(label="Standard Acronym", value=acronym, color="emerald"),
            KpiCard(label="Definition Type", value="Official MISO Tariff", color="slate"),
            KpiCard(label="Formula Reference", value=formula[:18] if formula else "SCED Model", color="purple"),
        ]

        follow_ups = [
            FollowUpAction(label=f"Explore {acronym} Tariff Documentation", action="view_tariff", params={"term": acronym}),
            FollowUpAction(label="Compare Related Market Acronyms", action="view_glossary", params={"category": entry.get("category")}),
            FollowUpAction(label="Return to Indiana Hub Pricing", action="search", params={"q": "Indiana Hub LMP"}),
        ]

        return SearchResponse(
            query=raw_query,
            directAnswer=narrative,
            sourceCitation=f"MISO Tariff Module & Glossary Dictionary ({acronym})",
            kpis=kpis,
            chartType="glossary_card",
            hubId=None,
            data=entry,
            proactiveFollowUps=follow_ups,
        )

    # -----------------------------------------------------------------------
    # Session-Aware Pre-Fetching (Zero Cold Start)
    # -----------------------------------------------------------------------
    def get_session_prefetch(self) -> SessionPrefetchResponse:
        indiana = self.dm.get_hub("INDIANA.HUB")
        fuels = self.dm.get_fuel_peaks()

        return SessionPrefetchResponse(
            sessionContext="Active Session Radar: Detected recent viewing of Indiana Hub LMPs & Solar Queue.",
            timestamp="2026-09-03T22:45:00Z",
            featuredHub=indiana,
            generationMixSummary=fuels["generationMix"],
            recentPeaks=fuels["recordPeaks"],
            quickStartChips=[
                {"label": "Indiana Hub Briefing", "query": "Indiana Hub LMP", "type": "hub"},
                {"label": "Compare vs. Michigan", "query": "compare Indiana and Michigan", "type": "compare"},
                {"label": "MISO Peak Records", "query": "Solar and Wind Peak records", "type": "peaks"},
                {"label": "What is LRTP?", "query": "What is LRTP?", "type": "glossary"},
            ],
        )

    # -----------------------------------------------------------------------
    # Multi-Series Comparison Engine
    # -----------------------------------------------------------------------
    def compare(self, compare_type: str, items_str: str) -> ComparisonResponse:
        ctype = compare_type.lower().strip()
        item_list = [i.strip() for i in items_str.split(",") if i.strip()]

        if ctype in ["hubs", "hub"]:
            return self._compare_hubs(item_list)
        elif ctype in ["fuels", "fuel"]:
            return self._compare_fuels(item_list)
        elif ctype in ["plans", "plan", "transmission"]:
            return self._compare_plans(item_list)
        else:
            return self._compare_hubs(["INDIANA.HUB", "MICHIGAN.HUB"])

    def _compare_hubs(self, hubs: List[str]) -> ComparisonResponse:
        if not hubs:
            hubs = ["INDIANA.HUB", "MICHIGAN.HUB"]
        elif len(hubs) == 1:
            hubs.append("MICHIGAN.HUB" if "INDIANA" in hubs[0].upper() else "INDIANA.HUB")

        loaded_hubs: Dict[str, Any] = {}
        for h in hubs:
            clean_id = h.upper()
            if not clean_id.endswith(".HUB"):
                clean_id = f"{clean_id}.HUB"
            data = self.dm.get_hub(clean_id)
            if data:
                loaded_hubs[clean_id] = data

        if not loaded_hubs:
            loaded_hubs["INDIANA.HUB"] = self.dm.get_hub("INDIANA.HUB")
            loaded_hubs["MICHIGAN.HUB"] = self.dm.get_hub("MICHIGAN.HUB")

        series: List[Dict[str, Any]] = []
        for hour_idx in range(24):
            point: Dict[str, Any] = {
                "hourEnding": hour_idx + 1,
                "intervalLabel": f"HE {hour_idx + 1:02d}",
            }
            for hub_id, h_data in loaded_hubs.items():
                hr = h_data["hourly"][hour_idx]
                prefix = hub_id.replace(".HUB", "")
                point[f"{prefix}_rt"] = hr["realTimeLmp"]
                point[f"{prefix}_da"] = hr["dayAheadLmp"]
                point[f"{prefix}_spread"] = hr["spread"]
                point[f"{prefix}_vol"] = hr["volumeMwh"]
            series.append(point)

        summary: List[Dict[str, Any]] = []
        for hub_id, h_data in loaded_hubs.items():
            s = h_data["summary"]
            summary.append({
                "hubId": hub_id,
                "name": h_data["hubName"],
                "realTimeAvg": s["realTimeAvg"],
                "dayAheadAvg": s["dayAheadAvg"],
                "spreadAvg": round(s["realTimeAvg"] - s["dayAheadAvg"], 2),
                "peakHour": s["peakHour"],
                "peakPrice": s["peakPrice"],
                "volume": s["formattedVolume"]
            })

        hub_names = " vs. ".join([h_data["hubName"] for h_data in loaded_hubs.values()])
        return ComparisonResponse(
            compareType="hubs",
            items=list(loaded_hubs.keys()),
            title=f"Multi-Hub Comparative Pricing Analysis ({hub_names})",
            metricsSummary=summary,
            series=series,
            sourceCitation="MISO Market Data Exchange API (GET /api/v1/markets/realtime/lmp)",
        )

    def _compare_fuels(self, fuels: List[str]) -> ComparisonResponse:
        f_data = self.dm.get_fuel_peaks()
        mix = f_data["generationMix"]
        peaks = f_data["recordPeaks"]

        selected = mix
        if fuels:
            filter_terms = [f.lower() for f in fuels]
            matched = [m for m in mix if any(ft in m["fuel"].lower() for ft in filter_terms)]
            if matched:
                selected = matched

        series: List[Dict[str, Any]] = []
        for item in selected:
            series.append({
                "fuel": item["fuel"],
                "percentage": item["percentage"],
                "installedGw": item["installedGw"]
            })

        summary = [
            {"fuel": "Natural Gas", "percentage": 40.0, "peakRecord": "N/A (Firm Peaking)", "role": "Primary marginal resource"},
            {"fuel": "Coal", "percentage": 26.0, "peakRecord": "N/A (Baseload)", "role": "Baseload generation fleet"},
            {"fuel": "Wind", "percentage": 15.0, "peakRecord": f"{peaks['windPeak']['valueGw']} GW", "role": "Overnight & off-peak low marginal energy"},
            {"fuel": "Nuclear", "percentage": 14.0, "peakRecord": "N/A (Zero Emission)", "role": "Zero-carbon steady baseload"},
            {"fuel": "Solar", "percentage": 3.0, "peakRecord": f"{peaks['solarPeak']['valueGw']} GW", "role": "Daytime summer peak offset"},
        ]

        return ComparisonResponse(
            compareType="fuels",
            items=[s["fuel"] for s in series],
            title="MISO Real-Time Fuel Mix & Historical Generation Peaks Comparison",
            metricsSummary=summary,
            series=series,
            sourceCitation="MISO Operations & Planning Fuel Telemetry (Baseline July 2025)",
        )

    def _compare_plans(self, plans: List[str]) -> ComparisonResponse:
        mtep = self.dm.get_mtep_projects()
        cats = mtep["categories"]

        series = [
            {"category": c["categoryName"], "projects": c["projectsCount"], "miles": c["miles"]}
            for c in cats
        ]

        summary = [
            {"category": c["categoryName"], "projects": c["projectsCount"], "miles": f"{c['miles']:,} mi", "investment": c["investmentEst"], "focus": c["focus"]}
            for c in cats
        ]

        return ComparisonResponse(
            compareType="plans",
            items=[c["id"] for c in cats],
            title="MISO Transmission Portfolios: Local MTEP vs. Regional LRTP vs. Interregional JTIQ",
            metricsSummary=summary,
            series=series,
            sourceCitation="MISO Board Approved MTEP24 Portfolio",
        )


# Singleton instance
search_engine = SearchEngine()
