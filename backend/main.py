"""
MISO OmniSearch - FastAPI Application Entry Point
High-speed asynchronous REST API powering the 360 Knowledge Canvas,
Session-Aware Pre-Fetching, Multi-Hub Comparison Engine, and 1-Click PDF Generation.
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
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
from llm_service import llm_service
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
# Request & Response Models
# ---------------------------------------------------------------------------
class BriefingRequest(BaseModel):
    hub_id: str = Field("INDIANA.HUB", description="Target commercial hub (e.g. 'INDIANA.HUB', 'MICHIGAN.HUB')")
    custom_title: Optional[str] = Field(None, description="Optional custom document title")
    audience_mode: str = Field("Power Trader", description="Persona mode: 'Power Trader', 'Municipal Co-op', 'Public / Media', 'State Regulator'")


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class CanvasChatRequest(BaseModel):
    message: str = Field(..., description="User follow-up question regarding active canvas data")
    canvasContext: Dict[str, Any] = Field(..., description="Active dataset payload and KPIs from 360 Canvas")
    persona: str = Field("Power Trader", description="Active audience persona")
    history: Optional[List[ChatMessage]] = Field(default_factory=list, description="Recent conversation turns")


class CanvasChatResponse(BaseModel):
    response: str
    citations: List[str]
    suggestedFollowUps: List[str]
    isAiGenerated: bool


class FeedbackRequest(BaseModel):
    category: str = Field("general", description="'bug' | 'data_inaccuracy' | 'feature_request' | 'general'")
    rating: Optional[int] = Field(None, ge=1, le=5, description="1-5 satisfaction rating")
    message: str = Field(..., min_length=2, description="Feedback message content")
    persona: Optional[str] = Field("Power Trader", description="Active audience persona")
    queryContext: Optional[str] = Field(None, description="Query context or canvas topic")
    userEmail: Optional[str] = Field(None, description="Optional user email")


class FeedbackResponse(BaseModel):
    status: str
    feedbackId: str
    message: str
    timestamp: str


# Ensure Pydantic v2 type annotations are fully resolved
ChatMessage.model_rebuild()
CanvasChatRequest.model_rebuild()
CanvasChatResponse.model_rebuild()
BriefingRequest.model_rebuild()
FeedbackRequest.model_rebuild()
FeedbackResponse.model_rebuild()



# ---------------------------------------------------------------------------
# CORS Configuration (Local development & Production)
# ---------------------------------------------------------------------------
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
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
            "glossary": "/api/glossary",
            "generateBriefing": "POST /api/generate-briefing",
            "documentation": "/docs",
        },
    }


@app.get(
    "/api/glossary",
    summary="MISO Glossary & Acronym Dictionary (Single Source of Truth)",
    description="Returns the authoritative dictionary of MISO acronyms, plain-language ELI5 explanations, and technical definitions.",
    tags=["Glossary"],
)
async def api_glossary() -> Dict[str, Any]:
    return data_manager.get_all_glossary_terms()


@app.get(
    "/api/glossary/{term}",
    summary="Get Single Glossary Acronym/Term",
    description="Returns details and explanations for a specific MISO acronym or term.",
    tags=["Glossary"],
)
async def api_glossary_term(term: str) -> Dict[str, Any]:
    entry = data_manager.get_glossary_term(term)
    if not entry:
        raise HTTPException(status_code=404, detail=f"Glossary term '{term}' not found.")
    return entry


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
    "/api/grid-telemetry",
    summary="Real-Time Grid Telemetry & Operating Conditions",
    description="Returns live system snapshot (Demand, Forecast Peak, Marginal Energy Cost, Imports/Exports, and Advisory Status).",
    tags=["Grid Telemetry"],
)
async def api_grid_telemetry() -> Dict[str, Any]:
    return data_manager.get_grid_telemetry()


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
    "/api/canvas-chat",
    response_model=CanvasChatResponse,
    summary="Chat with this Canvas (Copilot Q&A)",
    description="Allows users to ask conversational follow-up questions about the chart and metrics currently displayed on the 360° Knowledge Canvas.",
    tags=["Canvas Copilot"],
)
async def api_canvas_chat(body: CanvasChatRequest) -> CanvasChatResponse:
    if not body.message or not body.message.strip():
        raise HTTPException(status_code=400, detail="Message parameter cannot be empty.")

    history_dicts = [{"role": m.role, "content": m.content} for m in body.history] if body.history else []
    result = llm_service.chat_with_canvas(
        message=body.message.strip(),
        canvas_context=body.canvasContext,
        persona=body.persona,
        history=history_dicts,
    )
    return CanvasChatResponse(**result)



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


@app.post(
    "/api/feedback",
    summary="Submit User Feedback to Engineering Team",
    description="Captures user feedback, bug reports, data inaccuracies, and feature suggestions for the engineering maintenance team.",
    tags=["Feedback"],
)
async def api_submit_feedback(body: FeedbackRequest) -> FeedbackResponse:
    feedback_file = Path(__file__).resolve().parent / "data" / "user_feedback.json"
    feedback_file.parent.mkdir(parents=True, exist_ok=True)

    entries = []
    if feedback_file.exists():
        try:
            with open(feedback_file, "r", encoding="utf-8") as f:
                entries = json.load(f)
        except Exception:
            entries = []

    feedback_id = f"FB-{int(time.time())}-{len(entries) + 1}"
    record = {
        "id": feedback_id,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "category": body.category,
        "rating": body.rating,
        "message": body.message,
        "persona": body.persona,
        "queryContext": body.queryContext,
        "userEmail": body.userEmail,
    }
    entries.append(record)

    with open(feedback_file, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2)

    return FeedbackResponse(
        status="success",
        feedbackId=feedback_id,
        message="Thank you! Your feedback has been securely submitted to the MISO OmniSearch engineering team.",
        timestamp=record["timestamp"],
    )


@app.get(
    "/api/feedback",
    summary="List Recent Feedback Submissions",
    description="Returns recent feedback submissions for engineering inspection and maintenance monitoring.",
    tags=["Feedback"],
)
async def api_get_feedback(limit: int = Query(50, ge=1, le=200)) -> List[Dict[str, Any]]:
    feedback_file = Path(__file__).resolve().parent / "data" / "user_feedback.json"
    if not feedback_file.exists():
        return []
    try:
        with open(feedback_file, "r", encoding="utf-8") as f:
            entries = json.load(f)
        return entries[-limit:][::-1]
    except Exception:
        return []


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
