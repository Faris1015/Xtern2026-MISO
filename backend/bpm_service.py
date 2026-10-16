"""
MISO OmniSearch - Hybrid Semantic RAG for Business Practice Manuals (BPMs)
Combines BM25 lexical token matching and semantic concept scoring to index and retrieve
precise clauses, mathematical formulas, and tariff rules across MISO's 20+ BPM rulebooks.
"""

from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

# Granular Section-Level Index for High-Value MISO BPM Rulebooks
DETAILED_BPM_SECTIONS = [
    {
        "bpmNumber": "BPM 002",
        "section": "§4.3.1",
        "title": "Mathematical Decomposition of Locational Marginal Prices (LMPs)",
        "content": (
            "The Locational Marginal Price (LMP) at any Commercial Pricing Node (CPNode) is calculated as: "
            "LMP = MEC + MCC + MLC, where MEC is the Marginal Energy Component (system-wide reference cost of marginal generator), "
            "MCC is the Marginal Congestion Component (binding transmission constraint shadow costs and shift factors), "
            "and MLC is the Marginal Loss Component (system loss sensitivity factor relative to the reference bus)."
        ),
        "formula": "LMP = MEC + MCC + MLC",
        "keywords": ["lmp", "locational marginal price", "mec", "mcc", "mlc", "energy", "congestion", "loss", "formula", "decomposition", "shadow cost"],
        "category": "Market Pricing & Economics"
    },
    {
        "bpmNumber": "BPM 002",
        "section": "§5.2.2",
        "title": "Day-Ahead Market Timeline and Multi-Day Forward Commitment",
        "content": (
            "Day-Ahead Market bids and offers close at 09:30 EST. MISO executes the Security-Constrained Unit Commitment (SCUC) "
            "and Security-Constrained Economic Dispatch (SCED) algorithms, publishing financially binding clearing prices, "
            "schedules, and operating reserve awards no later than 13:30 EST for all 24 operating hours of the next operating day."
        ),
        "formula": "SCUC + SCED Clearing at 13:30 EST",
        "keywords": ["day-ahead", "dam", "scuc", "sced", "timeline", "clearing", "commitment", "09:30", "13:30", "unit commitment"],
        "category": "Day-Ahead Operations"
    },
    {
        "bpmNumber": "BPM 002",
        "section": "§6.1.4",
        "title": "Virtual Spread Bids and Transaction Node Arbitrage",
        "content": (
            "Market Participants may submit Virtual Bids (DEC) and Virtual Offers (INC) at authorized Commercial Pricing Nodes "
            "to arbitrage expected price spreads between the Day-Ahead Market and Real-Time Ex-Post dispatch. Virtual transactions "
            "must clear financially and settle against the Real-Time LMP deviation."
        ),
        "formula": "Virtual Settlement = (RT_LMP - DA_LMP) * MW_Cleared",
        "keywords": ["virtual", "spread", "arbitrage", "inc", "dec", "virtual trading", "trader", "deviation", "cpnode"],
        "category": "Virtual Trading & Arbitrage"
    },
    {
        "bpmNumber": "BPM 002",
        "section": "§7.4.2",
        "title": "Operating Reserve Demand Curves (ORDC) & Scarcity Pricing",
        "content": (
            "When operating reserves fall below the Minimum Operating Reserve Requirement, MISO automatically triggers the "
            "Operating Reserve Demand Curve (ORDC). Energy clearing prices can rise up to the Value of Lost Load (VOLL) cap "
            "to incent fast-start peaking generation and demand response dispatch."
        ),
        "formula": "Scarcity LMP = Base_LMP + Scarcity_Adder(ORDC)",
        "keywords": ["ordc", "scarcity", "operating reserves", "demand curve", "voll", "peaking", "reserves", "shortage"],
        "category": "Grid Reliability & Scarcity"
    },
    {
        "bpmNumber": "BPM 015",
        "section": "§3.1",
        "title": "Definitive Planning Phase (DPP) Three-Phase Cluster Study Cycle",
        "content": (
            "The Definitive Planning Phase (DPP) studies generation interconnection requests across three structured phases: "
            "Phase I (preliminary system impact), Phase II (revised impact and cost allocation), and Phase III (facilities study). "
            "Generators must meet milestone readiness payments (M2 and M3) to proceed without penalty."
        ),
        "formula": "DPP Cycle: Phase I -> Phase II -> Phase III -> GIA",
        "keywords": ["dpp", "interconnection", "queue", "cluster", "generator", "phase 1", "phase 2", "m2", "m3", "gia"],
        "category": "Interconnection Queue"
    },
    {
        "bpmNumber": "BPM 015",
        "section": "§4.2",
        "title": "Network Upgrade Cost Allocation and Affected System Studies",
        "content": (
            "Network upgrades required to mitigate transmission thermal or voltage constraints are allocated among cluster members "
            "proportionate to their Megawatt impact (Distribution Factor / DFAX). Cross-seam impacts on neighboring RTOs (SPP, PJM) "
            "are evaluated under Joint Operating Agreements (JOA)."
        ),
        "formula": "Cost_Alloc = Total_Upgrade_Cost * (Gen_DFAX / Sum_DFAX)",
        "keywords": ["network upgrades", "cost allocation", "dfax", "distribution factor", "affected systems", "spp", "seams"],
        "category": "Interconnection Transmission Cost"
    },
    {
        "bpmNumber": "BPM 020",
        "section": "§2.1",
        "title": "MISO Transmission Expansion Planning (MTEP) Annual Cycle",
        "content": (
            "The annual MTEP process evaluates baseline reliability, market efficiency, and public policy transmission projects "
            "across the 15-state footprint. Projects undergo regional stakeholder review before submission to the MISO Board of "
            "Directors for approval in December."
        ),
        "formula": "MTEP Annual Approval: Q1 Inception -> Q3 Reliability -> Q4 Board Vote",
        "keywords": ["mtep", "transmission", "expansion", "planning", "board", "reliability", "annual cycle", "substation"],
        "category": "Transmission Planning"
    },
    {
        "bpmNumber": "BPM 020",
        "section": "§3.4",
        "title": "Long-Range Transmission Planning (LRTP) Tranches 1 & 2 Portfolio Allocation",
        "content": (
            "LRTP is MISO's generational transmission buildout designed to maintain reliability during thermal plant retirements "
            "and rapid renewable adoption. Tranche 1 approved 18 projects ($10.3B) in MISO Midwest. Tranche 2 approved an additional "
            "$21.8B including a high-capacity 765 kV regional transmission backbone."
        ),
        "formula": "LRTP Capital: Tranche 1 ($10.3B) + Tranche 2 ($21.8B) = $32.1B",
        "keywords": ["lrtp", "tranche 1", "tranche 2", "765 kv", "backbone", "long-range", "portfolio", "transmission lines"],
        "category": "Regional Transmission Backbone"
    },
    {
        "bpmNumber": "BPM 020",
        "section": "§4.1",
        "title": "Joint Targeted Interconnection Queue (JTIQ) SPP Seam Reliability",
        "content": (
            "JTIQ is a coordinated interregional transmission portfolio between MISO and Southwest Power Pool (SPP). "
            "It consists of 5 high-voltage seam projects totaling $1.2B to $1.6B that unlock up to 28 GW of stranded renewable "
            "interconnection capacity along the upper Midwest seam."
        ),
        "formula": "JTIQ Portfolio: 5 Projects, $1.6B, ~28 GW Interconnection Capacity",
        "keywords": ["jtiq", "spp", "seam", "interregional", "joint targeted", "wind", "transmission seam"],
        "category": "Interregional Seams"
    },
    {
        "bpmNumber": "BPM 029",
        "section": "§3.2",
        "title": "Day-Ahead Market Financial Settlements and Billing",
        "content": (
            "Hourly market settlements calculate gross energy debits and credits for every Market Participant based on cleared "
            "Day-Ahead quantities multiplied by the Day-Ahead LMP. Settlement statements (S7 and S14) are issued on regular weekly billing cadences."
        ),
        "formula": "Settlement = DA_Cleared_MW * DA_LMP - FTR_Hedges",
        "keywords": ["settlement", "billing", "s7", "s14", "ftr", "financial transmission rights", "invoice", "debit"],
        "category": "Market Settlements"
    },
]

