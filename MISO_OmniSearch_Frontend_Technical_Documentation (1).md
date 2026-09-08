# MISO OmniSearch — Frontend Technical Documentation
**Owner:** Member 2 (Frontend & Data Viz Lead) — Issues #3 & #4
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Recharts + lucide-react

---

## 1. What this delivers

| Issue | Requirement | File(s) |
|---|---|---|
| #3 | OmniSearch bar, category auto-suggest, Session Radar banner, audience toggle | `OmniSearch.tsx`, `SessionRadar.tsx` |
| #4 | 360° Knowledge Canvas, KPI cards, Recharts visualizer, proactive follow-ups, PDF/CSV export | `KnowledgeCanvas.tsx` |
| #4 | Side-by-side Comparison Engine (hubs/fuels/plans) | `ComparisonMatrix.tsx` |

Every component is written **against the actual Pydantic response models and real data** in `backend/main.py`, `backend/search_engine.py`, and `backend/data_manager.py` — not against the issue spec's illustrative JSON, which drifts slightly from what the real backend returns. `src/types.ts` is the single source of truth for that shape; if the backend's models ever change, that's the first (and usually only) file to update.

**This has now been verified end-to-end against your actual repo, not just read from source.** I installed `backend/requirements.txt` (`fastapi`, `uvicorn`, `pydantic`, `reportlab`, `pymupdf`, `httpx`) in a sandbox, ran `uvicorn main:app`, and hit every route the frontend calls — `/api/search` for all four `chartType`s, `/api/session-prefetch`, `/api/compare` for all three `compareType`s, and `POST /api/generate-briefing` (which returned a real 6.3 KB one-page PDF, HTTP 200). The frontend build itself passes `npx tsc --noEmit` (zero errors) and `npx vite build` (clean production bundle) against the updated types below. The one thing I still can't do from this sandbox is open the running dev server in an actual browser for you — see the "how to run it" section for the two-terminal setup to see it live.

That live run surfaced a few real fields the earlier version of this doc had only inferred — `types.ts` and the components below have been updated to match:
- `Hub` has a `region` field (`"Central"` / `"North"` / `"South"`) not previously modeled.
- Each `HourlyLmpRow` also carries `energyComponent`, `congestionComponent`, and `lossComponent` — the LMP's three cost components. Not charted yet, but typed as optional fields so they flow through CSV export and are easy to add to the chart later.
- Each `FuelMixItem` ships its own `color` hex (e.g. `"#0284C7"` for Natural Gas). `KnowledgeCanvas`'s donut chart now uses this directly instead of a hardcoded palette, so the frontend's colors always match whatever Member 3 curates in `fuel_peaks.json`.
- `backend/data/related_queries.json` uses **17 distinct follow-up `action` values**, not the handful visible in the illustrative issue JSON — see §6 for the full table of what's wired up versus what falls back.

---

## 2. Project layout

```
frontend/
├── index.html                  Vite entry HTML — loads IBM Plex fonts
├── package.json                Scripts + pinned dependencies
├── vite.config.ts              Vite + React plugin config
├── tailwind.config.js          Design tokens (colors, fonts) — see §5
├── postcss.config.js           Tailwind/Autoprefixer pipeline
├── tsconfig.json / .node.json  Strict TypeScript config
├── .env.example                Copy to .env — sets VITE_API_BASE_URL
└── src/
    ├── main.tsx                 React root
    ├── App.tsx                  Page composition + shared state
    ├── index.css                Tailwind layers + focus/motion rules
    ├── types.ts                 TypeScript mirror of backend Pydantic models
    ├── vite-env.d.ts             import.meta.env typing
    ├── lib/
    │   └── api.ts                Typed fetch client for every backend route
    └── components/
        ├── OmniSearch.tsx        Issue #3: search bar + audience toggle
        ├── SessionRadar.tsx      Issue #3: session pre-fetch banner
        ├── KnowledgeCanvas.tsx   Issue #4: answer + KPIs + chart + exports
        └── ComparisonMatrix.tsx  Issue #4: hub/fuel/plan comparison engine
```

---

