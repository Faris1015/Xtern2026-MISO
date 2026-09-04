import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ChevronDown, Command, Database, Search, Sparkles, X, Zap } from "lucide-react";
import type { AudienceMode } from "../types";

type Category = "Market Pricing" | "Generation & Peaks" | "Transmission Planning" | "Jargon Acronyms";
type Suggestion = { label: string; category: Category; icon: typeof Database };

const suggestions: Suggestion[] = [
  { label: "Indiana Hub LMPs", category: "Market Pricing", icon: Database },
  { label: "Michigan Hub Spreads", category: "Market Pricing", icon: Database },
  { label: "Solar Peak Record", category: "Generation & Peaks", icon: Zap },
  { label: "Current Fuel Mix", category: "Generation & Peaks", icon: Zap },
  { label: "MTEP24 LRTP Tranche 2", category: "Transmission Planning", icon: Database },
  { label: "JTIQ Seam Upgrades", category: "Transmission Planning", icon: Database },
  ...["LMP", "CONE", "PRA", "MTEP", "LRTP", "JTIQ", "DPP", "LOLE", "OASIS", "FTR"].map((acronym) => ({
    label: `What is ${acronym}?`,
    category: "Jargon Acronyms" as Category,
    icon: BookOpen,
  })),
];

const categories = ["All", ...Array.from(new Set(suggestions.map(({ category }) => category)))];

type Props = {
  audienceMode: AudienceMode;
  onAudienceModeChange: (mode: AudienceMode) => void;
  onSearch: (query: string) => void;
  isSearching: boolean;
};

export default function OmniSearch({ audienceMode, onAudienceModeChange, onSearch, isSearching }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    return suggestions.filter((item) =>
      (category === "All" || item.category === category) &&
      (!term || item.label.toLowerCase().includes(term) || item.category.toLowerCase().includes(term)),
    );
  }, [category, query]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" || event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => setActiveIndex(0), [category, query]);

  const submit = (value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue || isSearching) return;
    setQuery(cleanValue);
    setOpen(false);
    onSearch(cleanValue);
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-miso-teal"><Sparkles size={15} /> MISO public data navigator</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-miso-ink sm:text-4xl">Find the signal in the grid.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Ask in plain English. Explore prices, generation, transmission plans, and MISO terminology from one verified starting point.</p>
        </div>
        <label className="relative flex items-center gap-2 text-sm font-medium text-slate-600">
          View as
          <select value={audienceMode} onChange={(event) => onAudienceModeChange(event.target.value as AudienceMode)} className="appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 outline-none focus:border-miso-teal focus:ring-2 focus:ring-teal-100">
            <option>Power Trader</option><option>Municipal Co-op</option><option>Public / Media</option><option>State Regulator</option>
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-2 top-3.5" aria-hidden="true" />
        </label>
      </div>

      <div className="relative mt-6">
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${open ? "border-miso-teal ring-4 ring-teal-50" : "border-slate-200"}`}>
          <Search className="shrink-0 text-miso-teal" size={21} aria-hidden="true" />
          <input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={(event) => {
            if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, Math.max(matches.length - 1, 0))); }
            if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
            if (event.key === "Enter") { event.preventDefault(); submit(matches[activeIndex]?.label ?? query); }
            if (event.key === "Escape") setOpen(false);
          }} placeholder="Try “Indiana Hub LMP”, “solar peak”, or “What is LOLE?”" aria-label="Search MISO data" aria-expanded={open} className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><X size={18} /></button>}
          <span className="hidden items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500 sm:flex"><Command size={12} /> K</span>
          <button type="button" onClick={() => submit(query)} disabled={!query.trim() || isSearching} className="rounded-lg bg-miso-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">{isSearching ? "Searching..." : "Search"}</button>
        </div>

        {open && <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-panel">
          <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-2 pb-2">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${category === item ? "bg-miso-ink text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{item}</button>)}</div>
          <ul role="listbox" className="mt-2 max-h-80 overflow-y-auto">{matches.length ? matches.map((item, index) => { const Icon = item.icon; return <li key={item.label} role="option" aria-selected={index === activeIndex}><button type="button" onMouseEnter={() => setActiveIndex(index)} onClick={() => submit(item.label)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ${index === activeIndex ? "bg-teal-50 text-miso-ink" : "hover:bg-slate-50"}`}><Icon size={17} className="text-miso-teal" /><span className="flex-1 text-sm font-medium">{item.label}</span><span className="text-xs text-slate-400">{item.category}</span></button></li>; }) : <li className="px-3 py-6 text-center text-sm text-slate-500">No matching suggestions. Press Enter to search the full backend.</li>}</ul>
          <p className="border-t border-slate-100 px-3 pt-2 text-xs text-slate-400">↑ ↓ navigate · Enter search · Esc close · Ctrl/⌘ K focus</p>
        </div>}
      </div>
    </section>
  );
}
