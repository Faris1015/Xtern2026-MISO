# 🎬 MISO OmniSearch — 2-Minute Live Demo Video Script
**Target Duration:** Exactly 120 Seconds (2:00)  
**Deliverable:** Issue #8 (Product Management & Pitch Lead)  
**Format:** Two-column storyboard (Visual Screen Action + Verbal Voiceover Script)  
**Prerequisites:** Backend running on `:8000`, Frontend running on `:3000` (or Docker running).

---

## Storyboard & Second-by-Second Breakdown

| Timestamp | Visual Screen Action (What Viewer Sees) | Verbal Voiceover Script (What Presenter Says) |
| :--- | :--- | :--- |
| **0:00 – 0:15** | **Scene 1: The Problem & Landing Page**<br>• Screen shows `http://localhost:3000`.<br>• Cursor hovers over MISO OmniSearch header.<br>• Session Radar is visible with active pre-fetch chips. | *"Every year, thousands of energy traders, municipal co-ops, and clean energy developers struggle to find verified grid data on MISO's public website. And with legacy CSV reports being retired for new APIs, the confusion has never been higher. Welcome to **MISO OmniSearch**—the intelligent knowledge and comparative engine built to solve this."* |
| **0:15 – 0:35** | **Scene 2: Predictive Search & 360° Canvas**<br>• Presenter hits `Ctrl + K` to focus search.<br>• Types `"Indiana Hub"`—instant suggestion chips appear.<br>• Hits Enter.<br>• Knowledge Canvas loads sub-50ms with 4 KPI cards and 24-hour Recharts LMP curve. | *"Notice the zero cold start: our Session Radar already pre-loaded Indiana Hub metrics based on our browsing path. When I search, OmniSearch doesn't give me a passive chatbot paragraph—it delivers a verified **360° Knowledge Canvas**: real-time vs. day-ahead price spreads, peak pricing hours, and interactive hourly curves with page-level tariff citations."* |
| **0:35 – 0:50** | **Scene 3: Role-Based Persona Tailoring**<br>• Presenter switches the Audience dropdown from **Power Trader** to **Municipal Co-op**.<br>• The direct answer re-formats instantly, highlighting hedging costs and capacity reserve margins.<br>• Toggles the chart view button to **"Spread"** and **"LMP Components"** (Energy, Congestion, Loss). | *"Different stakeholders need different insights. With our role-based persona selector, a power trader sees volatility arbitrage and congestion risks, while a municipal co-op sees wholesale supply costs and reliability margins—all anchored to the exact same verified data models."* |
| **0:50 – 1:10** | **Scene 4: Side-by-Side Comparison Engine**<br>• Presenter clicks **"Comparison workspace"** in header.<br>• Comparison Matrix slides into view.<br>• Selects **Indiana.Hub vs. Michigan.Hub vs. Texas.Hub**.<br>• Dual-axis 24-hour curve plots all three hubs with delta summary table.<br>• Toggles type to **"Generation Mix"** showing Recharts donut chart (Gas 40%, Coal 26%, Wind 15%). | *"Need comparative intelligence? Forget downloading multiple spreadsheets. In one click, our side-by-side comparison engine benchmarks regional hubs across MISO Midwest and South, or compares fuel generation mix shares and historical wind and solar peak records with live interactive Recharts."* |
| **1:10 – 1:30** | **Scene 5: 1-Click PDF Briefing Studio**<br>• Presenter clicks **"1-Page PDF Fact Sheet"** in the sidebar.<br>• Browser downloads `briefing_INDIANA.HUB_Power_Trader.pdf` in ~2 seconds.<br>• Opens PDF: perfectly styled, exactly 1 physical page with MISO branding, KPI table, and hourly breakdown. | *"Executives and co-op directors need publication-ready deliverables. With our 1-Click PDF Studio, OmniSearch compiles an official, branded 1-page briefing fact sheet in three seconds flat—guaranteed zero page spillover, verified by automated headless regression tests."* |
| **1:30 – 1:45** | **Scene 6: Universal Accessibility & Voice Briefing**<br>• Presenter clicks **"Listen (45s)"** in header.<br>• Voice player begins reading the morning briefing with karaoke-style synchronized word highlighting.<br>• Presenter presses `Ctrl + J` to open **Jargon HUD**.<br>• 75+ acronyms appear; presenter searches `"ICCP"` or `"CONE"` to reveal ELI5 definition and formula. | *"We engineered OmniSearch for 100% WCAG 2.1 AA accessibility. From built-in Web Speech voice briefings for field operators to our interactive Jargon HUD that demystifies 75+ complex energy acronyms in plain English, anyone can navigate MISO data without a steep learning curve."* |
| **1:45 – 2:00** | **Scene 7: The ROI Punchline & Closing**<br>• Presenter pans back to the full dashboard.<br>• Shows quick recap: 80% CSR deflection, $3.0M annual savings, sub-50ms speed. | *"By replacing manual support tickets and retiring CSV bottlenecks with predictive, self-service intelligence, MISO OmniSearch deflects over 80% of routine inquiries, saving MISO $3.0 Million and 40,000 engineering hours every single year. Thank you!"* |

---

## 🎙️ Recording Tips & Setup Checklist

1. **Browser Window:** Chrome or Edge maximized at 1920x1080 (100% DPI zoom).
2. **Audio Setup:** Clear microphone with background noise suppression.
3. **Dev Server Check:**
   * Backend: `http://localhost:8000/docs` responds with 200.
   * Frontend: `http://localhost:3000` loaded and refreshed.
4. **Volume:** Ensure computer audio is unmuted so the Web Speech API voice briefing is clearly audible through the recording software (OBS / QuickTime / Loom).
5. **Pacing:** Practice speaking smoothly at approximately **140–150 words per minute** to hit the exact 120-second target.

