# [Issue #7] [Member 4: UI/UX & A11y] Design System, WCAG 2.1 AA Audit & Web Speech Audio Briefing

## 📌 Context & Objective
Establish a clean, professional MISO design system in Figma and implement industry-leading accessibility (WCAG 2.1 AA) including Web Speech API audio voice narration and glowing "X-Ray Jargon" mode.

## 🛠️ Files to Create / Modify
* `frontend/src/components/AudioBriefing.tsx`
* `frontend/src/components/JargonHUD.tsx`
* `docs/accessibility-audit.md`

## 📋 Specific Tasks
1. **MISO Figma Brand System:**
   * Color Palette: MISO Navy (`#0F2942`), Sky Blue (`#0284C7`), Emerald (`#10B981`), Amber (`#F59E0B`), Slate Dark (`#0B1523`).
   * Design responsive wireframes for OmniSearch bar, 360° Knowledge Canvas, and Comparison Matrix.
2. **Audio Voice Briefing (`AudioBriefing.tsx`):**
   * Implement a 1-click **"🔊 Listen to Morning Briefing"** button using browser-native `window.speechSynthesis`.
   * Reads a 45-second audio executive summary of today's grid conditions.
3. **"X-Ray Jargon Mode" (`JargonHUD.tsx`):**
   * Accessible acronym hover cards and modal drawer explaining energy terms.
4. **WCAG 2.1 AA Accessibility Audit:**
   * Perform audit on color contrast (minimum 4.5:1 ratio), keyboard navigation (`Tab`, `Enter`, `Escape`), and ARIA screen-reader attributes.
   * Write `docs/accessibility-audit.md` scorecard for presentation.

## ✅ Acceptance Criteria
* [ ] Passes WCAG 2.1 AA color contrast and keyboard navigation audits.
* [ ] Audio voice briefing functions seamlessly on modern browsers.
* [ ] Documented accessibility scorecard ready for the pitch deck.

---

## 🤖 Copy-Paste LLM Prompt (For Member 4)
> *"Act as an Accessibility (a11y) & UI/UX Engineer. Create `frontend/src/components/AudioBriefing.tsx` using Web Speech API to read aloud a 45-second market briefing, style the interactive Jargon HUD component, and write a professional `docs/accessibility-audit.md` scorecard evaluating WCAG 2.1 AA compliance."*
