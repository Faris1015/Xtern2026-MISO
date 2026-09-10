# Issue #15: Engineer Feedback Loop & In-App Triage Modal

## 📌 Context & Overview
To maintain production-grade data accuracy and gather direct feedback from market participants, co-ops, and regulators, OmniSearch requires an integrated feedback loop. Users can flag data inaccuracies, report bugs, or submit feature requests directly to engineering with active query context and persona metadata.

## 🎯 Specific Tasks
1. **Frontend Feedback Modal (`frontend/src/components/FeedbackModal.tsx`):**
   - Accessible dialog overlay styled to match MISO brand aesthetics.
   - Interactive 1–5 star rating mechanism.
   - Category selector: Bug, Data Inaccuracy, Feature Request, General.
   - Context capture: Binds active query, current persona, and optional user email.
2. **Top Navigation Integration (`frontend/src/App.tsx`):**
   - Single unified feedback button matching the "Connect to MISO" button style (`border-sky-300 text-sky-900 bg-sky-50/70 hover:bg-sky-100`).
3. **Backend Persistence Endpoints (`backend/main.py`):**
   - `POST /api/feedback`: Accepts feedback payload and appends asynchronously to `backend/data/user_feedback.json`.
   - `GET /api/feedback`: Engineering endpoint to retrieve recorded feedback entries.

## 🧪 Acceptance Criteria
- [x] Single feedback button positioned in top navigation bar.
- [x] Modal supports 1–5 stars, category dropdown, comments, and email.
- [x] `POST /api/feedback` returns HTTP 200 with generated feedback ID and timestamp.
- [x] Feedback records are reliably persisted in `backend/data/user_feedback.json`.
