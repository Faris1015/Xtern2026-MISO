# [Issue #3] [Member 2: Frontend] Unified OmniSearch Bar, Category Auto-Suggest & Session Radar UI

## 📌 Context & Objective
Build the primary user entry point for **MISO OmniSearch**: an intelligent, responsive omni-input bar with instant auto-suggestions, category filtering, and an active **Session-Aware Radar Banner** that demonstrates zero cold-start latency.

## 🛠️ Files to Create / Modify
* `frontend/src/components/OmniSearch.tsx`
* `frontend/src/components/SessionRadar.tsx`
* `frontend/src/App.tsx`

## 📋 Specific Tasks
1. **OmniSearch Input Component:**
   * Prominent search bar with search icon, clear button, and keyboard shortcuts (`/` or `Ctrl+K` to focus).
   * Real-time autocomplete suggestions categorized by tags:
     * 🏷️ *Market Pricing* (e.g. "Indiana Hub LMPs", "Michigan Hub Spreads")
     * 🏷️ *Generation & Peaks* (e.g. "Solar Peak Record", "Current Fuel Mix")
     * 🏷️ *Transmission Planning* (e.g. "MTEP24 LRTP Tranche 2", "JTIQ Seam Upgrades")
     * 🏷️ *Jargon Acronyms* (e.g. "What is CONE?", "Explain LMP formula")
2. **Session-Aware Radar Banner:**
   * Displays an animated, subtle context bar:
     * *"⚡ Active Session Radar: Detected recent viewing of Indiana Hub LMPs & Solar Queue. Click to pre-load briefing."*
   * Includes 3 quick-start chips: `[Indiana Hub Briefing]`, `[Compare vs. Michigan]`, `[MISO Peak Records]`.
3. **Audience Mode Toggle:**
   * 4-way selector (*Power Trader*, *Municipal Co-op*, *Public / Media*, *State Regulator*).

## ✅ Acceptance Criteria
* [ ] Fast instant auto-complete as user types.
* [ ] Keyboard accessible (Arrow keys to navigate suggestions, Enter to select).
* [ ] Mobile responsive layout with Tailwind CSS.

---

## 🤖 Copy-Paste LLM Prompt (For Member 2)
> *"Act as a Senior React & Tailwind CSS Developer. Build `frontend/src/components/OmniSearch.tsx` and `frontend/src/components/SessionRadar.tsx` using Lucide-React icons. It should feature an intelligent search bar with real-time categorized auto-suggestions, quick-filter category pills, keyboard navigation (Ctrl+K to focus), and an animated Session-Aware Radar banner showing active browsing context."*
