import os
import sys
import re
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

sys.stdout.reconfigure(encoding='utf-8')

# Color Palette (Official MISO Brand Scheme)
MISO_NAVY = RGBColor(0, 77, 113)     # #004D71 Primary brand navy
MISO_SKY = RGBColor(0, 130, 202)     # #0082CA Secondary brand blue
MISO_GREEN = RGBColor(128, 188, 0)   # #80BC00 Energy green
MISO_RED = RGBColor(178, 41, 46)     # #B2292E Accent red
MISO_AMBER = RGBColor(255, 158, 24)  # #FF9E18 Warning amber
TEXT_DARK = RGBColor(30, 41, 59)     # #1E293B Slate 800
TEXT_MUTED = RGBColor(100, 116, 139) # #64748B Slate 500
BG_CARD = RGBColor(248, 250, 252)    # #F8FAFC Slate 50
BORDER_COLOR = RGBColor(203, 213, 225) # #CBD5E1 Slate 300
WHITE = RGBColor(255, 255, 255)

original_path = r"c:\Users\faris\OneDrive\Documents\Xtern2026-MISO\Xtern2026-MISO\presentation\MISO_OmniSearch_Presentation_original.pptx"
output_path = r"c:\Users\faris\OneDrive\Documents\Xtern2026-MISO\Xtern2026-MISO\presentation\MISO_OmniSearch_Presentation.pptx"

prs = Presentation(original_path)

def set_font(run, name="Lato", size=None, color=None, bold=None, italic=None):
    if name:
        run.font.name = name
    if size:
        run.font.size = Pt(size)
    if color:
        run.font.color.rgb = color
    if bold is not None:
        run.font.bold = bold
    if italic is not None:
        run.font.italic = italic

def remove_shape(shape):
    sp = shape._element
    sp.getparent().remove(sp)

# ------------------------------------------------------------------------------
# STEP 0: INSERT EXTRA SLIDE FOR THE STORY AT INDEX 2 (SLIDE 3)
# ------------------------------------------------------------------------------
blank_layout = prs.slide_layouts[6]
story_slide = prs.slides.add_slide(blank_layout)
# Move newly added slide to position index 2 (Slide 3)
sldIdLst = prs.slides._sldIdLst
new_sldId = sldIdLst[-1]
sldIdLst.insert(2, new_sldId)

assert len(prs.slides) == 13, f"Expected 13 slides, got {len(prs.slides)}"

# ==============================================================================
# SLIDE 1: Title & Challenge Framing
# ==============================================================================
slide1 = prs.slides[0]
for shape in slide1.shapes:
    if shape.name == 'Title 1':
        tf = shape.text_frame
        tf.clear()
        p0 = tf.paragraphs[0]
        p0.text = "MISO OmniSearch"
        p0.alignment = PP_ALIGN.LEFT
        set_font(p0.runs[0], name="Lato", size=42, color=MISO_NAVY, bold=True)
        shape.left = Inches(0.4)
        shape.top = Inches(0.9)
        shape.width = Inches(9.2)
        shape.height = Inches(1.0)
    elif shape.name == 'Subtitle 2':
        tf = shape.text_frame
        tf.clear()
        p0 = tf.paragraphs[0]
        p0.text = "Intelligent Navigation & Discovery Engine for Public Energy Data"
        set_font(p0.runs[0], name="Lato", size=18, color=MISO_SKY, bold=True)
        
        p1 = tf.add_paragraph()
        p1.text = "Transforming Public Grid Intelligence: From Buried Datasets to Predictive Insights"
        set_font(p1.runs[0], name="Lato", size=13.5, color=TEXT_DARK, italic=True)
        
        p2 = tf.add_paragraph()
        p2.text = "Xtern Fall 2026 Challenge Submission  |  Partner: Midcontinent Independent System Operator (MISO)"
        set_font(p2.runs[0], name="Lato", size=11.5, color=TEXT_MUTED)
        
        p3 = tf.add_paragraph()
        p3.text = "Challenge Deliverable: An AI Discovery Layer Built Directly on Top of MISO's Website (React 18 + FastAPI + Gemini)"
        set_font(p3.runs[0], name="Lato", size=10.5, color=TEXT_MUTED, italic=True)
        
        shape.left = Inches(0.4)
        shape.top = Inches(2.1)
        shape.width = Inches(9.2)
        shape.height = Inches(2.5)

# ==============================================================================
# SLIDE 2: The Core Challenge: Public Grid Data Friction
# ==============================================================================
slide2 = prs.slides[1]

# Remove all 8 images and arrows from Slide 2
shapes_to_delete = [s for s in slide2.shapes if s.name != 'Title 1' and s.name != 'Slide Number Placeholder 3']
for s in shapes_to_delete:
    remove_shape(s)

