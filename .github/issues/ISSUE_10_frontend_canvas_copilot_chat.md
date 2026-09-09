# [Issue #10] [Member 2: Frontend & Member 1: Backend] "Chat with this Canvas" Interactive Copilot Drawer

## 📌 Context & Objective
While the 360° Knowledge Canvas renders rich KPI stat cards, Recharts time-series graphs, and persona summaries, users often want to ask spontaneous follow-up questions specifically about the data currently displayed (e.g. *"Why is the Real-Time spread diverging between 4 PM and 7 PM?"* or *"How does this fuel mix compare to MISO's summer peak record?"*).

This issue introduces an interactive, slide-out **Canvas Copilot Drawer** on the frontend paired with a contextual **`POST /api/canvas-chat`** backend endpoint. The Copilot uses the active chart payload and KPIs as live context, enabling conversational exploration without leaving the search session.

---

## 🛠️ Files to Create / Modify
* `backend/main.py` *(New endpoint: `POST /api/canvas-chat`)*
* `backend/llm_service.py` *(Add `chat_with_canvas()` method)*
* `frontend/src/components/CanvasCopilotDrawer.tsx` *(New component)*
* `frontend/src/components/KnowledgeCanvas.tsx` *(Add trigger button in canvas header)*
* `frontend/src/types.ts` *(Add ChatMessage and CanvasChatRequest/Response interfaces)*

---

## 📋 Specific Tasks

1. **Backend Endpoint (`POST /api/canvas-chat`):**
   * Accepts a request model:
     ```json
     {
       "message": "Why did LMP spike at HE 18?",
       "canvasContext": {
         "query": "Indiana Hub LMP",
         "chartType": "lmp_series",
         "hubId": "INDIANA.HUB",
         "kpis": [...],
         "data": [...]
       },
       "persona": "Power Trader",
       "history": [
         {"role": "user", "content": "..."},
         {"role": "assistant", "content": "..."}
       ]
     }
     ```
   * Calls `llm_service.chat_with_canvas()` to generate an analytical, data-grounded response.
   * Graceful fallback: If LLM is disabled, returns an intelligent contextual response based on the peak hour and summary stats in `canvasContext`.

2. **Frontend Copilot Drawer Component (`CanvasCopilotDrawer.tsx`):**
   * Accessible slide-out panel (slides in from the right when toggled via keyboard `Ctrl + C` or button click).
   * **Quick-Prompt Chips:** Pre-populates 3 contextual starter pills based on chart type (e.g. for LMP: *"Explain peak volatility"*, *"Break down cost components"*, *"Arbitrage spread summary"*).
   * **Chat Feed:** Clean, scrollable chat message list styled with MISO Navy & Sky Blue accents.
   * **Context Pill:** Shows a pinned pill at the top indicating the active dataset context (e.g. `📍 Context: INDIANA.HUB (24h Real-Time & Day-Ahead)`).
   * **Input Box:** Message input with Send icon and loading indicator.

3. **Integrate into `KnowledgeCanvas.tsx`:**
   * Add an **"Ask Copilot"** button with a sparkle icon (`Sparkles` from `lucide-react`) in the canvas action bar alongside the PDF and CSV export buttons.
   * Pass the current search result and audience persona into the drawer.

---

## ✅ Acceptance Criteria
* [ ] Clicking "Ask Copilot" smoothly opens the slide-out drawer without page reload.
* [ ] Asking questions about the visible chart produces answers that directly reference data points (e.g. quoting specific hour ending prices or fuel percentages).
* [ ] Accessible via keyboard (`Esc` to close drawer, focus trap maintained).
* [ ] Graceful fallback operates when no LLM API key is present.

---

## 🤖 Copy-Paste LLM Prompt (For Member 2 & Member 1)
> *"Act as a Fullstack React + FastAPI Engineer. We are building the 'Chat with this Canvas' Copilot feature for MISO OmniSearch. Implement the backend route `POST /api/canvas-chat` in `backend/main.py` using `backend/llm_service.py` to ground responses in the provided canvas JSON context. Then create `frontend/src/components/CanvasCopilotDrawer.tsx` using Tailwind CSS and Lucide icons, and wire an 'Ask Copilot' button into `frontend/src/components/KnowledgeCanvas.tsx`."*