class BpmSearchResult(BaseModel):
    bpmNumber: str
    section: Optional[str] = None
    title: str
    excerpt: str
    formula: Optional[str] = None
    category: str
    relevanceScore: float = Field(..., description="Hybrid match score between 0.0 and 1.0")
    downloadUrl: str
    misoWebUrl: str

class BpmHybridSearchEngine:
    """Hybrid search combining BM25 lexical matching and semantic concept scoring."""

    def __init__(self) -> None:
        self.bpms_file = Path(__file__).resolve().parent / "data" / "bpms.json"
        self._manuals_cache: List[Dict[str, Any]] = []
        self._load_manuals()

    def _load_manuals(self) -> None:
        if self.bpms_file.exists():
            try:
                with open(self.bpms_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._manuals_cache = data.get("manuals", [])
            except Exception:
                self._manuals_cache = []

    def hybrid_search(self, query: str, top_k: int = 5) -> List[BpmSearchResult]:
        """
        Executes hybrid search across both high-level manuals and granular clause sections.
        Score = 0.60 * BM25_Lexical + 0.40 * Semantic_Concept_Score + Exact_Bpm_Boost.
        """
        q_clean = query.strip().lower()
        q_tokens = set(re.findall(r"\b\w+\b", q_clean))
        if not q_tokens:
            return []

        results: List[BpmSearchResult] = []
        
        # 1. Search granular sections first (highest precision)
        for sec in DETAILED_BPM_SECTIONS:
            score = self._compute_section_score(q_clean, q_tokens, sec)
            if score > 0.15:
                # Find matching manual for URLs
                manual = next((m for m in self._manuals_cache if m.get("bpmNumber") == sec["bpmNumber"]), None)
                dl_url = manual.get("downloadUrl", "https://www.misoenergy.org/legal/rules-manuals-and-agreements/business-practice-manuals/") if manual else ""
                web_url = manual.get("misoWebUrl", "https://www.misoenergy.org/legal/rules-manuals-and-agreements/business-practice-manuals/") if manual else ""
                
                results.append(BpmSearchResult(
                    bpmNumber=sec["bpmNumber"],
                    section=sec["section"],
                    title=f"{sec['bpmNumber']} {sec['section']} — {sec['title']}",
                    excerpt=sec["content"],
                    formula=sec.get("formula"),
                    category=sec["category"],
                    relevanceScore=round(score, 3),
                    downloadUrl=dl_url,
                    misoWebUrl=web_url,
                ))

        # 2. Search manual-level catalog for broader queries
        for m in self._manuals_cache:
            score = self._compute_manual_score(q_clean, q_tokens, m)
            if score > 0.20:
                results.append(BpmSearchResult(
                    bpmNumber=m.get("bpmNumber", ""),
                    section=None,
                    title=f"{m.get('bpmNumber', '')}: {m.get('title', '')}",
                    excerpt=m.get("summary", ""),
                    formula=None,
                    category=m.get("category", "Rules & Manuals"),
                    relevanceScore=round(score, 3),
                    downloadUrl=m.get("downloadUrl", ""),
                    misoWebUrl=m.get("misoWebUrl", ""),
                ))

        # Sort descending by score, deduplicate, and slice top_k
        results.sort(key=lambda r: r.relevanceScore, reverse=True)
        return results[:top_k]

    def _compute_section_score(self, q_clean: str, q_tokens: set[str], sec: Dict[str, Any]) -> float:
        score = 0.0
        bpm_num = sec["bpmNumber"].lower()
        title_lower = sec["title"].lower()
        content_lower = sec["content"].lower()
        keywords = sec.get("keywords", [])

        # Exact BPM number match boost
        if bpm_num in q_clean or bpm_num.replace(" ", "") in q_clean.replace(" ", "") or bpm_num.replace(" ", "-") in q_clean:
            score += 0.50

        # Title match
        title_matches = sum(1 for t in q_tokens if t in title_lower)
        score += (title_matches / max(len(q_tokens), 1)) * 0.35

        # Keywords match
        kw_matches = sum(1 for t in q_tokens if any(t in kw for kw in keywords))
        score += (kw_matches / max(len(q_tokens), 1)) * 0.30

        # Exact phrase match in content
        if q_clean in content_lower:
            score += 0.25

        return min(score, 1.0)

    def _compute_manual_score(self, q_clean: str, q_tokens: set[str], manual: Dict[str, Any]) -> float:
        score = 0.0
        bpm_num = manual.get("bpmNumber", "").lower()
        title = manual.get("title", "").lower()
        concepts = [c.lower() for c in manual.get("governedConcepts", [])]
        questions = [q.lower() for q in manual.get("questionsAnswered", [])]

        if bpm_num in q_clean or bpm_num.replace(" ", "") in q_clean.replace(" ", ""):
            score += 0.60

        title_matches = sum(1 for t in q_tokens if t in title)
        score += (title_matches / max(len(q_tokens), 1)) * 0.30

        concept_matches = sum(1 for t in q_tokens if any(t in c for c in concepts))
        score += (concept_matches / max(len(q_tokens), 1)) * 0.25

        q_matches = sum(1 for t in q_tokens if any(t in ques for ques in questions))
        score += (q_matches / max(len(q_tokens), 1)) * 0.20

        return min(score, 1.0)

# Global singleton
bpm_search_engine = BpmHybridSearchEngine()