# Update Title
for shape in slide2.shapes:
    if shape.name == 'Title 1':
        tf = shape.text_frame
        tf.clear()
        p0 = tf.paragraphs[0]
        p0.text = "The Core Challenge: Public Energy Data Friction"
        set_font(p0.runs[0], name="Lato", size=24, color=MISO_NAVY, bold=True)
        p1 = tf.add_paragraph()
        p1.text = "Addressing MISO's Challenge Prompt: Discoverability, Accessibility, Usability, and 12,500 Annual Support Tickets"
        set_font(p1.runs[0], name="Lato", size=12, color=MISO_SKY, italic=True)
        shape.left = Inches(0.26)
        shape.top = Inches(0.18)
        shape.width = Inches(9.4)
        shape.height = Inches(0.85)

# 3 Problem Cards
card_width = Inches(2.88)
card_height = Inches(3.7)
card_top = Inches(1.15)

# Card 1: Discoverability
p1_card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.26), card_top, card_width, card_height)
p1_card.fill.solid()
p1_card.fill.fore_color.rgb = BG_CARD
p1_card.line.color.rgb = BORDER_COLOR
p1_card.line.width = Pt(1.5)
tf_p1 = p1_card.text_frame
tf_p1.clear()
tf_p1.margin_left = Inches(0.16)
tf_p1.margin_right = Inches(0.16)
tf_p1.margin_top = Inches(0.16)

p = tf_p1.paragraphs[0]
p.text = "1. Discoverability Barrier"
set_font(p.runs[0], name="Lato", size=13.5, color=MISO_NAVY, bold=True)

p_sub = tf_p1.add_paragraph()
p_sub.text = "Buried Data & Retiring Reports"
set_font(p_sub.runs[0], name="Lato", size=10.5, color=MISO_SKY, italic=True)

p_body1 = tf_p1.add_paragraph()
p_body1.text = "• MISO's public portal spans thousands of nested web pages, unindexed PDF filings, and complex tariff documents."
set_font(p_body1.runs[0], name="Lato", size=10, color=TEXT_DARK)

p_body2 = tf_p1.add_paragraph()
p_body2.text = "• MISO is retiring legacy public CSV market reports (e.g., rt_lmp_final.csv), breaking downstream external automated pipelines."
set_font(p_body2.runs[0], name="Lato", size=10, color=TEXT_DARK)

p_body3 = tf_p1.add_paragraph()
p_body3.text = "• Stakeholders cannot quickly locate historical pricing trends, real-time telemetry, or interconnection queues without domain expertise."
set_font(p_body3.runs[0], name="Lato", size=10, color=TEXT_DARK)

# Card 2: Usability & Acronyms
p2_card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(3.34), card_top, card_width, card_height)
p2_card.fill.solid()
p2_card.fill.fore_color.rgb = BG_CARD
p2_card.line.color.rgb = BORDER_COLOR
p2_card.line.width = Pt(1.5)
tf_p2 = p2_card.text_frame
tf_p2.clear()
tf_p2.margin_left = Inches(0.16)
tf_p2.margin_right = Inches(0.16)
tf_p2.margin_top = Inches(0.16)

p = tf_p2.paragraphs[0]
p.text = "2. Usability & Jargon Wall"
set_font(p.runs[0], name="Lato", size=13.5, color=MISO_NAVY, bold=True)

p_sub = tf_p2.add_paragraph()
p_sub.text = "75+ Impenetrable Acronyms"
set_font(p_sub.runs[0], name="Lato", size=10.5, color=MISO_SKY, italic=True)

p_body1 = tf_p2.add_paragraph()
p_body1.text = "• Over 75 impenetrable industry acronyms (LMP, CONE, PRA, MTEP, JTIQ, ICCP) confuse municipal co-ops, clean tech teams, and regulators."
set_font(p_body1.runs[0], name="Lato", size=10, color=TEXT_DARK)

p_body2 = tf_p2.add_paragraph()
p_body2.text = "• External stakeholders lack plain-language explanations of market mechanics, pricing formulas, and congestion cost calculations."
set_font(p_body2.runs[0], name="Lato", size=10, color=TEXT_DARK)

p_body3 = tf_p2.add_paragraph()
p_body3.text = "• Joining Commercial Pricing Nodes across Eastern Prevailing Time (EPT) vs. UTC creates severe operational and billing friction."
set_font(p_body3.runs[0], name="Lato", size=10, color=TEXT_DARK)

# Card 3: Support Backlog Drain
p3_card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.42), card_top, card_width, card_height)
p3_card.fill.solid()
p3_card.fill.fore_color.rgb = BG_CARD
p3_card.line.color.rgb = MISO_RED
p3_card.line.width = Pt(1.5)
tf_p3 = p3_card.text_frame
tf_p3.clear()
tf_p3.margin_left = Inches(0.16)
tf_p3.margin_right = Inches(0.16)
tf_p3.margin_top = Inches(0.16)

p = tf_p3.paragraphs[0]
p.text = "3. Manual Support Drain"
set_font(p.runs[0], name="Lato", size=13.5, color=MISO_RED, bold=True)

p_sub = tf_p3.add_paragraph()
p_sub.text = "12,500 Inquiries / $3.75M Annual Cost"
set_font(p_sub.runs[0], name="Lato", size=10.5, color=MISO_RED, italic=True)

