import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useGlossary } from "../context/GlossaryContext";
import type { GlossaryItem } from "../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelectTerm?: (term: string) => void;
};

const CATEGORIES = [
  "All",
  "Markets",
  "Planning",
  "Reliability",
  "Interconnection",
  "Operations",
  "Governance",
  "Grid Units",
] as const;

export default memo(function JargonHUD({ isOpen, onClose, onSelectTerm }: Props) {
  const { glossary, onSearchTerm } = useGlossary();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedAcronyms, setExpandedAcronyms] = useState<Record<string, boolean>>({});

  const searchInputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
      setSelectedCategory("All");
    }
  }, [isOpen]);

  // Keyboard dismiss (Escape)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const toggleExpand = useCallback((acronym: string) => {
    setExpandedAcronyms((prev) => ({
      ...prev,
      [acronym]: !prev[acronym],
    }));
  }, []);

  const termsList = useMemo<GlossaryItem[]>(() => {
    return Object.values(glossary).sort((a, b) => a.acronym.localeCompare(b.acronym));
  }, [glossary]);

  const filteredTerms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return termsList.filter((item) => {
      const matchesCat = selectedCategory === "All" || item.category === selectedCategory;
      if (!matchesCat) return false;
      if (!q) return true;

      return (
        item.acronym.toLowerCase().includes(q) ||
        item.term.toLowerCase().includes(q) ||
        item.eli5.toLowerCase().includes(q) ||
        item.technical.toLowerCase().includes(q) ||
        (item.formula && item.formula.toLowerCase().includes(q))
      );
    });
  }, [termsList, searchQuery, selectedCategory]);

  const handleTriggerSearch = useCallback(
    (item: GlossaryItem) => {
      onClose();
      if (onSelectTerm) {
        onSelectTerm(item.acronym);
      } else if (onSearchTerm) {
        onSearchTerm(item.acronym);
      }
    },
    [onClose, onSelectTerm, onSearchTerm],
  );

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="jargon-hud-title"
      className="fixed inset-0 z-50 flex justify-end bg-miso-navy/60 backdrop-blur-sm transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={drawerRef}
        className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl transition-transform animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <header className="border-b border-miso-border bg-miso-navy px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-miso-sky/20 text-miso-sky">
                <BookOpen size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 id="jargon-hud-title" className="text-lg font-bold tracking-tight text-white">
                  MISO Jargon HUD &amp; Terminology Explorer
                </h2>
                <p className="text-xs text-slate-300">
                  Authoritative dictionary of {termsList.length} verified MISO acronyms, market rules &amp; grid concepts
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Jargon HUD"
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mt-4">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search acronym, term, formula, or concept (e.g. LMP, CONE, ICCP, Seam)..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-miso-sky focus:outline-none focus:ring-1 focus:ring-miso-sky"
            />
          </div>

          {/* Category Filter Pills */}
          <div
            className="mt-3 flex flex-wrap gap-1.5"
            role="toolbar"
            aria-label="Filter glossary terms by category"
          >
            {CATEGORIES.map((cat) => {
              const count =
                cat === "All"
                  ? termsList.length
                  : termsList.filter((t) => t.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    isSelected
                      ? "bg-miso-sky text-white shadow-sm"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {cat} <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* Term List Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-canvas">
          {filteredTerms.length === 0 ? (
            <div className="py-12 text-center text-miso-muted">
              <Filter size={32} className="mx-auto mb-2 opacity-40" aria-hidden="true" />
              <p className="text-base font-semibold text-miso-navy">No matching acronyms found</p>
              <p className="mt-1 text-xs text-miso-muted">
                Try searching for another term, or switch the category filter to &quot;All&quot;.
              </p>
            </div>
          ) : (
            filteredTerms.map((item) => {
              const isExpanded = !!expandedAcronyms[item.acronym];
              return (
                <article
                  key={item.acronym}
                  className="rounded-xl border border-miso-border bg-white p-4 shadow-sm transition hover:border-miso-sky/40 hover:shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-miso-navy px-2.5 py-0.5 text-xs font-bold tracking-wider text-white">
                          {item.acronym}
                        </span>
                        <span className="text-xs font-semibold text-miso-muted">
                          {item.term}
                        </span>
                        <span className="rounded-full bg-miso-soft px-2 py-0.5 text-[10px] font-semibold text-miso-slate border border-miso-border">
                          {item.category}
                        </span>
                      </div>

                      {/* ELI5 Plain Language */}
                      <p className="mt-2 text-sm leading-relaxed text-miso-slate">
                        <strong className="text-miso-navy">Plain English: </strong>
                        {item.eli5}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTriggerSearch(item)}
                      title={`Search ${item.acronym} in Knowledge Canvas`}
                      className="shrink-0 rounded-lg border border-miso-border bg-miso-soft px-2.5 py-1.5 text-xs font-semibold text-miso-navy hover:bg-miso-sky hover:text-white transition flex items-center gap-1.5"
                    >
                      <Sparkles size={13} aria-hidden="true" />
                      Search
                    </button>
                  </div>

                  {/* Expandable Technical Detail */}
                  <div className="mt-3 border-t border-miso-border/60 pt-2">
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.acronym)}
                      className="flex items-center gap-1 text-xs font-semibold text-miso-sky hover:text-miso-navy transition"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={14} aria-hidden="true" /> Hide Technical Detail
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} aria-hidden="true" /> Show Technical Detail &amp; Formula
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 rounded-lg bg-miso-card p-3 text-xs leading-relaxed text-miso-muted space-y-2 border border-miso-border/50">
                        <div>
                          <span className="font-semibold text-miso-navy">Technical Definition: </span>
                          {item.technical}
                        </div>
                        {item.formula && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-miso-navy">Reference Formula: </span>
                            <code className="rounded bg-white px-2 py-0.5 font-mono text-[11px] text-miso-navy border border-miso-border">
                              {item.formula}
                            </code>
                          </div>
                        )}
                        {item.source && (
                          <div className="flex items-center gap-1 text-[11px] text-miso-slate pt-1 border-t border-miso-border/40">
                            <span>Official Source: </span>
                            <a
                              href={item.source}
                              target="_blank"
                              rel="noreferrer"
                              className="text-miso-sky hover:underline inline-flex items-center gap-1"
                            >
                              Tariff / Knowledgebase <ExternalLink size={11} aria-hidden="true" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-miso-border bg-white px-6 py-3 flex items-center justify-between text-xs text-miso-muted">
          <span>Showing {filteredTerms.length} of {termsList.length} terms</span>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">Press <kbd className="rounded bg-miso-soft px-1.5 py-0.5 font-mono text-[10px] text-miso-navy border border-miso-border">Esc</kbd> to close</span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-miso-border px-3 py-1.5 text-xs font-semibold text-miso-navy hover:bg-miso-soft transition"
            >
              Close
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
});

