import { useState } from "react";
import { Activity, ExternalLink } from "lucide-react";
import OmniSearch, { type AudienceMode } from "./components/OmniSearch";
import SessionRadar from "./components/SessionRadar";

export default function App() {
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("Power Trader");
  const [lastSearch, setLastSearch] = useState("Indiana Hub LMP");

  return (
    <main className="min-h-screen">
      <header className="bg-miso-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-miso-sky p-2"><Activity size={20} aria-hidden="true" /></div>
            <div>
              <p className="font-bold tracking-wide">MISO OmniSearch</p>
              <p className="text-xs text-sky-100">Predictive context & comparative knowledge</p>
            </div>
          </div>
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hidden items-center gap-1 text-sm text-sky-100 hover:text-white sm:flex">
            API Docs <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </header>
      <div className="mx-auto max-w-6xl space-y-6 px-5 py-10 sm:px-8">
        <OmniSearch audienceMode={audienceMode} onAudienceModeChange={setAudienceMode} onSearch={setLastSearch} />
        <SessionRadar onSelectQuery={setLastSearch} />
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Ready to explore</p>
          <h2 className="mt-2 text-xl font-bold text-miso-navy">{lastSearch}</h2>
          <p className="mt-2 text-sm text-slate-500">Search results will connect to the FastAPI `/api/search` endpoint in the next canvas milestone.</p>
        </section>
      </div>
    </main>
  );
}