p_body1 = tf_p3.add_paragraph()
p_body1.text = "• Over 80% of inquiries flooding MISO's CSR and External Affairs teams are routine requests for basic data retrieval and acronym definitions."
set_font(p_body1.runs[0], name="Lato", size=10, color=TEXT_DARK)

p_body2 = tf_p3.add_paragraph()
p_body2.text = "• Each ticket requires 24 to 72 hours of manual engineer research, data extraction, validation, and email composition."
set_font(p_body2.runs[0], name="Lato", size=10, color=TEXT_DARK)

p_body3 = tf_p3.add_paragraph()
p_body3.text = "• Costs MISO $3.75M annually, diverting over 40,000 hours of specialized staff time away from core grid reliability engineering."
set_font(p_body3.runs[0], name="Lato", size=10, color=TEXT_DARK)

# ==============================================================================
# SLIDE 3: NEW DEDICATED STORY SLIDE (A Stakeholder's Journey)
# ==============================================================================
slide3 = prs.slides[2]

# Add Title Box to Slide 3
title_box = slide3.shapes.add_textbox(Inches(0.26), Inches(0.18), Inches(9.4), Inches(0.85))
tf_title = title_box.text_frame
tf_title.clear()
p0 = tf_title.paragraphs[0]
p0.text = "A Stakeholder's Journey: The 48-Hour Ordeal vs. The 30-Second Reality"
set_font(p0.runs[0], name="Lato", size=22, color=MISO_NAVY, bold=True)
p1 = tf_title.add_paragraph()
p1.text = "Case Study: How Sarah (Municipal Co-op Analyst) Resolves a Board Crisis With and Without OmniSearch"
set_font(p1.runs[0], name="Lato", size=11.5, color=MISO_SKY, italic=True)

# 2 Large Side-by-Side Cards
story_w = Inches(4.45)
story_h = Inches(3.75)
story_top = Inches(1.1)

# Left Side: The 48-Hour Ordeal (Before OmniSearch)
left_card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.26), story_top, story_w, story_h)
left_card.fill.solid()
left_card.fill.fore_color.rgb = BG_CARD
left_card.line.color.rgb = MISO_RED
left_card.line.width = Pt(1.5)
tf_l = left_card.text_frame
tf_l.clear()
tf_l.margin_left = Inches(0.18)
tf_l.margin_right = Inches(0.18)
tf_l.margin_top = Inches(0.16)

p = tf_l.paragraphs[0]
p.text = "Before OmniSearch: The 48-Hour Manual Ordeal"
set_font(p.runs[0], name="Lato", size=13.5, color=MISO_RED, bold=True)

p_sub = tf_l.add_paragraph()
p_sub.text = "Goal: Explain an unexpected wholesale power price spike before tomorrow's board review"
set_font(p_sub.runs[0], name="Lato", size=10, color=TEXT_MUTED, italic=True)

steps_before = [
    ("• 1. Broken Bookmarks: ", "Sarah visits misoenergy.org, but her saved link for rt_lmp_final.csv is broken due to MISO's CSV retirement."),
    ("• 2. The Acronym Barrier: ", "Trapped in thousands of nested PDFs and dense jargon (LMP, CONE, PRA, MTEP) with no plain-language explanations."),
    ("• 3. Manual Escalation: ", "Unable to find answers, Sarah submits an urgent email ticket to MISO CSR and External Affairs."),
    ("• 4. 48-Hour Delay: ", "MISO staff spend 4 hours pulling data; reply arrives 2 days late. Sarah's board meeting is delayed.")
]
for lead, desc in steps_before:
    p_step = tf_l.add_paragraph()
    p_step.text = lead
    set_font(p_step.runs[0], name="Lato", size=10, color=MISO_RED, bold=True)
    r = p_step.add_run()
    r.text = desc
    set_font(r, name="Lato", size=10, color=TEXT_DARK)

p_out_l = tf_l.add_paragraph()
p_out_l.text = "The Result: High frustration, $300 manual cost to MISO, and delayed commercial action."
set_font(p_out_l.runs[0], name="Lato", size=9.5, color=MISO_RED, italic=True)

# Right Side: The 30-Second Reality (With MISO OmniSearch)
right_card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.95), story_top, story_w, story_h)
right_card.fill.solid()
right_card.fill.fore_color.rgb = BG_CARD
right_card.line.color.rgb = MISO_GREEN
right_card.line.width = Pt(1.5)
tf_r = right_card.text_frame
tf_r.clear()
tf_r.margin_left = Inches(0.18)
tf_r.margin_right = Inches(0.18)
tf_r.margin_top = Inches(0.16)

p = tf_r.paragraphs[0]
p.text = "With MISO OmniSearch: The 30-Second Reality"
set_font(p.runs[0], name="Lato", size=13.5, color=MISO_GREEN, bold=True)

p_sub = tf_r.add_paragraph()
p_sub.text = "Goal: Solved instantly via an intelligent discovery layer built directly on top of the website"
set_font(p_sub.runs[0], name="Lato", size=10, color=TEXT_MUTED, italic=True)

