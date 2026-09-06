"""
MISO OmniSearch - FastAPI Application Entry Point
High-speed asynchronous REST API powering the 360 Knowledge Canvas,
Session-Aware Pre-Fetching, Multi-Hub Comparison Engine, and 1-Click PDF Generation.
"""

from __future__ import annotations

import time
from typing import Any, Dict, Optional
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from search_engine import (
    search_engine,
    SearchResponse,
    SessionPrefetchResponse,
    ComparisonResponse,
)
from data_manager import data_manager
from pdf_generator import generate_market_briefing_pdf
from pydantic import BaseModel, Field

app = FastAPI(
    title="MISO OmniSearch API",
    description="Intelligent navigation, session pre-fetching, comparative knowledge, and publication-ready reporting for MISO public energy data.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------
class BriefingRequest(BaseModel):
    hub_id: str = Field("INDIANA.HUB", description="Target commercial hub (e.g. 'INDIANA.HUB', 'MICHIGAN.HUB')")
    custom_title: Optional[str] = Field(None, description="Optional custom document title")
    audience_mode: str = Field("Power Trader", description="Persona mode: 'Power Trader', 'Municipal Co-op', 'Public / Media', 'State Regulator'")


# ---------------------------------------------------------------------------
# CORS Configuration (Local development & Production)
# ---------------------------------------------------------------------------
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
async def root() -> Dict[str, Any]:
    """Health check and API gateway status."""
    return {
        "service": "MISO OmniSearch Backend API",
        "status": "online",
        "version": "1.0.0",
        "endpoints": {
            "search": "/api/search?q={query}&persona={persona}",
            "sessionPrefetch": "/api/session-prefetch",
            "compare": "/api/compare?type={hubs|fuels|plans}&items={id1,id2}",
            "generateBriefing": "POST /api/generate-briefing",
            "documentation": "/docs",
        },
    }


@app.get(
    "/api/search",
    response_model=SearchResponse,
    summary="Natural Language OmniSearch Query",
    description="Searches MISO market datasets, real-time telemetry, transmission plans, and tariffs. Adapts narrative to persona.",
    tags=["OmniSearch"],
)
async def api_search(
    q: str = Query(..., description="Natural language search term (e.g. 'Indiana Hub LMP', 'Wind vs Solar peak', 'What is CONE?')"),
    persona: str = Query("Power Trader", description="Audience persona: 'Power Trader', 'Municipal Co-op', 'Public / Media', 'State Regulator'"),
) -> SearchResponse:
    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="Query parameter 'q' cannot be empty.")
    
    start_time = time.perf_counter()
    result = search_engine.search(query=q.strip(), persona=persona)
    latency_ms = (time.perf_counter() - start_time) * 1000
    # Add diagnostic headers if needed in middleware or response
    return result


@app.get(
    "/api/session-prefetch",
    response_model=SessionPrefetchResponse,
    summary="Session-Aware Pre-Fetching (Zero Cold-Start)",
    description="Returns pre-computed intelligence payload based on active browsing context to eliminate cold start latency.",
    tags=["Session Radar"],
)
async def api_session_prefetch() -> SessionPrefetchResponse:
    return search_engine.get_session_prefetch()


@app.get(
    "/api/compare",
    response_model=ComparisonResponse,
    summary="Multi-Hub / Multi-Fuel / Multi-Plan Comparison",
    description="Returns aligned multi-series records for synchronized Recharts graphing and side-by-side matrices.",
    tags=["Comparison Engine"],
)
async def api_compare(
    type: str = Query("hubs", description="Comparison type: 'hubs', 'fuels', or 'plans'"),
    items: str = Query("INDIANA.HUB,MICHIGAN.HUB", description="Comma-separated items or IDs to align"),
) -> ComparisonResponse:
    valid_types = ["hubs", "hub", "fuels", "fuel", "plans", "plan", "transmission"]
    if type.lower() not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid comparison type '{type}'. Allowed types: 'hubs', 'fuels', 'plans'.",
        )
    return search_engine.compare(compare_type=type, items_str=items)


@app.post(
    "/api/generate-briefing",
    summary="1-Click Publication-Ready PDF Briefing Generator",
    description="Generates a branded, 1-page MISO Market & Grid Fact Sheet PDF matching official styling in < 1 second.",
    tags=["PDF Briefing Studio"],
)
async def api_generate_briefing_post(
    body: BriefingRequest,
) -> Response:
    hub_id = body.hub_id.upper().strip()
    if not hub_id.endswith(".HUB"):
        hub_id = f"{hub_id}.HUB"

    pdf_bytes = generate_market_briefing_pdf(
        hub_id=hub_id,
        custom_title=body.custom_title,
        audience_mode=body.audience_mode,
    )
    filename = f"MISO_Briefing_{hub_id.replace('.HUB', '')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@app.get(
    "/api/generate-briefing",
    summary="1-Click PDF Briefing Download (Direct Link)",
    description="Direct GET endpoint for browser downloads of the 1-page PDF fact sheet.",
    tags=["PDF Briefing Studio"],
)
async def api_generate_briefing_get(
    hub_id: str = Query("INDIANA.HUB", description="Hub ID (e.g. 'INDIANA.HUB', 'MICHIGAN.HUB')"),
    custom_title: Optional[str] = Query(None, description="Optional custom title"),
    audience_mode: str = Query("Power Trader", description="Persona mode"),
) -> Response:
    req = BriefingRequest(hub_id=hub_id, custom_title=custom_title, audience_mode=audience_mode)
    return await api_generate_briefing_post(req)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
