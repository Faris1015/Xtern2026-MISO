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

type Suggestion = {
  label: string;
  category: Category;
  icon: typeof Database;
};

const suggestions: Suggestion[] = [
  { label: "Indiana Hub LMPs", category: "Market Pricing", icon: Database },
  { label: "Illinois Hub LMPs", category: "Market Pricing", icon: Database },
  { label: "Michigan Hub Spreads", category: "Market Pricing", icon: Database },
  { label: "Minnesota Hub LMPs", category: "Market Pricing", icon: Database },
  { label: "Louisiana Hub LMPs", category: "Market Pricing", icon: Database },
  { label: "Texas Hub LMPs", category: "Market Pricing", icon: Database },
  { label: "Solar Peak Record", category: "Generation & Peaks", icon: Zap },
  { label: "Wind Peak Record", category: "Generation & Peaks", icon: Zap },
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
  const [activeIndex, setActiveIndex] = useState(-1);
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
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeWhenOutside);
    return () => document.removeEventListener("pointerdown", closeWhenOutside);
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
  }, [category, query]);

  const submit = (value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue || isSearching) return;

    setQuery(cleanValue);
    setOpen(false);
    setActiveIndex(-1);
    onSearch(cleanValue);
  };

  const activeOptionId =
    open && activeIndex >= 0 && matches[activeIndex]
      ? `miso-option-${activeIndex}`
      : undefined;

  return (
    <section
      aria-labelledby="search-heading"
      aria-busy={isSearching}
      className="miso-panel miso-panel-header overflow-visible"
    >
      <div className="p-6 lg:p-7">
        <div className="flex items-end justify-between gap-8">
          <div>
            <p className="miso-eyebrow">Unified public information search</p>
            <h1
              id="search-heading"
              className="mt-1 text-3xl font-bold tracking-[-0.025em] text-miso-navy"
            >
              Search MISO market and planning information
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-miso-muted">
              Search commercial hubs, generation records, transmission plans,
              and MISO terminology from one workspace.
            </p>
          </div>

          <label className="relative shrink-0 text-xs font-semibold uppercase tracking-[0.08em] text-miso-muted">
            Audience
            <span className="relative mt-1 block">
              <select
                value={audienceMode}
                onChange={(event) =>
                  onAudienceModeChange(event.target.value as AudienceMode)
                }
                className="min-w-48 appearance-none border border-miso-border bg-white py-2.5 pl-3 pr-9 text-sm font-semibold normal-case tracking-normal text-miso-navy outline-none focus-visible:border-miso-sky focus-visible:ring-2 focus-visible:ring-miso-soft"
              >
                <option>Power Trader</option>
                <option>Municipal Co-op</option>
                <option>Public / Media</option>
                <option>State Regulator</option>
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-3 text-miso-muted"
                aria-hidden="true"
              />
            </span>
          </label>
        </div>

        <div ref={rootRef} className="relative mt-6">
          <div
            className={`flex items-center gap-3 border bg-white px-4 py-3 transition ${
              open
                ? "border-miso-sky shadow-[0_0_0_3px_rgba(0,130,202,0.12)]"
                : "border-miso-border"
            }`}
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
                  setOpen(true);
                  setActiveIndex((index) =>
                    index <= 0 ? Math.max(matches.length - 1, 0) : index - 1,
                  );
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  submit(
                    activeIndex >= 0
                      ? (matches[activeIndex]?.label ?? query)
                      : query,
                  );
                } else if (event.key === "Escape") {
                  setOpen(false);
                  setActiveIndex(-1);
                }
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
              className="min-w-0 flex-1 bg-transparent text-base text-miso-slate outline-none placeholder:text-slate-400 focus:outline-none focus-visible:outline-none focus:ring-0"
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
            <span className="hidden items-center gap-1 border border-miso-border bg-miso-card px-2 py-1 text-xs text-miso-muted lg:flex">
              <Command size={12} aria-hidden="true" /> K
            </span>
            <button
              type="button"
              onClick={() => submit(query)}
              disabled={!query.trim() || isSearching}
              className="miso-button-primary min-w-28"
            >
              {isSearching ? "Searching…" : "Search"}
            </button>
          </div>

          <p id="search-help" className="mt-2 text-xs text-miso-muted">
            Press Ctrl/⌘ K or / to focus. Use the arrow keys to select a
            suggested search.
          </p>

          {open && (
            <div className="absolute z-30 mt-2 w-full overflow-hidden border border-miso-border bg-white shadow-panel">
              <div
                className="flex gap-1 border-b border-miso-border bg-miso-card px-3 py-2"
                aria-label="Filter suggestions"
              >
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    aria-pressed={category === item}
                    className={`whitespace-nowrap border-b-2 px-3 py-1.5 text-xs font-semibold transition ${
                      category === item
                        ? "border-miso-sky text-miso-navy"
                        : "border-transparent text-miso-muted hover:text-miso-navy"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <ul
                id={listboxId}
                role="listbox"
                className="max-h-80 overflow-y-auto py-1"
              >
                {matches.length ? (
                  matches.map((item, index) => {
                    const Icon = item.icon;
                    const active = index === activeIndex;
                    return (
                      <li
                        key={item.label}
                        id={`miso-option-${index}`}
                        role="option"
                        aria-selected={active}
                        onPointerMove={() => setActiveIndex(index)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => submit(item.label)}
                        className={`flex cursor-pointer items-center gap-3 border-l-4 px-4 py-3 text-left transition ${
                          active
                            ? "border-miso-sky bg-miso-soft text-miso-navy"
                            : "border-transparent hover:bg-miso-card"
                        }`}
                      >
                        <Icon
                          size={17}
                          className="text-miso-sky"
                          aria-hidden="true"
                        />
                        <span className="flex-1 text-sm font-semibold">
                          {item.label}
                        </span>
                        <span className="text-xs text-miso-muted">
                          {item.category}
                        </span>
                      </li>
                    );
                  })
                ) : (
                  <li className="px-4 py-7 text-center text-sm text-miso-muted">
                    No matching suggestion. Press Enter to search the available
                    MISO information.
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
