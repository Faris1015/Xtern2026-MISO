import { useEffect, useState } from "react";
import { ArrowRight, Radio, Sparkles } from "lucide-react";

type QuickStartChip = { label: string; query: string; type: string };

type SessionRadarProps = {
  onSelectQuery?: (query: string) => void;
};

const defaultChips: QuickStartChip[] = [
  { label: "Indiana Hub Briefing", query: "Indiana Hub LMP", type: "hub" },
  { label: "Compare vs. Michigan", query: "Compare Indiana and Michigan", type: "compare" },
  { label: "MISO Peak Records", query: "Solar and Wind Peak records", type: "peaks" },
];

export default function SessionRadar({ onSelectQuery }: SessionRadarProps) {
  const [chips, setChips] = useState(defaultChips);

  useEffect(() => {
    const controller = new AbortController();
    fetch("http://localhost:8000/api/session-prefetch", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Session prefetch failed: ${response.status}`);
        return response.json();
      })
      .then((payload: { quickStartChips?: QuickStartChip[] }) => {
        if (payload.quickStartChips?.length) setChips(payload.quickStartChips.slice(0, 3));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("Session radar is using local defaults because the backend is unavailable.", error);
      });
    return () => controller.abort();
  }, []);

  return (
    <aside className="relative overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-4 shadow-sm sm:p-5">
      <div className="absolute -right-8 -top-8 h-28 w-28 animate-pulse rounded-full border border-sky-200/70" />
      <div className="absolute -right-2 -top-2 h-16 w-16 animate-ping rounded-full border border-sky-300/70" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 rounded-xl bg-miso-navy p-2.5 text-white">
            <Radio size={20} aria-hidden="true" />
          </div>
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-miso-sky">
              <Sparkles size={14} aria-hidden="true" />
              Session-aware radar
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-700">
              Detected recent viewing of <strong>Indiana Hub LMPs</strong> and <strong>Solar Queue</strong>. Pre-load a briefing with zero cold-start delay.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {chips.map((chip) => (
            <button key={chip.label} type="button" onClick={() => onSelectQuery?.(chip.query)} className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-miso-navy shadow-sm transition hover:border-miso-sky hover:text-miso-sky">
              {chip.label}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}