steps_after = [
    ("• 1. Proactive Context: ", "Session Radar senses Sarah arrived on /markets and pre-loads Indiana Hub metrics before her first keystroke."),
    ("• 2. Natural Search: ", "Sarah types in plain English: \"Why did Indiana LMP spike yesterday compared to Michigan?\""),
    ("• 3. Instant Decomposed Curves: ", "In 42ms, OmniSearch adapts to Co-op persona, reveals congestion divergence, and decodes acronyms via Jargon HUD (Ctrl+J)."),
    ("• 4. 1-Click Executive PDF: ", "Sarah downloads an official 1-page briefing fact sheet in 2 seconds for her board—zero support tickets created.")
]
for lead, desc in steps_after:
    p_step = tf_r.add_paragraph()
    p_step.text = lead
    set_font(p_step.runs[0], name="Lato", size=10, color=MISO_GREEN, bold=True)
    r = p_step.add_run()
    r.text = desc
    set_font(r, name="Lato", size=10, color=TEXT_DARK)

p_out_r = tf_r.add_paragraph()
p_out_r.text = "The Result: 30-second resolution, zero emails sent to MISO staff, 100% verified MISO data."
set_font(p_out_r.runs[0], name="Lato", size=9.5, color=MISO_GREEN, italic=True)

# ==============================================================================
# SLIDE 4: The Solution: Built on Top of MISO's Website
# ==============================================================================
slide4 = prs.slides[3]
for shape in slide4.shapes:
    if shape.name == 'Title 4':
        shape.left = Inches(0.26)
        shape.top = Inches(0.18)
        shape.width = Inches(9.4)
        shape.height = Inches(0.8)
        tf = shape.text_frame
        tf.clear()
        p0 = tf.paragraphs[0]
        p0.text = "The Solution: MISO OmniSearch Built on Top of the Website"
        set_font(p0.runs[0], name="Lato", size=22, color=MISO_NAVY, bold=True)
        p1 = tf.add_paragraph()
        p1.text = "An Intelligent Discovery & Usability Layer Transforming Public Grid Data into Instant Insights"
        set_font(p1.runs[0], name="Lato", size=11.5, color=MISO_SKY, italic=True)
    elif shape.name == 'Picture 1':
        shape.top = Inches(1.05)
    elif shape.name == 'Picture 2':
        shape.top = Inches(1.95)
        shape.height = Inches(2.65)

pill_banner = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.3), Inches(4.7), Inches(8.7), Inches(0.35))
pill_banner.fill.solid()
pill_banner.fill.fore_color.rgb = MISO_NAVY
pill_banner.line.fill.background()
tf_p = pill_banner.text_frame
tf_p.clear()
p_banner = tf_p.paragraphs[0]
p_banner.alignment = PP_ALIGN.CENTER
p_banner.text = "Live Operations Telemetry   •   Dynamic Persona Inference   •   360° Knowledge Canvas   •   1-Click Executive PDF Studio"
set_font(p_banner.runs[0], name="Lato", size=9.5, color=WHITE, bold=True)

# ==============================================================================
# SLIDE 5: Feature 1 — Session-Aware Radar & Live Grid Telemetry
# ==============================================================================
slide5 = prs.slides[4]
for shape in slide5.shapes:
    if shape.name == 'Title 4':
        tf = shape.text_frame
        tf.clear()
        p0 = tf.paragraphs[0]
        p0.text = "Feature 1 — Session-Aware Radar & Live Grid Telemetry"
        set_font(p0.runs[0], name="Lato", size=22, color=MISO_NAVY, bold=True)
        p1 = tf.add_paragraph()
        p1.text = "Instant Context & Proactive Pre-fetching Before You Even Type"
        set_font(p1.runs[0], name="Lato", size=11.5, color=MISO_SKY, italic=True)
        shape.left = Inches(0.26)
        shape.top = Inches(0.18)
        shape.width = Inches(9.4)
        shape.height = Inches(0.8)
    elif shape.name == 'Content Placeholder 5':
        shape.top = Inches(1.05)
        shape.height = Inches(1.6)
        shape.left = Inches(0.26)
        shape.width = Inches(9.4)
        tf = shape.text_frame
        tf.clear()
        
        p0 = tf.paragraphs[0]
        p0.text = "• Proactive Context Ingestion: "
        set_font(p0.runs[0], name="Lato", size=12.5, color=MISO_NAVY, bold=True)
        r0 = p0.add_run()
        r0.text = "Automatically detects referring browsing path on misoenergy.org (/markets, /planning, /interconnection) to pre-load regional metrics."
        set_font(r0, name="Lato", size=12.5, color=TEXT_DARK)
        
        p1 = tf.add_paragraph()
        p1.text = "• Live Operations Telemetry: "
        set_font(p1.runs[0], name="Lato", size=12.5, color=MISO_NAVY, bold=True)
        r1 = p1.add_run()
        r1.text = "Continuously polls public-api.misoenergy.org for real-time 5-minute fuel generation (Gas, Coal, Wind, Nuclear, Solar) and demand (60s TTL cache)."
        set_font(r1, name="Lato", size=12.5, color=TEXT_DARK)
        
        p2 = tf.add_paragraph()
        p2.text = "• Zero Cold-Start Discovery: "
        set_font(p2.runs[0], name="Lato", size=12.5, color=MISO_NAVY, bold=True)
        r2 = p2.add_run()
        r2.text = "Curated prompt chips (\"Compare Indiana vs. Michigan Hubs\", \"Wind Generation Peak Record\") eliminate search paralysis."
        set_font(r2, name="Lato", size=12.5, color=TEXT_DARK)
    elif shape.name == 'Picture 1':
        shape.top = Inches(2.75)
        shape.left = Inches(0.8)
        shape.width = Inches(8.3)
        shape.height = Inches(1.9)

