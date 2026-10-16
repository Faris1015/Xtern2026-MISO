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
import asyncio
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse

# Load environment variables
load_dotenv()

from search_engine import (
    search_engine,
    SearchResponse,
    SessionPrefetchResponse,
    ComparisonResponse,
)
from data_manager import data_manager
from miso_client import miso_client
from llm_service import llm_service
from pdf_generator import generate_market_briefing_pdf
from observability import metrics_registry
from data_validator import data_validator, AuditReport
from bpm_service import bpm_search_engine, BpmSearchResult
from auth_middleware import auth_manager, EntraUser
from pydantic import BaseModel, Field

app = FastAPI(
    title="MISO OmniSearch API",
    description="Intelligent navigation, session pre-fetching, comparative knowledge, and publication-ready reporting for MISO public energy data.",
    version="1.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

@app.middleware("http")
async def observability_and_correlation_middleware(request: Request, call_next):
    """Captures request duration, increments Prometheus counters, and injects X-Correlation-ID."""
    correlation_id = request.headers.get("x-correlation-id") or str(uuid.uuid4())
    start_time = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start_time
    response.headers["X-Correlation-ID"] = correlation_id
    response.headers["X-Response-Time-Ms"] = f"{duration * 1000.0:.2f}"
    metrics_registry.record_request(
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code,
        duration_sec=duration
    )
    return response

# ---------------------------------------------------------------------------
# Request & Response Models
# ---------------------------------------------------------------------------
class SwitchRoleRequest(BaseModel):
    role: str = Field("MISO.PowerTrader", description="'MISO.PowerTrader' | 'MISO.CoOpMember' | 'MISO.StateRegulator' | 'MISO.Public' | 'MISO.Admin'")

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
    provider: Optional[str] = "deterministic"


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
SwitchRoleRequest.model_rebuild()



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
        "version": "1.1.0",
        "misoIntegration": miso_client.get_api_status(),
        "llmProvider": llm_service.get_provider_status(),
        "endpoints": {
            "search": "/api/search?q={query}&persona={persona}",
            "sessionPrefetch": "/api/session-prefetch",
            "compare": "/api/compare?type={hubs|fuels|plans}&items={id1,id2}",
            "glossary": "/api/glossary",
            "bpms": "/api/bpms",
            "bpmSearch": "/api/bpms/search?q={query}",
            "gridTelemetry": "/api/grid-telemetry",
            "telemetryStream": "/api/stream/telemetry",
            "dataQualityAudit": "/api/data-quality/audit",
            "authMe": "/api/auth/me",
            "switchRole": "POST /api/auth/switch-role",
            "misoStatus": "/api/miso-status",
            "llmStatus": "/api/llm/status",
            "healthz": "/healthz",
            "readyz": "/readyz",
            "metrics": "/metrics",
            "feedback": "/api/feedback",
            "generateBriefing": "POST /api/generate-briefing",
            "documentation": "/docs",
        },
    }


@app.get(
    "/api/llm/status",
    summary="LLM Provider Connectivity & Model Status",
    description="Returns live status of the dual-engine AI system: Ollama (local on-premise) and Google Gemini (cloud).",
    tags=["LLM Intelligence"],
)
async def api_llm_status() -> Dict[str, Any]:
    return llm_service.get_provider_status()


@app.post(
    "/api/llm/reload",
    summary="Hot-Reload LLM Provider Configuration",
    description="Reloads .env configuration and re-probes local Ollama and Gemini endpoints without server downtime.",
    tags=["LLM Intelligence"],
)
async def api_llm_reload() -> Dict[str, Any]:
    llm_service.reload_config()
    return {
        "status": "reloaded",
        "llmProvider": llm_service.get_provider_status(),
    }


@app.get(
    "/api/miso-status",
    summary="MISO API Key & Live Operations Status",
    description="Returns live connection state to MISO public operations and Azure APIM Data Exchange portal.",
    tags=["MISO Integration"],
)
async def api_miso_status() -> Dict[str, Any]:
    return miso_client.get_api_status()


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
    "/api/bpms",
    summary="List All MISO Business Practice Manuals (BPMs)",
    description="Returns the authoritative directory of all 20+ MISO Business Practice Manuals, effective dates, questions answered, and CDN download links.",
    tags=["BPM Rulebooks"],
)
async def api_bpms() -> Dict[str, Any]:
    manuals = data_manager.get_all_bpms()
    return {
        "count": len(manuals),
        "source": "https://www.misoenergy.org/legal/rules-manuals-and-agreements/business-practice-manuals/",
        "manuals": manuals,
    }


@app.get(
    "/api/bpms/search",
    response_model=List[BpmSearchResult],
    summary="Hybrid Semantic RAG Search across MISO Business Practice Manuals",
    description="Queries 20+ MISO Business Practice Manuals with BM25 token matching, semantic concept scoring, and section formula citations.",
    tags=["BPM Rulebooks"],
)
async def api_bpms_search(
    q: str = Query(..., description="Query for manual rules, section clauses, or formulas (e.g. 'LMP formula', 'DPP cluster cycle', 'BPM 002')"),
    top_k: int = Query(5, ge=1, le=20, description="Max sections/manuals to return"),
) -> List[BpmSearchResult]:
    return bpm_search_engine.hybrid_search(query=q, top_k=top_k)


@app.get(
    "/api/bpms/{identifier}",
    summary="Get Specific MISO Business Practice Manual",
    description="Returns detailed metadata, questions answered, governed concepts, and official download URL for a specific BPM (e.g. '002', 'BPM 002', or 'BPM-020').",
    tags=["BPM Rulebooks"],
)
async def api_bpm_detail(identifier: str) -> Dict[str, Any]:
    bpm = data_manager.get_bpm(identifier)
    if not bpm:
        raise HTTPException(status_code=404, detail=f"Business Practice Manual '{identifier}' not found.")
    return bpm


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


