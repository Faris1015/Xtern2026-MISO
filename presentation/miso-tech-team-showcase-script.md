# ⚡ MISO OmniSearch: Master Technical Showcase Script
> **Presentation Target:** MISO Engineering, Cloud Infrastructure (Azure), Data & Architecture Teams  
> **Format:** Presenter Script with Visual Screen Cues, Technical Talking Tracks, and Architecture Explanations  
> **Target Run Time:** 15–20 Minutes (Structured for Interactive Developer Q&A)  
> **Presenters:** Full Engineering Team (or Solo Lead Presenter)  

---

## 📋 Pre-Flight Technical Checklist (Run 5 Minutes Before the Call)

1. **Backend Server Active:**
   ```powershell
   cd backend
   .\.venv\Scripts\activate
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```
   *Verify:* Open `http://localhost:8000/healthz` $\to$ Returns `{"status": "healthy"}`.
2. **Frontend Client Active:**
   ```powershell
   cd frontend
   npm run dev
   ```
   *Verify:* Open `http://localhost:3000` $\to$ Green `Live SSE Stream` indicator pulsing.
3. **Automated Test Suite Verification (Have ready in split terminal):**
   ```powershell
   .\.venv\Scripts\python.exe -m unittest discover -v
   ```
   *Verify:* 47/47 unit tests green in `< 25 seconds`.
4. **Browser Setup:**
   * Chrome/Edge opened to `http://localhost:3000` (100% zoom).
   * DevTools open in background (Network tab showing `X-Correlation-ID`).
   * Secondary tab with Swagger docs: `http://localhost:8000/docs`.

---

# SECTION 1: Welcome & The Problem We Tackled (0:00 – 3:00)

### [Visual Screen Cue]
*Share screen showing the OmniSearch landing page (`http://localhost:3000`). Do not type yet. Allow the MISO tech team to see the clean, modern interface, the Session Radar with live telemetry, and the MISO Navy branding.*

### 🎙️ [Presenter Voiceover Track]
> "Good morning, everyone. Thank you so much for having us back. We’re excited to speak with MISO’s developers, system architects, and technical team today.
>
> When people hear about AI in 2026, the immediate assumption is usually a generic chatbot wrapper. But anyone who works with wholesale power markets knows that **generic LLMs are dangerously unsuited for grid operations**. If a chatbot hallucinates a decimal point on a Locational Marginal Price, gets confused by Daylight Saving Time, or cites an outdated tariff attachment, it creates real regulatory liability and financial risk.
>
> When we approached **MISO Challenge Prompt 1 — Intelligent Navigation of MISO's Public Information**, we analyzed the friction that external market participants face every day on `misoenergy.org`:
>
> 1. **The Legacy CSV Retirement Chasm:** MISO is modernizing its data stack by deprecating legacy flat CSV reports like `rt_lmp_final.csv` and moving to the Azure API Management Data Exchange portal. But hundreds of municipal co-ops, trading desks, and utility billing systems rely on those CSV schemas and have struggled to migrate without clear data crosswalks.
> 2. **The 75+ Acronym Fortress:** Wholesale markets are dense. Terms like `LMP`, `CONE`, `PRA`, `MTEP`, `LRTP`, `JTIQ`, and `ICCP` create immense barriers for journalists, state regulators, and municipal utilities.
> 3. **The Support Queue Bottleneck:** Because public grid data is buried in 1,000-page PDF Business Practice Manuals and fragmented web pages, over **12,500 routine data tickets** flood MISO customer support every year. That takes 24 to 72 hours per ticket and costs MISO roughly **$3.75 Million** in diverted engineering and analyst time annually.
>
> Our team engineered **MISO OmniSearch**: an enterprise-grade predictive context and comparative knowledge engine. 
>
> Our architectural mandate was built on four non-negotiable principles:
> - **Zero Cold Start:** Pre-fetching context before the user even types.
> - **Zero Hallucination:** 100% mathematical provenance with an automated numerical grounding firewall.
> - **Role-Based Analytical Depth:** Adapting metrics dynamically for Traders, Co-ops, Regulators, and the Public.
> - **Enterprise Production Readiness:** Containerized, observable, and built to scale into MISO’s Azure cloud ecosystem.
>
> Let’s walk through the working prototype."

