import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  Command,
  Search,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

export type AudienceMode =
  | "Power Trader"
  | "Municipal Co-op"
  | "Public / Media"
  | "State Regulator";

type SuggestionCategory =
  | "Market Pricing"
  | "Generation & Peaks"
  | "Transmission Planning"
  | "Jargon Acronyms";

type Suggestion = {
  label: string;
  category: SuggestionCategory;
  icon: typeof BarChart3;
};

const suggestions: Suggestion[] = [
  { label: "Indiana Hub LMPs", category: "Market Pricing", icon: BarChart3 },
  { label: "Michigan Hub Spreads", category: "Market Pricing", icon: BarChart3 },
  { label: "Solar Peak Record", category: "Generation & Peaks", icon: Zap },
  { label: "Current Fuel Mix", category: "Generation & Peaks", icon: Zap },
  { label: "MTEP24 LRTP Tranche 2", category: "Transmission Planning", icon: Sparkles },
  { label: "JTIQ Seam Upgrades", category: "Transmission Planning", icon: Sparkles },
  { label: "What is CONE?", category: "Jargon Acronyms", icon: BookOpen },
  { label: "Explain LMP formula", category: "Jargon Acronyms", icon: BookOpen },
];

const categories = ["All", ...Array.from(new Set(suggestions.map(({ category }) => category)))];

type OmniSearchProps = {
  audienceMode: AudienceMode;
  onAudienceModeChange: (mode: AudienceMode) => void;
  onSearch?: (query: string) => void;
};

export default function OmniSearch({
  audienceMode,
  onAudienceModeChange,
  onSearch,
}: OmniSearchProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return suggestions.filter((suggestion) => {
      const matchesCategory = category === "All" || suggestion.category === category;
      const matchesQuery =
        !normalizedQuery ||
        suggestion.label.toLowerCase().includes(normalizedQuery) ||
        suggestion.category.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => setActiveIndex(0), [category, query]);

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setIsOpen(false);
    onSearch?.(trimmed);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(filteredSuggestions.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      submit(filteredSuggestions[activeIndex]?.label ?? query);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-miso-sky">
            <Sparkles size={16} aria-hidden="true" />
            Intelligent energy discovery
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-miso-navy sm:text-4xl">
            What are you looking for?
          </h1>
        </div>
        <label className="relative flex items-center gap-2 text-sm font-medium text-slate-600">
          Audience
          <select
            value={audienceMode}
            onChange={(event) => onAudienceModeChange(event.target.value as AudienceMode)}
            className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 shadow-sm outline-none transition focus:border-miso-sky focus:ring-2 focus:ring-sky-100"
          >
            <option>Power Trader</option>
            <option>Municipal Co-op</option>
            <option>Public / Media</option>
            <option>State Regulator</option>
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-2 top-3.5" aria-hidden="true" />
        </label>
      </div>

      <div className="relative">
        <div className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 transition ${isOpen ? "border-miso-sky shadow-glow" : "border-slate-200 shadow-sm"}`}>
          <Search className="shrink-0 text-miso-sky" size={22} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about hubs, fuel peaks, transmission, or MISO acronyms..."
            aria-label="Search MISO energy data"
            aria-expanded={isOpen}
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X size={18} />
            </button>
          )}
          <span className="hidden items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500 sm:flex">
            <Command size={12} aria-hidden="true" /> K
          </span>
          <button type="button" onClick={() => submit(query)} className="rounded-lg bg-miso-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
            Search
          </button>
        </div>

        {isOpen && (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-2 pb-2">
              {categories.map((item) => (
                <button key={item} type="button" onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${category === item ? "bg-miso-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {item}
                </button>
              ))}
            </div>
            <ul role="listbox" aria-label="Search suggestions" className="mt-2 max-h-72 overflow-y-auto">
              {filteredSuggestions.length ? (
                filteredSuggestions.map((suggestion, index) => {
                  const Icon = suggestion.icon;
                  return (
                    <li key={suggestion.label} role="option" aria-selected={index === activeIndex}>
                      <button type="button" onMouseEnter={() => setActiveIndex(index)} onClick={() => submit(suggestion.label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ${index === activeIndex ? "bg-sky-50 text-miso-navy" : "text-slate-700 hover:bg-slate-50"}`}>
                        <Icon size={17} className="text-miso-sky" aria-hidden="true" />
                        <span className="flex-1 text-sm font-medium">{suggestion.label}</span>
                        <span className="text-xs text-slate-400">{suggestion.category}</span>
                      </button>
                    </li>
                  );
                })
              ) : (
                <li className="px-3 py-6 text-center text-sm text-slate-500">No matching suggestions yet.</li>
              )}
            </ul>
            <p className="border-t border-slate-100 px-3 pt-2 text-xs text-slate-400">Use ↑ ↓ to navigate, Enter to select, Esc to close.</p>
          </div>
        )}
      </div>
    </section>
  );
}