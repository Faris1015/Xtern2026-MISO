import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Command,
  Database,
  Search,
  X,
  Zap,
} from "lucide-react";
import type { AudienceMode } from "../types";

type Category =
  | "Market Pricing"
  | "Generation & Peaks"
  | "Transmission Planning"
  | "Jargon Acronyms";
type Suggestion = { label: string; category: Category; icon: typeof Database };

const suggestions: Suggestion[] = [
  { label: "Indiana Hub LMPs", category: "Market Pricing", icon: Database },
  { label: "Michigan Hub Spreads", category: "Market Pricing", icon: Database },
  { label: "Solar Peak Record", category: "Generation & Peaks", icon: Zap },
  { label: "Current Fuel Mix", category: "Generation & Peaks", icon: Zap },
  {
    label: "MTEP24 LRTP Tranche 2",
    category: "Transmission Planning",
    icon: Database,
  },
  {
    label: "JTIQ Seam Upgrades",
    category: "Transmission Planning",
    icon: Database,
  },
  ...[
    "LMP",
    "CONE",
    "PRA",
    "MTEP",
    "LRTP",
    "JTIQ",
    "DPP",
    "LOLE",
    "OASIS",
    "FTR",
  ].map((acronym) => ({
    label: `What is ${acronym}?`,
    category: "Jargon Acronyms" as Category,
    icon: BookOpen,
  })),
];
const categories = [
  "All",
  ...Array.from(new Set(suggestions.map(({ category }) => category))),
];
const listboxId = "miso-search-suggestions";

type Props = {
  audienceMode: AudienceMode;
  onAudienceModeChange: (mode: AudienceMode) => void;
  onSearch: (query: string) => void;
  isSearching: boolean;
};

export default function OmniSearch({
  audienceMode,
  onAudienceModeChange,
  onSearch,
  isSearching,
}: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    return suggestions.filter(
      (item) =>
        (category === "All" || item.category === category) &&
        (!term ||
          item.label.toLowerCase().includes(term) ||
          item.category.toLowerCase().includes(term)),
    );
  }, [category, query]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const isInput =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;
      if (
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") ||
        (event.key === "/" && !isInput)
      ) {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    const closeWhenOutside = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node))
        setOpen(false);
    };
    document.addEventListener("pointerdown", closeWhenOutside);
    return () => document.removeEventListener("pointerdown", closeWhenOutside);
  }, []);

  useEffect(() => setActiveIndex(0), [category, query]);

  const submit = (value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue || isSearching) return;
    setQuery(cleanValue);
    setOpen(false);
    onSearch(cleanValue);
  };
  const activeOptionId =
    open && matches[activeIndex] ? `miso-option-${activeIndex}` : undefined;

  return (
    <section
      aria-labelledby="search-heading"
      className="border border-miso-border bg-white p-5 sm:p-7"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-miso-sky">
            MISO public information
          </p>
          <h1
            id="search-heading"
            className="font-display text-3xl font-bold tracking-tight text-miso-navy sm:text-4xl"
          >
            Search public information
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-miso-muted">
            Find market, generation, transmission-planning, and glossary
            information from a single starting point.
          </p>
        </div>
        <label className="relative flex items-center gap-2 text-sm font-medium text-miso-slate">
          Audience
          <select
            value={audienceMode}
            onChange={(event) =>
              onAudienceModeChange(event.target.value as AudienceMode)
            }
            className="appearance-none border border-miso-border bg-white py-2 pl-3 pr-8 outline-none focus-visible:border-miso-sky focus-visible:ring-2 focus-visible:ring-sky-100"
          >
            <option>Power Trader</option>
            <option>Municipal Co-op</option>
            <option>Public / Media</option>
            <option>State Regulator</option>
          </select>
          <ChevronDown
            size={15}
            className="pointer-events-none absolute right-2 top-3.5"
            aria-hidden="true"
          />
        </label>
      </div>

      <div ref={rootRef} className="relative mt-6">
        <div
          className={`flex items-center gap-3 border-2 px-4 py-3 transition ${open ? "border-miso-sky ring-4 ring-miso-sky/20" : "border-miso-border"}`}
        >
          <Search
            className="shrink-0 text-miso-sky"
            size={21}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            role="combobox"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setOpen(true);
                setActiveIndex((index) =>
                  Math.min(index + 1, Math.max(matches.length - 1, 0)),
                );
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                submit(matches[activeIndex]?.label ?? query);
              } else if (event.key === "Escape") setOpen(false);
            }}
            placeholder={
              'Try "Indiana Hub LMP", "solar peak", or "What is LOLE?"'
            }
            aria-label="Search MISO public information"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={activeOptionId}
            aria-expanded={open}
            aria-describedby="search-help"
            className="min-w-0 flex-1 bg-transparent text-base outline-none ring-0 placeholder:text-slate-400 focus:outline-none focus-visible:outline-none focus:ring-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="icon-button"
            >
              <X size={18} />
            </button>
          )}
          <span className="hidden items-center gap-1 border border-miso-border bg-miso-card px-2 py-1 text-xs text-miso-muted sm:flex">
            <Command size={12} /> K
          </span>
          <button
            type="button"
            onClick={() => submit(query)}
            disabled={!query.trim() || isSearching}
            className="bg-miso-sky px-4 py-2 text-sm font-bold text-white transition hover:bg-miso-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-miso-navy disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSearching ? "Searching…" : "Search"}
          </button>
        </div>
        <p id="search-help" className="mt-2 text-xs text-miso-muted">
          Use Ctrl/⌘ K or / to focus. Use arrow keys to select a suggested
          search.
        </p>

        {open && (
          <div className="absolute z-30 mt-2 w-full overflow-hidden border border-miso-border bg-white shadow-panel">
            <div
              className="flex gap-2 overflow-x-auto border-b border-miso-border px-3 py-2"
              aria-label="Filter suggestions"
            >
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  aria-pressed={category === item}
                  className={`whitespace-nowrap px-3 py-1.5 text-xs font-semibold ${category === item ? "bg-miso-navy text-white" : "bg-miso-card text-miso-muted hover:bg-miso-border"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <ul
              id={listboxId}
              role="listbox"
              className="max-h-80 overflow-y-auto py-2"
            >
              {matches.length ? (
                matches.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.label}
                      id={`miso-option-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      onPointerMove={() => setActiveIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => submit(item.label)}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-3 text-left ${index === activeIndex ? "bg-sky-50 text-miso-navy" : "hover:bg-miso-card"}`}
                    >
                      <Icon
                        size={17}
                        className="text-miso-sky"
                        aria-hidden="true"
                      />
                      <span className="flex-1 text-sm font-medium">
                        {item.label}
                      </span>
                      <span className="text-xs text-miso-muted">
                        {item.category}
                      </span>
                    </li>
                  );
                })
              ) : (
                <li className="px-3 py-6 text-center text-sm text-miso-muted">
                  No matching suggestions. Press Enter to search all available
                  MISO information.
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
