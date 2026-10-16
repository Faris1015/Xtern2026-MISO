import { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Search,
  ExternalLink,
  Download,
  Sparkles,
  FileText,
  Calculator,
} from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
};

export default function BpmSearchModal({ isOpen, onClose, apiBase }: Props) {
  const [query, setQuery] = useState("LMP formula");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/bpms/search?q=${encodeURIComponent(searchTerm.trim())}&top_k=6`);
      if (res.ok) {
        setResults(await res.json());
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void executeSearch(query);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bpm-rag-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6"
    >
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl border border-miso-border">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-miso-muted hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-miso-border pb-4 pr-8">
          <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-600">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 id="bpm-rag-modal-title" className="text-lg font-bold text-miso-navy flex items-center gap-2">
              Business Practice Manuals (BPM) Hybrid RAG Search
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                BM25 + Semantic
              </span>
            </h2>
            <p className="text-xs text-miso-muted">
              Section-level clause retrieval, tariff formulas, and official download packages
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void executeSearch(query);
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search BPM sections, clauses, or formulas (e.g. 'LMP formula', 'DPP queue', 'BPM 020')..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-24 text-sm text-slate-900 focus:border-miso-sky focus:outline-hidden focus:ring-2 focus:ring-sky-100"
            />
            <Search size={16} className="absolute left-3.5 text-slate-400" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 px-3 py-1 rounded bg-miso-navy text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          {/* Preset Chips */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {[
              "LMP formula",
              "DPP cluster cycle",
              "LRTP Tranche 2",
              "Virtual spread bids",
              "Scarcity ORDC",
              "BPM 002",
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setQuery(chip);
                  void executeSearch(chip);
                }}
                className="text-[11px] font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-sky-100 hover:text-sky-900 transition cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="mt-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Sparkles size={13} className="text-purple-600" />
            Top Matching Manuals &amp; Section Clauses ({results.length})
          </h3>

          <div className="space-y-3">
            {results.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition hover:border-slate-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-miso-navy">{item.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      {item.category}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 shrink-0">
                    Match: {Math.round(item.relevanceScore * 100)}%
                  </span>
                </div>

                <p className="text-xs text-slate-700 mt-2.5 leading-relaxed">
                  {item.excerpt}
                </p>

                {item.formula && (
                  <div className="mt-2.5 flex items-center gap-2 rounded bg-purple-50/80 border border-purple-200 px-3 py-1.5 text-xs font-mono text-purple-900">
                    <Calculator size={13} className="text-purple-600 shrink-0" />
                    <span><strong>Governing Formula:</strong> {item.formula}</span>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">
                    Governed under FERC Tariff Jurisdiction
                  </span>
                  <div className="flex items-center gap-3">
                    {item.downloadUrl && (
                      <a
                        href={item.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-miso-sky hover:underline font-semibold"
                      >
                        <Download size={12} />
                        <span>Download ZIP Package</span>
                      </a>
                    )}
                    {item.misoWebUrl && (
                      <a
                        href={item.misoWebUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
                      >
                        <ExternalLink size={12} />
                        <span>MISO Page</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="miso-button-primary text-xs"
          >
            Close Search
          </button>
        </div>
      </div>
    </div>
  );
}

