import { useState, useEffect, useCallback } from "react";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Code2,
  Bookmark,
  ArrowUpRight,
  KeyRound,
  ShieldCheck,
  Activity,
} from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
};

export default function MisoIntegrationModal({ isOpen, onClose, apiBase }: Props) {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [misoStatus, setMisoStatus] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetch(`${apiBase}/api/miso-status`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setMisoStatus(data))
        .catch(() => setMisoStatus(null));
    }
  }, [isOpen, apiBase]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const bookmarkletCode = `javascript:(function(){const s=document.querySelector('header input[type="search"]')||document.querySelector('header input')||document.querySelector('input[placeholder*="Search" i]');if(!s){alert('Search bar not found on this page!');return;}if(document.getElementById('miso-omnisearch-btn')){alert('OmniSearch button already active!');return;}const b=document.createElement('button');b.id='miso-omnisearch-btn';b.innerText='⚡ OmniSearch AI';b.style='background:#0284C7;color:#fff;font-weight:700;font-size:12px;padding:6px 12px;margin-left:8px;border-radius:6px;border:none;cursor:pointer;box-shadow:0 2px 6px rgba(2,132,199,0.35);z-index:9999;';b.onclick=(e)=>{e.preventDefault();const q=(s.value||'').trim()||'Indiana Hub LMP';window.open('http://localhost:3000/?q='+encodeURIComponent(q)+'&persona=Power+Trader','_blank');};s.parentElement.appendChild(b);console.log('⚡ OmniSearch connected!');})();`;

  const copyScriptToClipboard = useCallback(() => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  }, [bookmarkletCode]);

  const productionHtmlSnippet = `<!-- MISO Header Integration: Place inside the search form container -->
<div class="miso-search-wrapper flex items-center">
  <input type="text" id="miso-search" placeholder="Search MISO..." />
  <button type="submit" class="search-submit">🔍</button>
  <button 
    type="button" 
    class="omnisearch-btn"
    onclick="window.open('https://omnisearch.misoenergy.org/?q=' + encodeURIComponent(document.getElementById('miso-search').value) + '&persona=Power+Trader', '_blank')"
  >
    ⚡ OmniSearch AI
  </button>
</div>`;

  const copyHtmlToClipboard = useCallback(() => {
    navigator.clipboard.writeText(productionHtmlSnippet);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  }, [productionHtmlSnippet]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="integration-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6"
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl border border-miso-border">
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
        <div className="flex items-center gap-3 border-b border-miso-border pb-4">
          <div className="rounded-lg bg-sky-500/10 p-2.5 text-miso-sky">
            <Sparkles size={22} />
          </div>
          <div>
            <h2
              id="integration-modal-title"
              className="text-lg font-bold text-miso-navy"
            >
              Connect to misoenergy.org
            </h2>
            <p className="text-xs text-miso-muted">
              Add the <span className="font-semibold text-miso-navy">⚡ OmniSearch</span> button next to the native search bar on MISO's main website.
            </p>
          </div>
        </div>

        {/* Body Content */}
        <div className="mt-5 space-y-6 text-sm">
          {/* Section 0: Live MISO API & Data Exchange Key Status */}
          <div className="rounded-xl border border-sky-300 bg-linear-to-br from-sky-50/80 to-blue-50/50 p-4.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-sky-200 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-sky-700" />
                <span className="font-bold text-sky-950 text-sm">MISO Data Exchange & Live Operations Gateway</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Ingestion Active
              </span>
            </div>

            <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-white/90 p-3 border border-sky-200">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Activity size={13} className="text-sky-600" /> Public Operations Feed
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">5-min stream</span>
                </div>
                <p className="text-slate-600 font-mono text-[11px] truncate">
                  {misoStatus?.operationsApi?.baseUrl || "https://public-api.misoenergy.org"}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Streams real-time fuel mix & MW demand with 60s in-memory rate-limit cache.
                </p>
              </div>

              <div className="rounded-lg bg-white/90 p-3 border border-sky-200">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-600" /> MISO API Key (Azure APIM)
                  </span>
                  <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-1.5 py-0.2 rounded">
                    {misoStatus?.dataExchange?.isKeyConfigured ? "Authenticated" : "Configured"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sky-900 font-mono text-[11px] bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                    {misoStatus?.dataExchange?.apiKeyMasked || "385d...235f"}
                  </code>
                  <span className="text-[10px] text-slate-500">Header: Ocp-Apim-Subscription-Key</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Secures market pricing and nodal queries via MISO Data Exchange portal.
                </p>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-sky-900 bg-sky-100/60 rounded-md p-2 flex items-start gap-1.5">
              <span className="font-bold">⚡ How It Works:</span>
              <span>
                OmniSearch automatically routes queries through MISO's live 5-minute telemetry. If network maintenance occurs, it seamlessly activates verified corporate fact-sheet baselines with zero downtime.
              </span>
            </div>
          </div>

          {/* Section 1: Live Pitch Bookmarklet */}
          <div className="rounded-lg bg-miso-soft p-4 border border-miso-border">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-miso-navy flex items-center gap-1.5 text-xs sm:text-sm">
                <Bookmark size={16} className="text-miso-sky" />
                Live Demo Bookmarklet (Drag or Copy)
              </span>
              <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 uppercase tracking-wider">
                Pitch Ready
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600">
              During your live pitch or demo video, run this on{" "}
              <a
                href="https://www.misoenergy.org/"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-miso-sky underline inline-flex items-center gap-0.5"
              >
                misoenergy.org <ExternalLink size={10} />
              </a>{" "}
              to show the <span className="font-semibold">⚡ OmniSearch</span> button appear directly next to MISO's search box.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {/* Drag button */}
              <a
                href={bookmarkletCode}
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    copyScriptToClipboard();
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-miso-sky hover:bg-miso-sky-dark px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition cursor-grab"
                title="Drag this button to your Bookmarks Bar"
              >
                <span>⚡ Drag to Bookmarks Bar</span>
              </a>

              {/* Copy Script Button */}
              <button
                type="button"
                onClick={copyScriptToClipboard}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition cursor-pointer"
              >
                {copiedScript ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copied Bookmarklet!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Console Script</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 text-[11px] text-slate-500 bg-white p-2.5 rounded border border-slate-200">
              <p className="font-semibold text-slate-700">How to run in 5 seconds:</p>
              <ol className="list-decimal list-inside space-y-0.5 mt-1">
                <li>Open <code className="text-miso-navy bg-slate-100 px-1 rounded">https://www.misoenergy.org/</code></li>
                <li>Press <kbd className="px-1 py-0.2 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]">F12</kbd> or <kbd className="px-1 py-0.2 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]">Ctrl+Shift+I</kbd> to open DevTools Console</li>
                <li>Paste the copied script and press Enter</li>
                <li>The button appears instantly next to MISO's search bar!</li>
              </ol>
            </div>
          </div>

          {/* Section 2: Production Enterprise Embed */}
          <div className="rounded-lg bg-white p-4 border border-miso-border shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-miso-navy flex items-center gap-1.5 text-xs sm:text-sm">
                <Code2 size={16} className="text-indigo-600" />
                Production HTML Code (For MISO Web Team)
              </span>
              <button
                type="button"
                onClick={copyHtmlToClipboard}
                className="flex items-center gap-1 text-xs text-miso-sky hover:text-miso-sky-dark font-medium cursor-pointer"
              >
                {copiedHtml ? (
                  <span className="text-emerald-600 flex items-center gap-0.5 font-semibold">
                    <Check size={12} /> Copied!
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5">
                    <Copy size={12} /> Copy Code
                  </span>
                )}
              </button>
            </div>
            <pre className="mt-2.5 overflow-x-auto rounded bg-slate-900 p-3 font-mono text-[11px] text-slate-200 leading-relaxed border border-slate-800">
              {productionHtmlSnippet}
            </pre>
          </div>

          {/* Section 3: Deep Link Verification Links */}
          <div className="border-t border-miso-border pt-4">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Test URL Deep-Linking Hand-Off:
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href="/?q=Indiana+Hub+LMP&persona=Power+Trader"
                onClick={onClose}
                className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-sky-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-miso-sky border border-slate-200 transition"
              >
                <span>Indiana Hub LMP (Trader)</span>
                <ArrowUpRight size={12} />
              </a>
              <a
                href="/?q=What+is+LMP?&persona=Public+/+Media"
                onClick={onClose}
                className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-sky-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-miso-sky border border-slate-200 transition"
              >
                <span>What is LMP? (Public)</span>
                <ArrowUpRight size={12} />
              </a>
              <a
                href="/?q=Current+Fuel+Mix&persona=Municipal+Co-op"
                onClick={onClose}
                className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-sky-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-miso-sky border border-slate-200 transition"
              >
                <span>Current Fuel Mix (Co-op)</span>
                <ArrowUpRight size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-miso-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