# ---------------------------------------------------------------------------
# Idea 2: Cloud-Native Observability & Kubernetes Probes
# ---------------------------------------------------------------------------

@app.get(
    "/healthz",
    summary="Kubernetes Liveness Probe",
    description="Returns process liveness and uptime status for container orchestrators (AKS / K8s).",
    tags=["Observability & SRE"],
)
async def api_healthz() -> Dict[str, Any]:
    return metrics_registry.get_liveness()


@app.get(
    "/readyz",
    summary="Kubernetes Readiness Probe",
    description="Verifies operational readiness of upstream MISO public feeds, internal data layers, and AI inference engines.",
    tags=["Observability & SRE"],
)
async def api_readyz() -> Dict[str, Any]:
    miso_stat = miso_client.get_api_status()
    bpms = data_manager.get_all_bpms()
    result = metrics_registry.get_readiness(
        miso_status=miso_stat,
        data_ready=len(bpms) > 0,
        llm_ready=llm_service.enabled,
    )
    if result["statusCode"] != 200:
        raise HTTPException(status_code=503, detail=result)
    return result


@app.get(
    "/metrics",
    summary="Prometheus Metrics Exposition",
    description="Exports HTTP request counts, durations, cache hits/misses, and grounding firewall stats in Prometheus 0.0.4 text format.",
    tags=["Observability & SRE"],
)
async def api_metrics() -> Response:
    text = metrics_registry.generate_prometheus_text()
    return Response(content=text, media_type="text/plain; version=0.0.4; charset=utf-8")


# ---------------------------------------------------------------------------
# Idea 1: Live Real-Time Telemetry via Server-Sent Events (SSE)
# ---------------------------------------------------------------------------

@app.get(
    "/api/stream/telemetry",
    summary="Real-Time Grid Telemetry Stream (Server-Sent Events)",
    description="Streams live 5-minute fuel mix, system demand ticks, and active advisory alerts to connected clients without HTTP polling.",
    tags=["Grid Telemetry"],
)
async def api_stream_telemetry(request: Request):
    async def event_generator():
        metrics_registry.increment_sse_connections()
        try:
            user = auth_manager.authenticate_headers(dict(request.headers))
            init_payload = {
                "connectionId": str(uuid.uuid4()),
                "status": "connected",
                "cadence": "5-minute live updates",
                "clientRole": user.primaryRole,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
            yield f"event: connect\ndata: {json.dumps(init_payload)}\n\n"

            while True:
                if await request.is_disconnected():
                    break

                telemetry = data_manager.get_grid_telemetry()
                fuel_peaks = data_manager.get_fuel_peaks()
                stream_payload = {
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "demandMw": telemetry.get("currentDemandMw", 88450),
                    "formattedDemand": telemetry.get("formattedDemand", "88,450 MW"),
                    "forecastPeakMw": telemetry.get("forecastPeakMw", 102300),
                    "marginalEnergyCost": telemetry.get("marginalEnergyCost", "$32.40/MWh"),
                    "advisoryStatus": telemetry.get("advisoryStatus", "Normal Grid Operations"),
                    "generationMix": fuel_peaks.get("generationMix", [])[:5],
                    "totalGenerationMw": fuel_peaks.get("totalMw", 91200),
                    "isLive": fuel_peaks.get("isLive", True),
                    "dataSource": fuel_peaks.get("dataSource", "live_miso_public_api"),
                }
                yield f"event: telemetry\ndata: {json.dumps(stream_payload)}\n\n"
                await asyncio.sleep(5)
        except asyncio.CancelledError:
            pass
        finally:
            metrics_registry.decrement_sse_connections()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# Idea 3: Data Contract & Market Anomaly Detection Firewall
# ---------------------------------------------------------------------------

@app.get(
    "/api/data-quality/audit",
    response_model=AuditReport,
    summary="Data Contract & Physical Conservation Audit",
    description="Audits active feeds against LMP conservation (MEC+MCC+MLC), fuel mass balance, and scans for market anomalies.",
    tags=["Data Governance & Contracts"],
)
async def api_data_quality_audit() -> AuditReport:
    market_hubs = data_manager.get_all_hubs()
    fuel_peaks = data_manager.get_fuel_peaks()
    grid_telemetry = data_manager.get_grid_telemetry()
    return data_validator.run_audit(
        market_hubs=market_hubs,
        fuel_peaks=fuel_peaks,
        live_telemetry=grid_telemetry,
    )


# ---------------------------------------------------------------------------
# Idea 5: Azure Entra ID (OAuth2/OIDC) & RBAC Persona Middleware
# ---------------------------------------------------------------------------

@app.get(
    "/api/auth/me",
    response_model=EntraUser,
    summary="Azure Entra ID User Identity & RBAC Permissions",
    description="Returns current authenticated user identity, Entra ID tenant, mapped persona, and permissions.",
    tags=["Enterprise Identity & RBAC"],
)
async def api_auth_me(request: Request) -> EntraUser:
    return auth_manager.authenticate_headers(dict(request.headers))


@app.post(
    "/api/auth/switch-role",
    response_model=EntraUser,
    summary="Switch Active Simulated Entra ID Role (Dev & Demo)",
    description="Simulates switching user role in Microsoft Entra ID between Trader, Co-op, Regulator, Public, or Admin.",
    tags=["Enterprise Identity & RBAC"],
)
async def api_auth_switch_role(body: SwitchRoleRequest) -> EntraUser:
    auth_manager.set_simulated_role(body.role)
    return auth_manager.authenticate_headers({})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