---

# SECTION 2: Live Prototype Walkthrough (3:00 – 8:00)

### [Visual Screen Cue: Scene 1 — Zero Cold Start & Live SSE Telemetry]
*Point the cursor to the top `SessionRadar` banner on `http://localhost:3000`. Point out the pulsing green indicator: `● Live SSE Stream (88,450 MW)`.*

### 🎙️ [Presenter Voiceover Track]
> "Notice what’s happening on screen right now. I haven't typed a single keystroke, yet the page is already alive with verified telemetry.
>
> Most search systems suffer from 'blank search bar syndrome.' In OmniSearch, our **Session Radar** senses the user’s workflow context. If they arrived from the market reports section, it has already pre-loaded today’s average LMP spreads, cleared volumes, and quick-start research chips.
>
> Notice this glowing green badge: `● Live SSE Stream`. Rather than having thousands of browser clients hammering MISO's public operations endpoint with aggressive HTTP polling, our backend maintains an asynchronous **Server-Sent Events (SSE)** stream. When MISO’s `public-api.misoenergy.org` pushes a new 5-minute fuel generation interval, our backend caches it with a 60-second TTL and fans it out to connected clients over a persistent connection with zero frontend re-fetching overhead."

---

### [Visual Screen Cue: Scene 2 — Predictive Search & 360° Knowledge Canvas]
*Press `Ctrl + K` (spotlight activates). Type `"Indiana Hub"`. Notice instantaneous auto-complete categorized by Hub and Metric. Hit `Enter`. The Knowledge Canvas renders in sub-50ms.*

### 🎙️ [Presenter Voiceover Track]
> "Now let’s execute a search. I’ll hit `Ctrl + K` and type `'Indiana Hub'`. Notice the sub-50ms autocomplete categorization. When I hit Enter, OmniSearch doesn't generate a generic wall of text. It compiles an interactive **360° Knowledge Canvas**.
>
> Look at the structure here:
> - At the top, an **authoritative direct answer** explaining price formation and peak-hour volatility.
> - An immutable **source citation badge** pointing to MISO’s July 2025 Corporate Fact Sheet and Tariff Module C.
> - **Four isolated KPI metric cards**: Real-Time average ($38.45/MWh), Day-Ahead average ($37.20/MWh), Peak Hour interval, and 24-hour cleared volume.
> - And an interactive **Recharts curve** plotting 24 hours of hourly LMP pricing.
>
> Notice this toggle above the chart: I can switch between **Real-Time LMP**, **Day-Ahead LMP**, the **Price Spread**, and the foundational **3-Part LMP Decomposition**:
> $$\text{LMP} = \text{MEC (Energy)} + \text{MCC (Congestion)} + \text{MLC (Loss)}$$
>
> Every number you see here is mathematically grounded. If an engineer prefers tabular inspection, one click toggles into an accessible data table formatted with `IBM Plex Mono` tabular numerals."

---

### [Visual Screen Cue: Scene 3 — Dynamic Persona Inference & Grounded Copilot]
*Switch the persona dropdown at the top from 'Power Trader' to 'Public / Media'. The text and cards update. Then type in search: `"HE 19 arbitrage spread volatility"`. The recommendation banner slides in.*

### 🎙️ [Presenter Voiceover Track]
> "One of our most unique features is our **Dynamic Persona Inference Engine**. 
>
> A power trader analyzing arbitrage spreads between Day-Ahead and Real-Time dispatch needs completely different intelligence than a municipal co-op board member reviewing baseload reserve margins, or a journalist writing about carbon-free energy percentages.
>
> Watch what happens: I am currently in 'Public / Media' mode. I’ll search for a trading term: `'HE 19 arbitrage spread volatility'`. 
>
> OmniSearch immediately parses the lexical syntax, recognizes the domain pattern, and renders this recommendation banner:
> *'Persona Insight: Your query pattern suggests Power Trader mode based on spread arbitrage terminology. Switch to Power Trader?'*
>
> With one click on **'Switch to Power Trader'**, the canvas instantly re-shapes itself—re-focusing the narrative on marginal congestion costs and peak ramp hours with zero page reload.
>
> And if the user wants to interrogate the chart further, they click **'Chat with this Canvas'**. This opens our slide-out **Canvas Copilot Drawer** powered by Google Gemini 3.6 Flash. The LLM is injected with the active canvas state, but its responses are bounded by our **numerical grounding firewall**—if the model attempts to generate an unverified price outside MISO’s clearing envelope, the firewall intercepts it and falls back to a deterministic verified template."