# ==============================================================================
# SLIDE 6: Feature 2 — 360° Knowledge Canvas & Persona Intelligence
# ==============================================================================
slide6 = prs.slides[5]
for shape in slide6.shapes:
    if shape.name == 'Title 4':
        tf = shape.text_frame
        tf.clear()
        p0 = tf.paragraphs[0]
        p0.text = "Feature 2 — 360° Knowledge Canvas & Persona Intelligence"
        set_font(p0.runs[0], name="Lato", size=22, color=MISO_NAVY, bold=True)
        p1 = tf.add_paragraph()
        p1.text = "One Unified Search Engine Tailored to Four Key Stakeholder Audiences"
        set_font(p1.runs[0], name="Lato", size=11.5, color=MISO_SKY, italic=True)
        shape.left = Inches(0.26)
        shape.top = Inches(0.18)
        shape.width = Inches(9.4)
        shape.height = Inches(0.8)
    elif shape.name == 'Content Placeholder 5':
        shape.top = Inches(1.1)
        shape.left = Inches(0.26)
        shape.width = Inches(6.5)
        shape.height = Inches(3.6)
        tf = shape.text_frame
        tf.clear()
        
        personas = [
            ("• Dynamic Persona Detection: ", "Passively analyzes query patterns and offers 1-click switching to Municipal Co-op, Trader, Regulator, or Public modes.", MISO_NAVY),
            ("• Four Tailored Perspectives: ", "Co-ops see planning reserves (PRMR) & auction clearing; Traders see arbitrage spreads; Public sees clean energy; Regulators see CONE equity.", MISO_GREEN),
            ("• Mathematical LMP Decomposition: ", "Interactive Recharts curves break down Locational Marginal Pricing into Energy + Congestion (MCC) + Losses (MLC).", MISO_SKY),
            ("• Universal Jargon HUD (Ctrl+J): ", "Interactive acronym drawer demystifies 45+ terms (CONE, PRA, MTEP, JTIQ) with plain-English definitions, eliminating confusion.", MISO_AMBER),
            ("• Anti-Hallucination Firewall: ", "All AI generated commentary is strictly validated against verified MISO market pricing bounds ($0 to $1,000/MWh).", MISO_RED)
        ]
        for idx, (lead, desc, color) in enumerate(personas):
            p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
            p.text = lead
            set_font(p.runs[0], name="Lato", size=12, color=color, bold=True)
            r = p.add_run()
            r.text = desc
            set_font(r, name="Lato", size=12, color=TEXT_DARK)
    elif shape.name == 'Picture 1':
        shape.top = Inches(1.3)
        shape.left = Inches(6.9)
        shape.width = Inches(2.6)
        shape.height = Inches(3.2)

# ==============================================================================
# SLIDE 7: Feature 3 — Side-by-Side Comparison Engine
# ==============================================================================
slide7 = prs.slides[6]
for shape in slide7.shapes:
    if shape.name == 'Title 4':
        tf = shape.text_frame
        tf.clear()
        p0 = tf.paragraphs[0]
        p0.text = "Feature 3 — Side-by-Side Comparative Market Intelligence"
        set_font(p0.runs[0], name="Lato", size=22, color=MISO_NAVY, bold=True)
        p1 = tf.add_paragraph()
        p1.text = "Point-and-Click Cross-Zonal Analysis Without Leaving the Browser"
        set_font(p1.runs[0], name="Lato", size=11.5, color=MISO_SKY, italic=True)
        shape.left = Inches(0.26)
        shape.top = Inches(0.18)
        shape.width = Inches(9.4)
        shape.height = Inches(0.8)
    elif shape.name == 'Content Placeholder 5':
        shape.top = Inches(1.1)
        shape.left = Inches(0.26)
        shape.width = Inches(4.8)
        shape.height = Inches(3.6)
        tf = shape.text_frame
        tf.clear()
        
        comps = [
            ("• Multi-Hub Benchmarking: ", "Compare Indiana, Michigan, and Texas commercial pricing nodes on synchronized 24-hour dual-axis curves with instant delta stats."),
            ("• Congestion Divergence Alerts: ", "Automated visual markers alert users when nodal pricing spreads exceed normal operational limits, pinpointing bottlenecks."),
            ("• Fuel Diversity Breakdown: ", "Interactive Recharts breakdown comparing installed capacity (GW), real-time generation shares, and historical peak records."),
            ("• Transmission Portfolios: ", "Compare Local MTEP ($4.1B) upgrades against Regional LRTP ($10.3B & $21.8B) and Interregional JTIQ seam lines ($1.2B) without Excel.")
        ]
        for idx, (lead, desc) in enumerate(comps):
            p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
            p.text = lead
            set_font(p.runs[0], name="Lato", size=12, color=MISO_NAVY, bold=True)
            r = p.add_run()
            r.text = desc
            set_font(r, name="Lato", size=12, color=TEXT_DARK)
    elif shape.name == 'Picture 1':
        shape.top = Inches(1.2)
        shape.left = Inches(5.1)
        shape.width = Inches(4.5)
        shape.height = Inches(3.3)

