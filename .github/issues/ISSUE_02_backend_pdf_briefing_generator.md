# [Issue #2] [Member 1: Backend] 1-Click Publication-Ready PDF Briefing Generator Service

## 📌 Context & Objective
A primary goal of the Xtern challenge is eliminating routine custom data request emails to MISO External Affairs. This service generates a branded, publication-grade **1-Page MISO Market & Grid Fact Sheet PDF** in under 3 seconds using Python's `reportlab`.

## 🛠️ Files to Create / Modify
* `backend/pdf_generator.py`
* `backend/main.py` (Endpoint: `POST /api/generate-briefing`)

## 📋 Specific Tasks
1. **Build `generate_market_briefing_pdf(hub_id, custom_title, audience_mode)`:**
   * Page Size: Standard Letter (8.5 x 11 inches) formatted strictly to 1 page.
   * Palette: Official MISO Navy (`#0F2942`), Sky Blue (`#0284C7`), Emerald (`#059669`), Dark Slate (`#1E293B`).
   * Sections:
     * Branded Header Banner with MISO Title, Date, and Audience Mode badge.
     * 4-Box Executive KPI Stat Cards (Real-Time Avg, Day-Ahead Avg, Peak Hour, Volume).
     * Operational Overview & Price Formation Narrative paragraph.
     * Clean 12-Hour condensed pricing & component breakdown table.
     * Generation Mix on Margin summary (Gas, Coal, Wind, Nuclear, Solar, Hydro).
     * Official Grounding Footer with citation badges and page numbers.
2. **Implement `POST /api/generate-briefing`:**
   * Returns a streaming binary PDF response with `Content-Disposition: attachment; filename=MISO_Briefing.pdf`.

## ✅ Acceptance Criteria
* [ ] Generates a clean, visually balanced 1-page PDF with no second-page spillover.
* [ ] Handles custom hub parameters and audience modes (*Power Trader*, *Co-op*, *Public*, *Regulator*).
* [ ] Generates in < 1 second.

---

## 🤖 Copy-Paste LLM Prompt (For Member 1)
> *"Act as a Python ReportLab Specialist. Create a complete, robust `backend/pdf_generator.py` module for MISO DataBridge Studio. It must take a market data summary dictionary and output a high-resolution, perfectly styled 1-page PDF using ReportLab Platypus (SimpleDocTemplate, Paragraph, Table, TableStyle, HRFlowable) matching official MISO energy brand styling."*