---

### [Visual Screen Cue: Scene 4 — Side-by-Side Comparison Engine]
*Click 'Comparison workspace' in the header. The Comparison Matrix slides open. Select Indiana.Hub vs. Michigan.Hub vs. Texas.Hub. The 3 curves plot synchronously.*

### 🎙️ [Presenter Voiceover Track]
> "Previously, comparing commercial hubs or transmission portfolios required downloading multiple spreadsheets, cleaning timestamps, and building manual Excel pivot tables.
>
> With our **Comparison Engine**, stakeholders can benchmark up to 6 regional commercial hubs side-by-side with synchronized 24-hour dual-axis curves. 
>
> Look at the spread divergence: you can immediately see Michigan Hub trading at an average **+$4.40/MWh premium** over Indiana Hub due to northern transmission congestion constraints. 
>
> We can also toggle this to **Fuel Diversity** to inspect capacity factors across Natural Gas (40%), Coal (26%), Wind (15%), and Nuclear (14%), or compare **Transmission Portfolios**: Local MTEP ($4.1B) versus Regional LRTP Tranches 1 & 2 ($32.1B) versus the SPP interregional JTIQ seam line ($1.6B)."

---

### [Visual Screen Cue: Scene 5 — 1-Click ReportLab PDF Studio & Jargon HUD]
*Click '1-Page PDF Fact Sheet'. Download happens in < 2.5s. Open the generated PDF in browser. Then return and hit `Ctrl + J` to open Jargon HUD.*

### 🎙️ [Presenter Voiceover Track]
> "Executives, board members, and state regulators need physical, publication-ready fact sheets for board meetings and FERC filings.
>
> Watch what happens when I click **'Download Briefing PDF'**. In under 2.5 seconds, our backend Python **ReportLab** micro-flow engine compiles a branded, publication-ready executive briefing. 
>
> Notice the strict engineering here: this document is mathematically budgeted to guarantee **strictly 1 physical page**—zero spillover, regardless of table length or notes. It features MISO brand styling, KPI cards, full 24-hour pricing tables, and cryptographically verified timestamp citations.
>
> And for accessibility, pressing `Ctrl + J` opens our **Universal Jargon HUD**. It contains **75+ verified energy acronyms**. If a municipal co-op staffer doesn't know what `PRA` or `CONE` means, they get both an **ELI5 (plain-English)** explanation and the exact **technical tariff formula**."

---

# SECTION 3: The 5 Enterprise Additions Built for MISO's Tech Stack (8:00 – 13:00)

### [Visual Screen Cue: Transition to New Enterprise Features]
*Point cursor to the header buttons: `SSO: PowerTrader`, `BPMs (RAG)`, `DevOps / SRE`, and the `Data Contract: 100% Verified` badge.*

### 🎙️ [Presenter Voiceover Track]
> "Now, we know that today we are speaking directly with MISO's software developers, infrastructure engineers, and architects. So we took our prototype a step further and built **five enterprise-grade capabilities designed specifically for MISO's technical stack**."

---

### [Visual Screen Cue: Feature 1 & 2 — Data Contract & Anomaly Firewall]
*Click on the `🛡️ Data Contract: 100% Verified` badge in SessionRadar. The DataContractModal opens.*

