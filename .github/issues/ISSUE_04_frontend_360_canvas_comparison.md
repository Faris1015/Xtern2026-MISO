# [Issue #4] [Member 2: Frontend] 360° Knowledge Canvas & Recharts Side-by-Side Comparison Engine

## 📌 Context & Objective
The core innovation of MISO OmniSearch: when a user searches or asks a question, this component dynamically constructs a **360° Knowledge Canvas** featuring verified answers, KPI stats cards, interactive Recharts graphs, and side-by-side comparative matrices.

## 🛠️ Files to Create / Modify
* `frontend/src/components/KnowledgeCanvas.tsx`
* `frontend/src/components/ComparisonMatrix.tsx`

## 📋 Specific Tasks
1. **360° Knowledge Canvas Component:**
   * **Direct Answer Block:** Displays plain-English grounded answer with clickable footnote badge (e.g. `[📄 Fact Sheet 2025]`).
   * **KPI Stats Row:** 4 responsive metric cards with bold numbers and status colors.
   * **Interactive Recharts Visualizer:**
     * Area Chart for 24-hr LMP prices (Real-Time vs Day-Ahead).
     * Donut Chart for Fuel Mix on Margin (Gas, Coal, Wind, Solar, Nuclear, Hydro).
   * **Proactive Follow-Up Radar:** Interactive pills predicting next questions (clicking a pill dynamically updates the canvas without full page reload).
2. **Side-by-Side Comparison Engine:**
   * Multi-select checkboxes for Hubs (*Indiana*, *Michigan*, *Illinois*, *Texas*).
   * Overlays multiple 24-hr curves on the same chart.
   * Highlights transmission congestion price divergence ($ spread).
3. **1-Click Export Actions:**
   * "📥 Download Official 1-Page PDF Fact Sheet" (calls backend PDF endpoint).
   * "📥 Download Filtered CSV".

## ✅ Acceptance Criteria
* [ ] Fluid Recharts rendering with tooltips and responsive container.
* [ ] Seamless transition when switching between search results and comparative mode.
* [ ] 1-Click PDF download triggers direct browser download.

---

## 🤖 Copy-Paste LLM Prompt (For Member 2)
> *"Act as a Frontend Data Visualization Specialist. Build `frontend/src/components/KnowledgeCanvas.tsx` and `frontend/src/components/ComparisonMatrix.tsx` in React + TypeScript using Recharts and Tailwind CSS. Implement dynamic KPI stat cards, multi-hub overlay area charts, interactive proactive question pills, and 1-click PDF download integration."*