# ==============================================================================
# SLIDE 8: Process & Architecture: Data Flow
# ==============================================================================
slide8 = prs.slides[7]
for shape in slide8.shapes:
    if shape.name == 'Title 4':
        shape.left = Inches(0.26)
        shape.top = Inches(0.18)
        shape.width = Inches(9.4)
        shape.height = Inches(0.8)
        tf = shape.text_frame
        tf.clear()
        p0 = tf.paragraphs[0]
        p0.text = "Process & Design: High-Performance Data Architecture"
        set_font(p0.runs[0], name="Lato", size=22, color=MISO_NAVY, bold=True)
        p1 = tf.add_paragraph()
        p1.text = "Fast, Deterministic Pipeline Built on Top of MISO's Public Infrastructure"
        set_font(p1.runs[0], name="Lato", size=11.5, color=MISO_SKY, italic=True)
    elif shape.name == 'TextBox 5':
        shape.left = Inches(0.26)
        shape.top = Inches(1.1)
        shape.width = Inches(3.3)
        shape.height = Inches(0.35)
        tf = shape.text_frame
        tf.clear()
        p0 = tf.paragraphs[0]
        p0.text = "End-to-End Pipeline Overview"
        set_font(p0.runs[0], name="Lato", size=13.5, color=MISO_NAVY, bold=True)
    elif shape.name == 'TextBox 2':
        shape.left = Inches(0.26)
        shape.top = Inches(1.5)
        shape.width = Inches(3.3)
        shape.height = Inches(3.1)
        tf = shape.text_frame
        tf.clear()
        
        stages = [
            ("1. Multi-Modal Ingestion: ", "Omnibar natural query, URL referring path detection, and direct Jargon HUD (Ctrl+J) acronym triggers."),
            ("2. Dual-Layer Data Engine: ", "FastAPI reads 6 verified baseline JSON registries with automatic live MISO operations API fallback."),
            ("3. Legacy CSV-to-API Crosswalk: ", "crosswalk.json maps retiring report column names (HE, NODE_NAME) directly to modern Data Exchange REST endpoints."),
            ("4. Anticipatory Feedback: ", "Pre-computes related inquiries and radar chips to keep external stakeholders completely self-sufficient.")
        ]
        for idx, (lead, desc) in enumerate(stages):
            p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
            p.text = lead
            set_font(p.runs[0], name="Lato", size=11, color=MISO_NAVY, bold=True)
            r = p.add_run()
            r.text = desc
            set_font(r, name="Lato", size=11, color=TEXT_DARK)
    elif shape.name == 'Picture 1':
        shape.left = Inches(3.7)
        shape.top = Inches(1.1)
        shape.width = Inches(5.8)
        shape.height = Inches(3.6)

# ==============================================================================
# SLIDE 9: Query Execution: Sub-50ms Resolution
# ==============================================================================
slide9 = prs.slides[8]
for shape in slide9.shapes:
    if shape.name == 'Title 4':
        shape.left = Inches(0.26)
        shape.top = Inches(0.18)
        shape.width = Inches(9.4)
        shape.height = Inches(0.8)
        tf = shape.text_frame
        tf.clear()
        p0 = tf.paragraphs[0]
        p0.text = "Query Execution Lifecycle: Deterministic & Dual-Engine"
        set_font(p0.runs[0], name="Lato", size=22, color=MISO_NAVY, bold=True)
        p1 = tf.add_paragraph()
        p1.text = "Sub-50ms Routing to Verified Insights & Grounded Narratives"
        set_font(p1.runs[0], name="Lato", size=11.5, color=MISO_SKY, italic=True)
    elif shape.name == 'Content Placeholder 5':
        shape.left = Inches(0.26)
        shape.top = Inches(1.05)
        shape.width = Inches(4.3)
        shape.height = Inches(3.7)
        tf = shape.text_frame
        tf.clear()
        
        q_steps = [
            ("1. Ingestion: ", "React client captures query with active session context via Ctrl+K."),
            ("2. Deterministic Router: ", "13-step intent classifier routes to exact market domain in <5ms without LLM latency."),
            ("3. Dual-Tier Resolution: ", "5-min live MISO API stream with automatic verified baseline fallback."),
            ("4. Dual-Call Gemini 3.6 Flash: ", "Parallel asynchronous calls generate grounded narrative explanation + follow-up drill-down chips."),
            ("5. Client-Side Rendering: ", "Instant React rendering of KPI summary cards, Recharts interactive graphs, and auditable MISO citations in 42ms.")
        ]
        for idx, (lead, desc) in enumerate(q_steps):
            p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
            p.text = lead
            set_font(p.runs[0], name="Lato", size=11.5, color=MISO_NAVY, bold=True)
            r = p.add_run()
            r.text = desc
            set_font(r, name="Lato", size=11.5, color=TEXT_DARK)
    elif shape.name == 'Picture 1':
        shape.left = Inches(4.7)
        shape.top = Inches(1.05)
        shape.width = Inches(4.8)
        shape.height = Inches(3.6)

