import { useCallback, useState } from "react";
import { Activity, ExternalLink, RefreshCw } from "lucide-react";
import ComparisonMatrix from "./components/ComparisonMatrix";
import KnowledgeCanvas from "./components/KnowledgeCanvas";
import OmniSearch from "./components/OmniSearch";
import SessionRadar from "./components/SessionRadar";
import type { AudienceMode, SearchResponse } from "./types";

const API_BASE = "http://localhost:8000";

export default function App() {
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("Power Trader");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    setError("");
    setIsSearching(true);
    try {
      const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(cleanQuery)}&persona=${encodeURIComponent(audienceMode)}`);
      if (!response.ok) throw new Error(`Search failed (${response.status})`);
      setResult(await response.json() as SearchResponse);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Unable to reach the backend.");
    } finally {
      setIsSearching(false);
    }
  }, [audienceMode]);

  return (
    <main className="min-h-screen bg-canvas">
      <header className="border-b border-white/10 bg-miso-ink text-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-miso-teal p-2"><Activity size={20} aria-hidden="true" /></div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight">MISO OmniSearch</p>
              <p className="text-xs text-slate-300">Public energy data, made navigable</p>
            </div>
          </div>
          <a href={`${API_BASE}/docs`} target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-200 transition hover:border-white/50 hover:text-white sm:flex">
            API documentation <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] space-y-6 px-5 py-8 lg:px-10 lg:py-10">
        <OmniSearch audienceMode={audienceMode} onAudienceModeChange={setAudienceMode} onSearch={search} isSearching={isSearching} />
        <SessionRadar apiBase={API_BASE} onSelectQuery={search} />
        {error && <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><span>{error}. Start the backend with <code className="rounded bg-red-100 px-1">uvicorn main:app --reload</code>.</span><button type="button" onClick={() => setError("")} aria-label="Dismiss error"><RefreshCw size={16} /></button></div>}
        <KnowledgeCanvas apiBase={API_BASE} result={result} onFollowUp={search} />
        <ComparisonMatrix apiBase={API_BASE} />
      </div>
    </main>
  );
}