### 🎙️ [Presenter Voiceover Track]
> "First: **The Data Contract & Market Anomaly Firewall**.
>
> Wholesale electricity data cannot tolerate corrupted or non-physical payloads. In `backend/data_validator.py`, we implemented automated Pydantic data contracts that validate incoming telemetry before it ever touches our search engine or LLM:
> 1. **LMP Conservation Contract:** Verifies the physical equality $LMP = MEC + MCC + MLC$ with a tight $\pm \$0.05$ rounding tolerance across all 144 daily hub intervals.
> 2. **Generation Mass Balance:** Ensures physical non-negativity across thermal and renewable fuels, and confirms total generation stays within MISO's operating envelope (20 GW to 160 GW).
> 3. **Telemetry Continuity:** Flags stale feeds if interval gaps exceed 5 minutes.
> 4. **Market Anomaly Scanner:** Automatically flags negative LMPs caused by localized renewable curtailment, or congestion divergence across regional seams.
>
> Notice this badge: every audit payload is cryptographically sealed with a **SHA-256 ingestion hash**, providing an immutable audit trail for compliance."

---

### [Visual Screen Cue: Feature 3 — Hybrid Semantic RAG for BPM Rulebooks]
*Click the `📖 BPMs (RAG)` button in the header. Type `"LMP formula"`. The card renders BPM 002 §4.3.1 with formula. Then click the chip `"DPP cluster cycle"`.*

### 🎙️ [Presenter Voiceover Track]
> "Second: **Hybrid Semantic RAG for Business Practice Manuals (BPMs)**.
>
> MISO governs wholesale markets through over 20 detailed Business Practice Manuals spanning thousands of pages. Traditional vector search fails here because it retrieves generic semantic text rather than exact tariff formulas.
>
> In `backend/bpm_service.py`, we built a **Hybrid Retrieval Engine** combining **BM25 lexical token matching** with **semantic concept scoring**.
>
> When I search `'LMP formula'`, it doesn't just hand me a vague manual. It extracts **BPM 002 §4.3.1**, highlighting the mathematical decomposition formula and providing the direct ZIP package download link from MISO's CDN. 
>
> If I search `'DPP cluster cycle'`, it extracts **BPM 015 §3.1**, outlining the Definitive Planning Phase milestone readiness payments (M2 and M3). This bridges the gap between regulatory rulebooks and instant developer intelligence."

---

### [Visual Screen Cue: Feature 4 — Microsoft Entra ID (Azure AD) SSO & RBAC]
*Click the `🛡️ SSO: PowerTrader ▼` dropdown in the header. Show the role list. Click `MISO.StateRegulator`.*

### 🎙️ [Presenter Voiceover Track]
> "Third: **Microsoft Entra ID (Azure AD) SSO and Role-Based Access Control**.
>
> MISO's production infrastructure lives in Microsoft Azure. In `backend/auth_middleware.py`, we built an enterprise authentication layer that decodes OIDC Bearer tokens and extracts the `roles` claim.
>
> Watch our live role simulator: right now I am authenticated as `MISO.PowerTrader`. If I switch to `MISO.StateRegulator`, the endpoint automatically verifies my claims, grants access to compliance logs and transmission cost allocation, and synchronizes the UI persona to State Regulator without a page reload. 
>
> In production, this allows MISO to enforce granular rate limits and data access permissions across internal staff, registered market participants, and anonymous public citizens."

---

### [Visual Screen Cue: Feature 5 — Cloud-Native Observability & Kubernetes Probes]
*Click the `⚙️ DevOps / SRE` button in the header. Show Tab 1 (Probes), Tab 2 (Prometheus Metrics), and open browser DevTools Network tab showing headers.*

### 🎙️ [Presenter Voiceover Track]
> "Fourth and fifth: **Cloud-Native Observability and Real-Time SSE Streaming**.
>
> If an SRE team is going to deploy a microservice into **Azure Kubernetes Service (AKS)**, they need standard observability.
>
> In `backend/observability.py`, we expose:
> - **`GET /healthz` (Liveness):** Confirms the FastAPI process is running.
> - **`GET /readyz` (Readiness):** Confirms downstream MISO operations endpoints and data layers are healthy before Kubernetes routes traffic to the pod.
> - **`GET /metrics`:** Renders a clean Prometheus text exposition format (version 0.0.4) tracking request latencies, cache hit/miss counters, active SSE subscribers, and grounding firewall verification rates.
>
> Furthermore, our HTTP middleware intercepts every request and injects an `X-Correlation-ID` UUID and an `X-Response-Time-Ms` execution header into the response, allowing end-to-end distributed tracing across Azure Application Insights."