# ==============================================================================
# SLIDE 10: Security, Governance & Anti-Hallucination Framework
# ==============================================================================
slide10 = prs.slides[9]
for shape in slide10.shapes:
    if shape.name == 'Title 1':
        shape.left = Inches(0.26)
        shape.top = Inches(0.18)
        shape.width = Inches(9.4)
        shape.height = Inches(0.8)
        tf = shape.text_frame
        tf.clear()
        p0 = tf.paragraphs[0]
        p0.text = "Security & Governance: The Anti-Hallucination Framework"
        set_font(p0.runs[0], name="Lato", size=22, color=MISO_NAVY, bold=True)
        p1 = tf.add_paragraph()
        p1.text = "Five Robust Defense Layers Ensuring 100% Data Provenance & Regulatory Trust"
        set_font(p1.runs[0], name="Lato", size=11.5, color=MISO_SKY, italic=True)
    elif shape.name == 'Content Placeholder 2':
        shape.left = Inches(0.26)
        shape.top = Inches(1.05)
        shape.width = Inches(4.6)
        shape.height = Inches(3.7)
        tf = shape.text_frame
        tf.clear()
        
        sec_layers = [
            ("• Layer 1: CORS Origin Lock — ", "Enforces strict domain allowlists so only verified web frontends can call backend endpoints."),
            ("• Layer 2: Pydantic Validation — ", "Automatically validates query schemas, rejecting malformed or oversized requests before execution."),
            ("• Layer 3: Domain Scope Guard — ", "Pre-filters off-topic inquiries before calling AI, conserving compute and preventing misuse."),
            ("• Layer 4: Resilient Safe Fallback — ", "60s TTL cache with automatic fallback to verified static data guarantees 99.9% uptime."),
            ("• Layer 5: AI Fact-Check Firewall — ", "Automated validator inspects all AI output against verified market bounds ($0 to $1,000/MWh); unverified figures are discarded for safe templates.")
        ]
        for idx, (lead, desc) in enumerate(sec_layers):
            p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
            p.text = lead
            set_font(p.runs[0], name="Lato", size=11, color=MISO_NAVY, bold=True)
            r = p.add_run()
            r.text = desc
            set_font(r, name="Lato", size=11, color=TEXT_DARK)
    elif shape.name == 'Picture 5':
        shape.left = Inches(5.0)
        shape.top = Inches(1.05)
        shape.width = Inches(4.5)
        shape.height = Inches(3.7)

# ==============================================================================
# SLIDE 11: MISO Core Values: Powered by OmniSearch
# ==============================================================================
# Full-bleed infographic (image21.png) preserved in pristine condition.

# ==============================================================================
# SLIDE 12: Business Impact: 80% CSR Ticket Deflection
# ==============================================================================
slide12 = prs.slides[11]
for shape in list(slide12.shapes):
    if shape.name == 'Title 5':
        shape.left = Inches(0.26)
        shape.top = Inches(0.18)
        shape.width = Inches(9.4)
        shape.height = Inches(0.8)
        tf = shape.text_frame
        tf.clear()
        p0 = tf.paragraphs[0]
        p0.text = "Business Impact: 80% CSR Ticket Deflection & Financial ROI"
        set_font(p0.runs[0], name="Lato", size=22, color=MISO_NAVY, bold=True)
        p1 = tf.add_paragraph()
        p1.text = "Addressing MISO's Core Goal Through Measurable Operational Savings"
        set_font(p1.runs[0], name="Lato", size=11.5, color=MISO_SKY, italic=True)
    elif shape.name == 'Text Placeholder 1':
        shape.left = Inches(4.8)
        shape.top = Inches(1.1)
        shape.width = Inches(4.6)
        shape.height = Inches(3.6)
        tf = shape.text_frame
        tf.clear()
        
        strategic_pillars = [
            ("• 1-Click Executive PDF Studio (ReportLab): ", "Generates official 1-page briefing fact sheets in <3 seconds—zero support tickets filed."),
            ("• Universal Jargon HUD (Ctrl+J): ", "Plain-language acronym definitions deflect 2,944 inquiries annually ($883K saved)."),
            ("• Legacy-to-API Crosswalk: ", "Automated data mapping deflects 1,872 developer CSV migration inquiries ($561K saved)."),
            ("• Side-by-Side Comparison Engine: ", "Self-service comparative tools deflect 1,350 custom data requests ($405K saved)."),
            ("• 100% Grounded Provenance: ", "Strict numerical bounding maintains complete regulatory and stakeholder trust.")
        ]
        for idx, (lead, desc) in enumerate(strategic_pillars):
            p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
            p.text = lead
            set_font(p.runs[0], name="Lato", size=11, color=MISO_NAVY, bold=True)
            r = p.add_run()
            r.text = desc
            set_font(r, name="Lato", size=11, color=TEXT_DARK)

