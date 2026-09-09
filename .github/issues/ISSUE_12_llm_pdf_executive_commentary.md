# [Issue #12] [Member 1: Backend & Member 5: PM] AI-Generated Executive Commentary for 1-Click PDF Briefings

## 📌 Context & Objective
In Issue #2, we implemented the 1-Click PDF Briefing Generator (`backend/pdf_generator.py`), which constructs an executive 1-page MISO Market & Grid Fact Sheet using ReportLab. Currently, the *Operational Overview* narrative in the PDF uses static template paragraphs.

This issue enhances the PDF generator by adding an **AI-Written Executive Commentary**. When generating the PDF briefing, the engine prompts the LLM to write a concise, publication-grade executive summary of the day's grid conditions and market clearing dynamics, tailored to the target audience.

Crucially, because ReportLab strictly enforces a **1-page physical budget** (zero second-page spillover), the LLM prompt and layout engine must enforce strict character/word count boundaries (maximum 55–65 words) so the document layout never breaks.

---

## 🛠️ Files to Create / Modify
* `backend/pdf_generator.py` *(Integrate AI commentary flowable)*
* `backend/llm_service.py` *(Add `generate_pdf_executive_commentary()`)*
* `backend/main.py` *(Pass custom commentary flag in `POST /api/generate-briefing`)*

---

## 📋 Specific Tasks

1. **Implement `generate_pdf_executive_commentary()` in `backend/llm_service.py`:**
   * Receives `hub_id`, `summary` (real-time avg, day-ahead avg, peak hour, volume, spreads), and `audience_mode`.
   * Formats prompt with strict spatial constraints:
     * Maximum 55 words / 350 characters.
     * High-level executive tone suitable for C-suite utility executives, state commissioners, or senior trading desk heads.
     * Direct focus on market spread, peak volatility driver, and grid reliability posture.
   * If LLM is disabled or fails, cleanly returns the existing deterministic narrative string from `data_manager.py`.

2. **Update `backend/pdf_generator.py`:**
   * Call `llm_service.generate_pdf_executive_commentary()` when compiling the document elements.
   * Add a visual callout container or subtle side-border quote block in ReportLab Platypus (`Paragraph` with custom `ParagraphStyle`) titled **"EXECUTIVE MARKET INTELLIGENCE COMMENTARY"**.
   * Add an automated footnote citation badge: *"AI-Synthesized from Verified MISO Telemetry (ISO-27001 Grounded Protocol)"*.
   * Verify with PyMuPDF unit test (`test_api_and_pdf.py`) that page count remains exactly **1**.

---

## ✅ Acceptance Criteria
* [ ] Generated PDF contains a crisp, context-rich executive commentary paragraph matching the requested audience mode.
* [ ] Strict 1-Page Guarantee: Document never exceeds 1 page (0 overflow flowables) across all commercial hubs and audience modes.
* [ ] PDF generation latency remains under 2.5 seconds total (including LLM synthesis and ReportLab compilation).
* [ ] Automatic fallback to deterministic text when offline.

---

## 🤖 Copy-Paste LLM Prompt (For Member 1 & Member 5)
> *"Act as a Python Backend Engineer and ReportLab specialist. Implement `generate_pdf_executive_commentary()` in `backend/llm_service.py` with a strict 55-word budget for MISO executive briefings. Then update `backend/pdf_generator.py` to insert this executive commentary into the ReportLab Platypus flowable story, styled with MISO brand guidelines and verified to never spill onto page 2."*