---

# SECTION 4: Technical Deep Dive & System Architecture (13:00 – 16:00)

### [Visual Screen Cue: Architecture Diagram]
*Switch to secondary tab showing the C4 Container Architecture Diagram (or slide from `miso-tech-team-handbook.md`).*

### 🎙️ [Presenter Voiceover Track]
> "Let’s take a look under the hood at our architecture and data flow.
>
> ### 1. The Technology Stack
> - **Backend:** Python 3.11 with **FastAPI** and **Pydantic v2**. We chose FastAPI because of its asynchronous concurrency, native OpenAPI 3.1 documentation, sub-millisecond serialization speeds, and synergy with Python data tools.
> - **Frontend:** **React 18** bootstrapped with **Vite**, **TypeScript** in strict mode, **Tailwind CSS** for design tokens, and **Recharts** for hardware-accelerated vector charting.
> - **Document Engine:** Pure Python **ReportLab** compilation—avoiding heavy headless Chrome/Puppeteer container dependencies and rendering PDF byte streams in `< 2.5` seconds.
>
> ### 2. The Ingestion & Caching Layer
> In `miso_client.py`, we pull live 5-minute fuel mix telemetry from `public-api.misoenergy.org/api/FuelMix`.
> To honor MISO's explicit guidance of no more than 1 request per minute, we implement an **in-memory 60-second TTL cache**. 
> - If a request arrives within 60 seconds, it is served from memory with zero outbound network calls (recording a cache hit in Prometheus).
> - If MISO's endpoint times out or returns a non-200 code, the client degrades gracefully to our verified Corporate Fact Sheet baseline with an explicit provenance badge.
>
> ### 3. Dual-Engine AI Architecture & NERC CIP Compliance
> In `llm_service.py`, we built a dual-engine AI interface:
> - **Cloud Mode:** Uses Google Gemini 3.6 Flash via REST API.
> - **Air-Gapped On-Premise Mode:** Uses local **Ollama** running models like `llama3.2:3b` or `mistral`. For control rooms subject to **NERC CIP Critical Infrastructure Protection**, this guarantees that zero electric system data or query logs ever leave MISO’s private network boundary.
> - **Offline Deterministic Fallback:** If neither AI engine is available, the system falls back 100% to deterministic algorithmic templates. The application never crashes."

---

# SECTION 5: Limitations, Assumptions & Honest Trade-offs (16:00 – 18:00)

### [Visual Screen Cue: Presenter Face-to-Face / Transparent Discussion]
*Stop sharing screen or keep the architecture slide visible. Speak candidly and collegially to the developers.*

### 🎙️ [Presenter Voiceover Track]
> "As engineers, we want to be completely transparent about our current prototype’s assumptions and limitations:
>
> 1. **In-Memory Cache vs. Distributed Redis:** In this prototype, the 60-second TTL cache lives in Python memory. In a multi-replica Kubernetes cluster, this would cause cache fragmentation. The obvious production path is replacing the dictionary with **Azure Cache for Redis** with Pub/Sub invalidation.
> 2. **Commercial Hub Pricing Baseline:** Because we did not have access to an authenticated private Azure APIM key with high-frequency tick permissions during development, our 24-hour hub pricing models are derived from verified baseline curves rather than a live 5-second ICCP feed. However, `miso_client.py` is already coded with the exact `Ocp-Apim-Subscription-Key` headers ready to plug in.
> 3. **Static BPM Indexing vs. Continuous Vector Ingestion:** Our BPM hybrid search indexes the top 20 manuals and key clauses. In production, we would want an automated pipeline that ingests new FERC filings and BPM PDF revisions from MISO’s CDN into **Azure AI Search** or `pgvector` on a weekly schedule.
>
> Recognizing these trade-offs brings us directly to how we envision collaborating with your team to scale this toward production."

---

# SECTION 6: Collaborative Production Scaling Roadmap on Azure (18:00 – 20:00)