## 3. How to run it

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Point it at your backend (defaults to http://localhost:8000)
cp .env.example .env
# edit VITE_API_BASE_URL if the backend runs elsewhere

# 3. Start the backend separately (Member 1's Issue #1/#2 code)
cd ../backend
uvicorn main:app --reload --port 8000

# 4. Start the frontend dev server
cd ../frontend
npm run dev   # http://localhost:5173
```

`backend/main.py` already whitelists `http://localhost:5173` and `http://localhost:3000` in CORS, so no proxy config is needed for local dev.

Other scripts:
- `npm run build` — type-checks (`tsc -b`) then produces a production bundle in `dist/`.
- `npm run typecheck` — `tsc --noEmit` only, useful in CI.
- `npm run preview` — serves the production build locally.

---

## 4. Data flow, end to end

```
OmniSearch.tsx ──onSearch(query)──► App.tsx ──searchQuery()──► GET /api/search
                                        │                              │
                                        ▼                              ▼
                              setResult(SearchResponse) ◄──────────────┘
                                        │
                                        ▼
                              KnowledgeCanvas.tsx renders:
                                - directAnswer + sourceCitation badge
                                - kpis[] as 4 stat cards
                                - chart selected by chartType
                                - proactiveFollowUps[] as pills
                                - PDF / CSV export buttons

SessionRadar.tsx ──mount──► GET /api/session-prefetch ──► banner + quick-start chips
                                        │
                          chip click ──►│── type "compare" → scrolls to ComparisonMatrix
                                        └── otherwise → same runSearch() path as above

ComparisonMatrix.tsx ──selection change──► GET /api/compare?type=...&items=... ──► overlay chart + metrics table
```

`App.tsx` owns the only pieces of state that need to be shared across components: the active `persona`, the current `SearchResponse`, and which hubs the comparison panel should pre-select (set either by the Session Radar's "Compare vs. Michigan" chip or by a `compare_hubs` proactive follow-up pill from the canvas). Everything else — suggestion filtering, chart data shaping, CSV building — is local to the component that needs it.

---

## 5. Design decisions (Issue #4 asked for "fluid Recharts rendering" and Issue #7 will audit for WCAG AA, so these were chosen deliberately)

**Palette** — a grid-operations aesthetic instead of a generic SaaS-card look: deep navy/graphite surfaces (`#0B1220` background, `#121B2C` panels), a single **teal** accent (`#3FD6C6`) for anything interactive, and **amber** (`#E8A33D`) reserved strictly for peak/alert data points (Day-Ahead series, congestion warnings). This mirrors how transmission telemetry and warning states are conventionally colored, and keeps the accent meaningful rather than decorative.

**Type** — IBM Plex Sans for UI text, IBM Plex Mono for every number (`.num` utility class applies `font-mono tabular-nums`), so KPI values and table figures align like a terminal readout instead of reflowing with proportional digits.

**Layout** — single-column, left-aligned, terminal-dense: KPIs and chart stay in one continuous panel rather than being split into separate shadowed cards, so the canvas reads as one instrument rather than a stack of widgets.

**Accessibility groundwork for Member 4's audit:**
- Audience toggle uses `role="radiogroup"` / `role="radio"` with `aria-checked`.
- OmniSearch input uses `role="combobox"` with `aria-expanded`/`aria-controls`/`aria-autocomplete`, and the suggestion list is a real `role="listbox"`/`role="option"` structure — arrow keys and Enter work without a mouse.
- All interactive elements get a visible `:focus-visible` outline (`src/index.css`), and `prefers-reduced-motion` disables the radar pulse and other transitions.
- Color is never the only signal: KPI cards and chart series carry text labels alongside their color coding.

---

## 6. Component reference

### `src/types.ts`
Every interface here corresponds 1:1 to a Pydantic model:

| TS type | Backend model | Notes |
|---|---|---|
| `SearchResponse` | `search_engine.SearchResponse` | `data` is a union — its real shape depends on `chartType` (see table below) |
| `SessionPrefetchResponse` | `search_engine.SessionPrefetchResponse` | `featuredHub` is a full `Hub` object, not just an ID |
| `ComparisonResponse` | `search_engine.ComparisonResponse` | `series`/`metricsSummary` are loosely typed (`Record<string, unknown>[]`) because their keys change shape per `compareType` (e.g. `INDIANA_rt` vs `fuel`) |

`SearchResponse.data` shape by `chartType`:

| `chartType` | `data` shape |
|---|---|
| `lmp_series` | `HourlyLmpRow[]` (24 hourly rows) |
| `fuel_mix` | `FuelMixItem[]` |
| `transmission_bar` | `TransmissionCategory[]` |
| `glossary_card` | single `GlossaryEntry` object (not an array) |

`KnowledgeCanvas.tsx`'s `ChartByType` switch relies on exactly this table — if the backend adds a new `chartType`, add a case there and a matching interface here.

### `src/lib/api.ts`
One function per backend route, all reading `VITE_API_BASE_URL` from `.env`:

- `searchQuery(q, persona, signal)` → `GET /api/search`
- `getSessionPrefetch(signal)` → `GET /api/session-prefetch`
- `compare(type, items, signal)` → `GET /api/compare`
- `generateBriefing(hubId, audienceMode, customTitle)` → `POST /api/generate-briefing`, returns a `Blob`
- `downloadBlob(blob, filename)` — triggers the browser's native download for that blob (used for the PDF)
- `downloadCsv(rows, filename)` — **client-side only**. The backend has no CSV endpoint, so Issue #4's "Download Filtered CSV" button builds a CSV in the browser from whatever `data`/`series` array is already on screen. If a real `/api/export-csv` route is added later, swap the button handler to call it instead.

Every function throws a typed `ApiError(status, message)` on a non-2xx response (parsed from FastAPI's `{"detail": "..."}` error body), so components can show the real backend error message rather than a generic failure.

### `src/components/OmniSearch.tsx` (Issue #3)
- Static, categorized suggestion list (`Market Pricing` / `Generation & Peaks` / `Transmission Planning` / `Jargon Acronyms`) filtered client-side as the user types. There's no `/api/suggest` endpoint on the backend, so this list was built from the exact phrases `search_engine.py`'s keyword matching recognizes (hub names, `solar`/`wind`/`fuel`, `mtep`/`lrtp`/`jtiq`, and `what is <acronym>`), so every suggestion is guaranteed to route to a real, non-fallback answer.
- Global keydown listener focuses the input on `/` or `Ctrl/Cmd+K`, without hijacking those keys while the user is typing somewhere else on the page.
- Arrow keys move `activeIndex` through the flattened, category-ordered suggestion list; `Enter` submits the highlighted suggestion or the raw typed text if nothing is highlighted.
- The 4-way audience toggle calls `onPersonaChange`, which `App.tsx` uses to both update state and **re-run the last search** with the new persona — matching the backend's persona-tailored `directAnswer` narrative.

### `src/components/SessionRadar.tsx` (Issue #3)
- Fetches `/api/session-prefetch` once on mount. Renders a one-line loading state, then the banner, or fails silently (renders nothing) if the endpoint errors — the rest of the app doesn't depend on it, so a prefetch failure shouldn't block search.
- The `radar-pulse` CSS animation (defined in `index.css`) gives the "active radar" feel described in the issue without a JS animation library, and respects `prefers-reduced-motion`.
- Quick-start chips call `onChipSelect(query, type)`. The one chip typed `"compare"` (`"Compare vs. Michigan"`) is special-cased in `App.tsx` to open the Comparison panel with Indiana + Michigan pre-selected, rather than being sent to `/api/search` (which has no "compare" intent of its own).

### `src/components/KnowledgeCanvas.tsx` (Issue #4)
- Direct Answer block + a "Source" badge that expands to show the full `sourceCitation` string on click (kept as a lightweight popover rather than a modal, since citations are one line of text).
- KPI cards map the backend's `color` string (`sky|slate|red|emerald|amber|purple`) to **static** Tailwind class strings (`KPI_COLOR_CLASSES`) rather than building class names dynamically — dynamic class name construction (e.g. `` `bg-${color}-400` ``) gets stripped by Tailwind's production purge, which is a common cause of "colors work in dev, disappear in build" bugs.
- `ChartByType` is a pure function of `chartType` + `data`; it doesn't know anything about personas or KPIs.
- `handleFollowUp` interprets `proactiveFollowUps[].action`. `backend/data/related_queries.json` actually uses 17 distinct action strings; here's the full picture:

  | `action` | Frontend behavior |
  |---|---|
  | `search` | Re-runs `params.q` as a new OmniSearch query |
  | `compare_hubs` | Opens the Comparison panel, hubs tab, pre-selecting `params.hubs` |
  | `compare_fuels` | Opens the Comparison panel, fuels tab, pre-selecting `params.fuels` |
  | `compare_plans` | Opens the Comparison panel, plans tab |
  | `generate_briefing` | Triggers the PDF download directly for `params.hub` (no extra click) |
  | `show_spread` | Re-searches `"<hub> Hub LMP spread"` (no dedicated spread view exists yet) |
  | `download_csv` | Builds and downloads a CSV from the canvas's current `data` |
  | `view_tariff`, `view_glossary` | Re-searches `params.term` / `params.category` |
  | everything else (`view_queue`, `view_curtailment`, `view_zones`, `view_peaks`, `view_lrtp`, `view_transmission_miles`, `download_factsheet`, `download_guide`, `download_summary`) | No dedicated backend route exists for these yet, so the pill re-runs its own **label** as a fresh OmniSearch query — a real, working search rather than a dead button. If Member 1 adds routes for any of these, add a case to the `switch` in `handleFollowUp`. |
- "Download 1-Page PDF Fact Sheet" calls `generateBriefing(hubId, persona)` — it uses the **current search's `hubId`**, falling back to `INDIANA.HUB` for non-hub results (fuel mix, transmission, glossary), matching the backend's own default.
- "Download Filtered CSV" is disabled (greyed out) whenever `result.data` isn't an array — i.e., on glossary results, where there's no tabular series to export.

### `src/components/ComparisonMatrix.tsx` (Issue #4)
- Three tabs backed by the same `/api/compare` endpoint's `type` parameter: `hubs`, `fuels`, `plans`.
- Hub checkboxes cover all six hubs the backend recognizes (`_match_hub` in `search_engine.py`), not just the four named in the issue spec, since the API already supports Minnesota and Louisiana.
- Refetches automatically whenever the tab or selection changes (`useEffect` keyed on `compareType` + the selected items), with in-flight request cancellation via `AbortController` so a fast double-click can't race an older response into view.
- The congestion-divergence callout (amber banner) only appears for the `hubs` tab with **exactly two** hubs selected — it walks the returned `series` for the largest `|hubA_rt − hubB_rt|` and reports the interval it occurred at, directly satisfying the issue's "highlights transmission congestion price divergence" requirement.
- `MetricsTable` is intentionally generic (renders whatever keys `metricsSummary` rows contain) because that shape legitimately differs by `compareType` — hub rows have `spreadAvg`/`peakHour`, fuel rows have `peakRecord`/`role`, plan rows have `investment`/`focus`. This avoids three near-duplicate table components.
- `initialHubs` prop lets `App.tsx` drive hub selection from outside (Session Radar's compare chip, or a canvas follow-up pill) without the two components needing to know about each other directly.

### `src/App.tsx`
Holds the four pieces of cross-component state (`persona`, `result`, `loading`/`error`, `compareHubs`) and wires the one-directional data flow described in §4. A `ref` on the comparison section is used purely for `scrollIntoView` when a hub-compare action fires from elsewhere on the page — there's no routing library in this build since the whole experience is a single scrollable page, matching the "seamless transition... without full page reload" acceptance criterion in Issue #4.

---

## 7. Confirmed against the live backend — remaining product decisions for the team

Everything in the table below was an open question in the previous revision of this doc; all are now resolved by actually running your `Xtern2026-MISO-main/backend` in a sandbox:

| Question | Resolution |
|---|---|
| Exact `HourlyLmpRow` field names | Confirmed live: `hourEnding`, `intervalLabel`, `realTimeLmp`, `dayAheadLmp`, `spread`, `energyComponent`, `congestionComponent`, `lossComponent`, `volumeMwh`. `types.ts` matches exactly. |
| Is there a `/api/suggest` endpoint? | No — confirmed by reading `main.py` in full. Autosuggest stays a static, curated list (see §6). |
| Is there a CSV export endpoint? | No — `downloadCsv` continues to build the file client-side from whatever's already rendered. |
| Does `POST /api/generate-briefing` actually produce a valid PDF? | Yes — confirmed live: HTTP 200, 6.3 KB, one page, in well under a second. |

One product decision still genuinely belongs to the team, not something code alone can answer:

- **PDF export's hub fallback.** For a fuel-mix, transmission, or glossary search (`hubId: null`), "Download 1-Page PDF Fact Sheet" falls back to `INDIANA.HUB` rather than disabling the button. Confirm that's the UX you want — the alternative is greying the button out whenever `hubId` is `null`.
