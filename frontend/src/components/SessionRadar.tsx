import { useEffect, useState } from "react";
import { ArrowRight, Radio, Sparkles } from "lucide-react";

type QuickStartChip = { label: string; query: string; type: string };
type Props = { apiBase: string; onSelectQuery: (query: string) => void };

const defaults: QuickStartChip[] = [
  { label: "Indiana Hub briefing", query: "Indiana Hub LMP", type: "hub" },
  { label: "Compare Indiana vs Michigan", query: "Compare Indiana and Michigan", type: "compare" },
  { label: "MISO peak records", query: "Solar and Wind Peak records", type: "peaks" },
];

export default function SessionRadar({ apiBase, onSelectQuery }: Props) {
  const [chips, setChips] = useState(defaults);
  const [context, setContext] = useState("Detected recent viewing of Indiana Hub LMPs and Solar Queue.");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBase}/api/session-prefetch`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Session prefetch failed (${response.status})`);
        return response.json() as Promise<{ sessionContext?: string; quickStartChips?: QuickStartChip[] }>;
      })
      .then((payload) => {
        if (payload.sessionContext) setContext(payload.sessionContext.replace("Active Session Radar: ", ""));
        if (payload.quickStartChips?.length) setChips(payload.quickStartChips.slice(0, 3));
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.warn("Session radar is using local defaults because the backend is unavailable.", error);
        }
      });
    return () => controller.abort();
  }, [apiBase]);

  return (
    <aside className="relative overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 via-white to-sky-50 p-4 shadow-subtle sm:p-5">
      <div className="radar-orbit absolute -right-8 -top-8 h-28 w-28 rounded-full border border-teal-200/70" aria-hidden="true" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 rounded-xl bg-miso-ink p-2.5 text-white"><Radio size={20} aria-hidden="true" /></div>
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-miso-teal"><Sparkles size={14} /> Session-aware radar</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-700">{context} Click a starting point to preload the canvas.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {chips.map((chip) => <button key={chip.label} type="button" onClick={() => onSelectQuery(chip.query)} className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-miso-ink shadow-sm transition hover:border-miso-teal hover:text-miso-teal">{chip.label}<ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></button>)}
        </div>
      </div>
    </aside>
  );
}