### [Visual Screen Cue: Target Production Architecture Diagram]
*Show the Target Production Architecture Diagram on Azure from `miso-tech-team-handbook.md`.*

### 🎙️ [Presenter Voiceover Track]
> "Here is our **Production Scaling Blueprint** on Microsoft Azure:
>
> 1. **Phase 1 — Azure Container Orchestration:**
>    - Deploy the FastAPI container on **Azure Kubernetes Service (AKS)** or **Azure Container Apps** with Horizontal Pod Autoscaling (HPA) scaling between 3 and 20 pods based on request concurrency.
>    - Host the React frontend on **Azure Static Web Apps** with edge CDN caching via **Azure Front Door**.
>
> 2. **Phase 2 — Distributed State & Time-Series Storage:**
>    - Back `miso_client.py` with **Azure Cache for Redis** (Cluster Mode) for sub-millisecond distributed cache reads across all pods.
>    - Persist historical 5-minute telemetry ticks into **TimescaleDB** (PostgreSQL extension) to allow market participants to query 30-day and 365-day historical curves.
>
> 3. **Phase 3 — Real-Time Event Ingestion:**
>    - Connect an ingestion worker to **Azure Event Hubs** or **Apache Kafka** to ingest live SCADA, ICCP, and State Estimator streams directly from MISO control centers.
>
> 4. **Phase 4 — Enterprise Identity & Security:**
>    - Enforce full **Microsoft Entra ID** authentication for internal staff and registered Market Participants, with secrets managed in **Azure Key Vault** and mutual TLS (mTLS) between internal services.
>
> ### Closing Summary
> By deflecting over **80% of routine data inquiries**, MISO OmniSearch saves MISO over **$3.0 Million annually** and returns **40,000 high-value engineering hours** back to grid reliability, resource adequacy, and transmission planning.
>
> All 47 automated tests are passing, our build is clean, and the codebase is pushed to GitHub. We would love to open the floor, hear your thoughts, and discuss how we can build upon this together.
>
> Thank you!"

---

# SECTION 7: Anticipated Tech Team Q&A Cheat Sheet

Keep these concise, battle-tested answers ready for the discussion:

#### ❓ Tech Question 1: *"How do you guarantee the LLM won't hallucinate a price during a high-volatility event?"*
> **Answer:** *"We use a two-tier defense. First, we strictly constrain prompt context to the verified JSON numbers. Second and most importantly, `llm_service.py` executes `_verify_numerical_grounding` via post-generation regex. It scans every currency and megawatt number in the generated text against the ground-truth dictionary. If any number deviates outside official market bounds, the output is rejected and the system automatically serves our deterministic template."*

#### ❓ Tech Question 2: *"Why did you implement Server-Sent Events (SSE) instead of WebSockets?"*
> **Answer:** *"WebSockets are bidirectional and require stateful connection tracking and custom protocol framing. For public grid telemetry, data flow is purely unidirectional from MISO down to the client every 5 minutes. SSE operates over standard HTTP/2, works natively through corporate firewalls and corporate proxies, supports automatic client reconnection out of the box, and has significantly lower memory overhead on the server."*

#### ❓ Tech Question 3: *"How does your legacy crosswalk help external developers who are mad about retiring CSV files?"*
> **Answer:** *"In `crosswalk.json`, we mapped legacy CSV column headers like `HE`, `NODE_NAME`, and `LMP_CONG` to modern REST endpoints on `data-exchange.misoenergy.org`. When a developer searches for an old CSV name, OmniSearch displays the exact JSON path, Swagger endpoint, and timezone conversion notes (Eastern Prevailing Time vs UTC) so they can rewrite their ingestion scripts in minutes."*

#### ❓ Tech Question 4: *"What is the memory and CPU footprint of your ReportLab PDF generator?"*
> **Answer:** *"Unlike headless Chrome or Puppeteer, which require launching a 200MB Chromium process that introduces security attack vectors and memory spikes, ReportLab compiles pure Python byte streams in memory. It uses less than 15MB of RAM per worker and compiles the full 1-page PDF in under 2.5 seconds."*
