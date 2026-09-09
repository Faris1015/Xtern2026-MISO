import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  Compass,
  FileSpreadsheet,
  Lightbulb,
  Search,
  X,
} from "lucide-react";
import type { AudienceMode } from "../types";

export interface TourStep {
  id: string;
  targetSelector: string;
  badge: string;
  title: string;
  description: string;
  preferredPosition?: "top" | "bottom" | "left" | "right";
  isSettingsStep?: boolean;
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  audienceMode: AudienceMode;
  onAudienceModeChange: (mode: AudienceMode) => void;
  onTriggerSampleSearch?: (query: string) => void;
}

const PERSONA_OPTIONS: Array<{
  mode: AudienceMode;
  tagline: string;
  description: string;
}> = [
  {
    mode: "Power Trader",
    tagline: "Spreads & Volatility",
    description: "RT/DA price spreads, congestion risks, and peak price hours.",
  },
  {
    mode: "Municipal Co-op",
    tagline: "Costs & Reliability",
    description: "Capacity reserve margins, delivered supply costs, and regional demand.",
  },
  {
    mode: "Public / Media",
    tagline: "Clear Context",
    description: "Plain-language summaries, fuel mix percentages, and clean energy milestones.",
  },
  {
    mode: "State Regulator",
    tagline: "Planning & Policy",
    description: "Long-range transmission plans (MTEP/LRTP) and statutory reliability metrics.",
  },
];

const TOUR_STEPS: TourStep[] = [
  {
    id: "audience-step",
    targetSelector: '[data-tour="audience-selector"]',
    badge: "Step 1 of 6 · Optimal Setup",
    title: "Configure your optimal audience persona",
    description:
      "MISO OmniSearch customizes its metrics, analytical tone, chart priorities, and executive PDF briefings to your specific role. Select your preferred persona below:",
    preferredPosition: "bottom",
    isSettingsStep: true,
  },
  {
    id: "search-step",
    targetSelector: '[data-tour="search-input-area"]',
    badge: "Step 2 of 6 · Predictive Search",
    title: "Unified multi-domain search engine",
    description:
      "Query commercial hubs, fuel records, transmission projects, or MISO acronyms (like 'What is CONE?'). Filter by category tabs or press Ctrl+K (or /) anytime to quickly focus.",
    preferredPosition: "bottom",
  },
  {
    id: "radar-step",
    targetSelector: '[data-tour="session-radar"]',
    badge: "Step 3 of 6 · Real-Time Intelligence",
    title: "Pre-briefed Session Radar",
    description:
      "Before you even type, Session Radar prepares market intelligence: Real-Time vs Day-Ahead averages, historical solar and wind records, and instant one-click research chips.",
    preferredPosition: "bottom",
  },
  {
    id: "canvas-step",
    targetSelector: '[data-tour="knowledge-canvas"]',
    badge: "Step 4 of 6 · Analytical Visualizations",
    title: "Dynamic Knowledge Canvas & charts",
    description:
      "Search results render direct answers alongside interactive charts. Toggle between RT & DA curves, spreads, and LMP breakdown components (Energy, Congestion, Loss), or view exact hourly tables.",
    preferredPosition: "top",
  },
  {
    id: "export-step",
    targetSelector: '[data-tour="export-sidebar"]',
    badge: "Step 5 of 6 · Action & Export",
    title: "Persona-tailored PDF briefs & CSV data",
    description:
      "Export executive PDF fact sheets synthesized directly for your selected persona, download raw data sets directly to CSV, or trigger proactive follow-up queries.",
    preferredPosition: "left",
  },
  {
    id: "comparison-step",
    targetSelector: '[data-tour="comparison-btn"]',
    badge: "Step 6 of 6 · Comparative Tools",
    title: "Multi-resource comparison workspace",
    description:
      "Benchmark multiple hubs side-by-side, analyze fuel mixes, or contrast MTEP and LRTP transmission portfolios. You can re-open this tour at any time with the 'Guided Tour' button.",
    preferredPosition: "bottom",
  },
];

interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function GuidedTour({
  isOpen,
  onClose,
  audienceMode,
  onAudienceModeChange,
  onTriggerSampleSearch,
}: GuidedTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = TOUR_STEPS[currentStepIndex] ?? TOUR_STEPS[0];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  // Measure and align to the target element
  const updateTargetPosition = useCallback(() => {
    if (!isOpen) return;

    let element = document.querySelector(currentStep.targetSelector) as HTMLElement | null;

    // Fallback if target element is hidden or not found (e.g. export sidebar when no search result yet)
    if (!element && currentStep.id === "export-step") {
      element = document.querySelector('[data-tour="knowledge-canvas"]') as HTMLElement | null;
    }

    if (element) {
      const rect = element.getBoundingClientRect();
      // Ensure target is scrolled into view smoothly
      const isInViewport =
        rect.top >= 60 &&
        rect.bottom <= window.innerHeight - 60 &&
        rect.left >= 0 &&
        rect.right <= window.innerWidth;

      if (!isInViewport) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }

      // Re-measure after scroll / layout
      const updatedRect = element.getBoundingClientRect();
      const padding = 8;
      setTargetRect({
        x: Math.max(0, updatedRect.left - padding),
        y: Math.max(0, updatedRect.top - padding),
        width: updatedRect.width + padding * 2,
        height: updatedRect.height + padding * 2,
      });
    } else {
      // Centered fallback if element not found in DOM
      setTargetRect({
        x: window.innerWidth / 2 - 200,
        y: window.innerHeight / 2 - 100,
        width: 400,
        height: 200,
      });
    }
  }, [currentStep, isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    updateTargetPosition();
    const handleScrollOrResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      updateTargetPosition();
    };

    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, { passive: true });

    const timeout = window.setTimeout(updateTargetPosition, 300);

    return () => {
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize);
      window.clearTimeout(timeout);
    };
  }, [isOpen, currentStepIndex, updateTargetPosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (currentStepIndex < TOUR_STEPS.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          onClose();
        }
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (currentStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStepIndex, onClose]);

  // Focus tooltip on step transition for screen readers
  useEffect(() => {
    if (isOpen && tooltipRef.current) {
      tooltipRef.current.focus();
    }
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Calculate tooltip placement relative to targetRect
  let tooltipStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 50,
  };

  const tooltipWidth = Math.min(460, windowSize.width - 32);

  if (targetRect) {
    const spacing = 16;
    const isMobile = windowSize.width < 640;

    if (isMobile) {
      tooltipStyle = {
        position: "fixed",
        bottom: "16px",
        left: "16px",
        right: "16px",
        maxWidth: "calc(100vw - 32px)",
        zIndex: 50,
      };
    } else {
      let top = targetRect.y + targetRect.height + spacing;
      let left = Math.max(
        16,
        Math.min(
          targetRect.x + targetRect.width / 2 - tooltipWidth / 2,
          windowSize.width - tooltipWidth - 24,
        ),
      );

      // If bottom placement overflows viewport, place above
      if (top + 340 > windowSize.height && targetRect.y > 360) {
        top = Math.max(16, targetRect.y - 380 - spacing);
      }

      // If preferred position is left or right and space permits
      if (
        currentStep.preferredPosition === "left" &&
        targetRect.x > tooltipWidth + spacing + 24
      ) {
        left = targetRect.x - tooltipWidth - spacing;
        top = Math.max(
          16,
          Math.min(targetRect.y, windowSize.height - 360),
        );
      }

      tooltipStyle = {
        position: "fixed",
        top: `${Math.max(16, top)}px`,
        left: `${left}px`,
        width: `${tooltipWidth}px`,
        zIndex: 50,
      };
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-dialog-title"
      aria-describedby="tour-dialog-desc"
      className="fixed inset-0 z-50 select-none"
    >
      {/* Dimmed backdrop with SVG Cutout Mask */}
      <svg
        className="pointer-events-auto fixed inset-0 h-full w-full transition-opacity duration-300"
        style={{ cursor: "default" }}
        onClick={onClose}
        aria-hidden="true"
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White reveals everything (the dimming) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cuts out the spotlight hole */}
            {targetRect && (
              <rect
                x={targetRect.x}
                y={targetRect.y}
                width={targetRect.width}
                height={targetRect.height}
                rx="6"
                ry="6"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="#0B2E4F"
          fillOpacity="0.75"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Target Element Highlight Box & Glowing Ring */}
      {targetRect && (
        <div
          style={{
            position: "fixed",
            left: `${targetRect.x}px`,
            top: `${targetRect.y}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
            pointerEvents: "none",
            zIndex: 49,
          }}
          className="rounded-md ring-2 ring-miso-sky shadow-[0_0_0_4px_rgba(0,130,202,0.3)] transition-all duration-300"
        />
      )}

      {/* Interactive Tooltip Card */}
      <div
        ref={tooltipRef}
        tabIndex={-1}
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
        className="miso-panel overflow-hidden border-2 border-miso-sky bg-white shadow-2xl outline-none transition-all duration-200"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-miso-border bg-miso-soft px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-miso-navy text-white">
              <Compass size={12} aria-hidden="true" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-miso-navy">
              {currentStep.badge}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tutorial"
            className="icon-button text-miso-muted hover:text-miso-navy"
          >
            <X size={16} />
          </button>
        </div>

        {/* Card Content */}
        <div className="p-5">
          <h2
            id="tour-dialog-title"
            className="text-base font-bold text-miso-navy"
          >
            {currentStep.title}
          </h2>
          <p
            id="tour-dialog-desc"
            className="mt-2 text-xs leading-relaxed text-miso-slate"
          >
            {currentStep.description}
          </p>

          {/* Interactive Persona Selector (in Step 1) */}
          {currentStep.isSettingsStep && (
            <div className="mt-4 space-y-2 border-t border-miso-border pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-miso-muted">
                Choose your optimal persona:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PERSONA_OPTIONS.map((persona) => {
                  const isSelected = audienceMode === persona.mode;
                  return (
                    <button
                      key={persona.mode}
                      type="button"
                      onClick={() => onAudienceModeChange(persona.mode)}
                      className={`flex flex-col items-start rounded border p-2.5 text-left transition ${
                        isSelected
                          ? "border-miso-sky bg-miso-soft text-miso-navy ring-1 ring-miso-sky"
                          : "border-miso-border bg-white text-miso-slate hover:border-miso-sky hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-xs font-bold">{persona.mode}</span>
                        {isSelected && (
                          <Check size={13} className="text-miso-sky" />
                        )}
                      </div>
                      <span className="mt-0.5 text-[10px] font-semibold text-miso-sky">
                        {persona.tagline}
                      </span>
                      <span className="mt-1 text-[10px] leading-tight text-miso-muted">
                        {persona.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Sample Search Helper (in Step 2) */}
          {currentStep.id === "search-step" && onTriggerSampleSearch && (
            <div className="mt-4 border-t border-miso-border pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-miso-muted">
                Try a sample search:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onTriggerSampleSearch("Indiana Hub LMPs");
                    handleNext();
                  }}
                  className="inline-flex items-center gap-1.5 rounded border border-miso-sky/40 bg-miso-soft px-2.5 py-1 text-xs font-semibold text-miso-navy hover:bg-miso-sky hover:text-white transition"
                >
                  <Search size={11} />
                  Indiana Hub LMPs
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onTriggerSampleSearch("Current Fuel Mix");
                    handleNext();
                  }}
                  className="inline-flex items-center gap-1.5 rounded border border-miso-sky/40 bg-miso-soft px-2.5 py-1 text-xs font-semibold text-miso-navy hover:bg-miso-sky hover:text-white transition"
                >
                  <BarChart3 size={11} />
                  Current Fuel Mix
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onTriggerSampleSearch("What is CONE?");
                    handleNext();
                  }}
                  className="inline-flex items-center gap-1.5 rounded border border-miso-sky/40 bg-miso-soft px-2.5 py-1 text-xs font-semibold text-miso-navy hover:bg-miso-sky hover:text-white transition"
                >
                  <Lightbulb size={11} />
                  What is CONE?
                </button>
              </div>
            </div>
          )}

          {/* Export highlights (in Step 5) */}
          {currentStep.id === "export-step" && (
            <div className="mt-3 flex items-center gap-3 rounded bg-miso-card p-2.5 text-xs text-miso-navy border border-miso-border">
              <FileSpreadsheet size={18} className="text-miso-sky shrink-0" />
              <p className="text-[11px] leading-snug">
                PDF fact sheets automatically adapt to your active persona (
                <strong>{audienceMode}</strong>) with specialized charts and commentary.
              </p>
            </div>
          )}

          {/* Progress Indicators & Navigation Controls */}
          <div className="mt-5 flex items-center justify-between border-t border-miso-border pt-4">
            {/* Step dots */}
            <div className="flex items-center gap-1.5" aria-label="Tour progress">
              {TOUR_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  type="button"
                  aria-label={`Jump to step ${idx + 1}: ${step.title}`}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? "w-6 bg-miso-sky"
                      : "w-2 bg-miso-border hover:bg-miso-muted"
                  }`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1.5 text-xs font-semibold text-miso-muted hover:text-miso-navy"
              >
                Skip tour
              </button>

              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="miso-button-secondary px-3 py-1.5 text-xs"
                >
                  <ArrowLeft size={13} aria-hidden="true" /> Back
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="miso-button-primary px-3.5 py-1.5 text-xs"
              >
                {isLastStep ? (
                  <>
                    <Check size={13} aria-hidden="true" /> Got it!
                  </>
                ) : (
                  <>
                    Next <ArrowRight size={13} aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