# Add Left Column: Financial ROI Stat Cards on Slide 12
roi_card = slide12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.3), Inches(1.1), Inches(4.3), Inches(3.6))
roi_card.fill.solid()
roi_card.fill.fore_color.rgb = BG_CARD
roi_card.line.color.rgb = MISO_SKY
roi_card.line.width = Pt(1.5)
tf_roi = roi_card.text_frame
tf_roi.clear()

p_roi_h = tf_roi.paragraphs[0]
p_roi_h.text = "Quantifiable CSR Support Impact"
set_font(p_roi_h.runs[0], name="Lato", size=14.5, color=MISO_NAVY, bold=True)

metrics = [
    ("$3.01 Million", "Net Annual Operational Cost Savings for MISO"),
    ("80.4% (10,050 / yr)", "Routine Inquiries Deflected (from 12,500 baseline)"),
    ("40,212 Hours", "Staff-Hours Reallocated to Grid Reliability"),
    ("3,878% / 11 Days", "3-Year Projected ROI with an 11-Day Payback Period")
]

for num, label in metrics:
    p_num = tf_roi.add_paragraph()
    p_num.text = "• " + num
    set_font(p_num.runs[0], name="Lato", size=13, color=MISO_GREEN, bold=True)
    p_lbl = tf_roi.add_paragraph()
    p_lbl.text = "    " + label
    set_font(p_lbl.runs[0], name="Lato", size=10, color=TEXT_DARK)

# ==============================================================================
# SLIDE 13: Conclusion, Live Demo & Q&A
# ==============================================================================
slide13 = prs.slides[12]
for shape in slide13.shapes:
    if shape.name == 'Title 5':
        shape.left = Inches(0.4)
        shape.top = Inches(0.25)
        shape.width = Inches(9.2)
        shape.height = Inches(0.9)
        tf = shape.text_frame
        tf.clear()
        p0 = tf.paragraphs[0]
        p0.text = "Conclusion & Live Demonstration"
        set_font(p0.runs[0], name="Lato", size=26, color=MISO_NAVY, bold=True)
        p1 = tf.add_paragraph()
        p1.text = "Transforming Public Energy Intelligence for Wholesale Power Markets"
        set_font(p1.runs[0], name="Lato", size=13, color=MISO_SKY, italic=True)
    elif shape.name == 'Graphic 1': # QR Code
        shape.left = Inches(5.8)
        shape.top = Inches(1.35)
        shape.width = Inches(2.7)
        shape.height = Inches(2.7)
    elif shape.name == 'TextBox 2':
        shape.left = Inches(5.5)
        shape.top = Inches(4.2)
        shape.width = Inches(3.3)
        shape.height = Inches(0.6)
        tf = shape.text_frame
        tf.clear()
        p0 = tf.paragraphs[0]
        p0.alignment = PP_ALIGN.CENTER
        p0.text = "Scan to Explore OmniSearch Live"
        set_font(p0.runs[0], name="Lato", size=12, color=MISO_NAVY, bold=True)
        p1 = tf.add_paragraph()
        p1.alignment = PP_ALIGN.CENTER
        p1.text = "miso-omnisearch.basildawes.com"
        set_font(p1.runs[0], name="Lato", size=10.5, color=MISO_SKY)

# Add Left Info Card on Slide 13
info_card = slide13.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.5), Inches(1.35), Inches(4.9), Inches(3.2))
info_card.fill.solid()
info_card.fill.fore_color.rgb = BG_CARD
info_card.line.color.rgb = BORDER_COLOR
tf_info = info_card.text_frame
tf_info.clear()

p_ih = tf_info.paragraphs[0]
p_ih.text = "Production Deliverables & Access"
set_font(p_ih.runs[0], name="Lato", size=14.5, color=MISO_NAVY, bold=True)

links = [
    ("Live Web Application:", "https://miso-omnisearch.basildawes.com"),
    ("Interactive OpenAPI Documentation:", "https://miso-omnisearch.basildawes.com/docs"),
    ("Source Code Repository:", "github.com/faris-m/Xtern2026-MISO"),
    ("Challenge Deliverable:", "Xtern Fall 2026 Challenge Submission"),
    ("Partner Organization:", "Midcontinent Independent System Operator")
]

for title, val in links:
    p_t = tf_info.add_paragraph()
    p_t.text = title
    set_font(p_t.runs[0], name="Lato", size=10.5, color=MISO_NAVY, bold=True)
    p_v = tf_info.add_paragraph()
    p_v.text = "    " + val
    set_font(p_v.runs[0], name="Lato", size=10.5, color=MISO_SKY if "http" in val or "github" in val else TEXT_DARK)

# Save updated presentation
prs.save(output_path)
print("Successfully generated 13-slide story-driven presentation without emojis to:", output_path)
