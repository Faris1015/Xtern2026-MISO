import {
  memo,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Lightbulb, Search, X } from "lucide-react";
import { useGlossary } from "../context/GlossaryContext";
import type { GlossaryItem } from "../types";

type Props = {
  term: GlossaryItem;
  children?: ReactNode;
  onSearch?: (query: string) => void;
};

export const GlossaryTooltip = memo(function GlossaryTooltip({
  term,
  children,
  onSearch,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    placement: "top" | "bottom";
  }>({ top: 0, left: 0, placement: "bottom" });

  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const tooltipId = useId();

  const { onSearchTerm } = useGlossary();
  const searchHandler = onSearch ?? onSearchTerm;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = Math.min(360, window.innerWidth - 32);
    const estimatedHeight = 220;

    // Horizontal alignment: center on trigger, clamped to viewport margins
    const triggerCenter = rect.left + rect.width / 2;
    let left = triggerCenter - tooltipWidth / 2;
    left = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, left));

    // Vertical alignment: prefer below unless close to bottom
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeBelow = spaceBelow >= estimatedHeight || rect.top < estimatedHeight;

    const top = placeBelow
      ? rect.bottom + 8 + window.scrollY
      : rect.top - estimatedHeight - 8 + window.scrollY;

    setCoords({
      top,
      left,
      placement: placeBelow ? "bottom" : "top",
    });
  }, []);

  const openTooltip = useCallback(() => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    updatePosition();
    setIsOpen(true);
  }, [updatePosition]);

  const scheduleClose = useCallback(() => {
    if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
      closeTimeoutRef.current = null;
    }, 180);
  }, []);

  // Keyboard navigation and dismiss listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handlePointerDownOutside = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    document.addEventListener("pointerdown", handlePointerDownOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("pointerdown", handlePointerDownOutside);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchClick = () => {
    setIsOpen(false);
    if (searchHandler) {
      searchHandler(`What is ${term.acronym}?`);
    }
  };

  const tooltipElement = isOpen ? (
    <div
      ref={tooltipRef}
      id={tooltipId}
      role="tooltip"
      aria-live="polite"
      onMouseEnter={openTooltip}
      onMouseLeave={scheduleClose}
      style={{
        position: "absolute",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: "min(360px, calc(100vw - 32px))",
        zIndex: 9999,
      }}
      className="miso-panel animate-in fade-in zoom-in-95 duration-150 rounded-md border border-miso-sky/30 bg-white p-4 shadow-panel"
    >
      {/* Header with acronym, term title and category */}
      <div className="flex items-start justify-between gap-3 border-b border-miso-border pb-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-block rounded bg-miso-navy px-1.5 py-0.5 font-mono text-xs font-bold text-white">
              {term.acronym}
            </span>
            <span className="rounded bg-miso-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-miso-sky">
              {term.category}
            </span>
          </div>
          <h4 className="mt-1 text-sm font-bold tracking-tight text-miso-navy">
            {term.term}
          </h4>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="icon-button -mr-1 -mt-1 text-miso-muted hover:text-miso-navy"
          aria-label="Close definition tooltip"
        >
          <X size={14} />
        </button>
      </div>

      {/* Plain Language Explanation (ELI5) */}
      <div className="mt-2.5 space-y-2 text-xs">
        <div className="flex items-start gap-1.5 text-miso-slate">
          <Lightbulb
            size={14}
            className="mt-0.5 shrink-0 text-miso-amber"
            aria-hidden="true"
          />
          <p className="leading-relaxed">
            {term.eli5 || "No plain-English summary available."}
          </p>
        </div>

        {/* Technical or Formula Reference */}
        {term.formula ? (
          <div className="rounded border-l-2 border-miso-sky bg-miso-soft px-2.5 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-miso-sky">
              Formula / Rule
            </span>
            <p className="font-mono text-[11px] font-semibold text-miso-navy">
              {term.formula}
            </p>
          </div>
        ) : term.technical ? (
          <p className="border-t border-miso-border/60 pt-2 text-[11px] leading-relaxed text-miso-muted">
            <span className="font-semibold text-miso-slate">Technical: </span>
            {term.technical.length > 130
              ? `${term.technical.slice(0, 130)}…`
              : term.technical}
          </p>
        ) : null}
      </div>

      {/* Action Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-miso-border pt-2.5">
        {searchHandler && (
          <button
            type="button"
            onClick={handleSearchClick}
            className="miso-button-quiet inline-flex items-center gap-1.5 text-xs font-semibold text-miso-sky hover:text-miso-navy"
          >
            <Search size={12} aria-hidden="true" />
            Search {term.acronym} in OmniSearch
          </button>
        )}
        {term.source && (
          <a
            href={term.source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-miso-muted hover:text-miso-navy"
          >
            Docs <ExternalLink size={10} aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <abbr
        ref={triggerRef}
        tabIndex={0}
        aria-describedby={isOpen ? tooltipId : undefined}
        title={`${term.acronym}: ${term.term}`}
        onMouseEnter={openTooltip}
        onMouseLeave={scheduleClose}
        onFocus={openTooltip}
        onBlur={scheduleClose}
        className="inline cursor-help text-inherit underline decoration-dotted decoration-miso-sky underline-offset-4 transition-colors hover:text-miso-sky hover:decoration-miso-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-miso-sky focus-visible:ring-offset-1"
      >
        {children ?? term.acronym}
      </abbr>
      {typeof document !== "undefined" &&
        createPortal(tooltipElement, document.body)}
    </>
  );
});
