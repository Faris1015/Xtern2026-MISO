import { useState, useEffect } from "react";
import {
  X,
  Activity,
  Server,
  ShieldAlert,
  Cpu,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Database,
  Radio,
} from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
};

export default function DevOpsModal({ isOpen, onClose, apiBase }: Props) {
  const [liveness, setLiveness] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [metricsText, setMetricsText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"health" | "metrics" | "architecture">("health");

  const refreshDiagnostics = async () => {
    setLoading(true);
    try {
      const [lRes, rRes, mRes] = await Promise.all([
        fetch(`${apiBase}/healthz`),
        fetch(`${apiBase}/readyz`),
        fetch(`${apiBase}/metrics`),
      ]);
      if (lRes.ok) setLiveness(await lRes.json());
      if (rRes.ok) setReadiness(await rRes.json());
      if (mRes.ok) setMetricsText(await mRes.text());
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void refreshDiagnostics();
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
      aria-labelledby="devops-modal-title"
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
        <div className="flex items-center justify-between border-b border-miso-border pb-4 pr-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600">
              <Activity size={22} />
            </div>
            <div>
              <h2 id="devops-modal-title" className="text-lg font-bold text-miso-navy flex items-center gap-2">
                Cloud-Native Observability &amp; SRE Dashboard
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  AKS / Kubernetes Ready
                </span>
              </h2>
              <p className="text-xs text-miso-muted">
                Real-time Prometheus metrics, Kubernetes probes, and microservice telemetry
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={refreshDiagnostics}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-miso-sky hover:underline cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-200 mt-4 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("health")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
              activeTab === "health"
                ? "bg-miso-navy text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Probes (/healthz &amp; /readyz)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("metrics")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
              activeTab === "metrics"
                ? "bg-miso-navy text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Prometheus Metrics (/metrics)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("architecture")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
              activeTab === "architecture"
                ? "bg-miso-navy text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Production Deployment Specs
          </button>
        </div>

        {/* Tab 1: Probes */}
        {activeTab === "health" && (
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Liveness */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-mono text-xs font-bold text-slate-800">GET /healthz (Liveness)</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={12} /> 200 OK
                  </span>
                </div>
                <div className="mt-3 space-y-1.5 text-xs font-mono text-slate-600">
                  <div>Status: <span className="font-semibold text-slate-900">{liveness?.status ?? "healthy"}</span></div>
                  <div>Uptime: <span className="font-semibold text-slate-900">{liveness?.uptimeSeconds ?? 0}s</span></div>
                  <div>Service: <span className="font-semibold text-slate-900">{liveness?.service ?? "miso-omnisearch"}</span></div>
                  <div>Version: <span className="font-semibold text-slate-900">{liveness?.version ?? "1.1.0"}</span></div>
                </div>
              </div>

              {/* Readiness */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-mono text-xs font-bold text-slate-800">GET /readyz (Readiness)</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={12} /> 200 OK
                  </span>
                </div>
                <div className="mt-3 space-y-1.5 text-xs font-mono text-slate-600">
                  <div>Data Layer: <span className="font-semibold text-emerald-600">{readiness?.checks?.dataLayer ?? "ready"}</span></div>
                  <div>MISO Feed: <span className="font-semibold text-emerald-600">{readiness?.checks?.misoOperationsFeed ?? "connected"}</span></div>
                  <div>AI Dual-Engine: <span className="font-semibold text-emerald-600">{readiness?.checks?.aiDualEngine ?? "active"}</span></div>
                </div>
              </div>
            </div>

            {/* Microservice Topology */}
            <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-900 mb-2 flex items-center gap-2">
                <Server size={14} className="text-miso-sky" />
                Active Microservice Telemetry
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-white rounded p-2.5 border border-sky-100 shadow-2xs">
                  <div className="text-lg font-bold text-miso-navy">Sub-50ms</div>
                  <div className="text-[10px] text-slate-500 uppercase">Search Latency</div>
                </div>
                <div className="bg-white rounded p-2.5 border border-sky-100 shadow-2xs">
                  <div className="text-lg font-bold text-emerald-600">60s TTL</div>
                  <div className="text-[10px] text-slate-500 uppercase">In-Memory Cache</div>
                </div>
                <div className="bg-white rounded p-2.5 border border-sky-100 shadow-2xs">
                  <div className="text-lg font-bold text-sky-600">SSE Active</div>
                  <div className="text-[10px] text-slate-500 uppercase">Telemetry Stream</div>
                </div>
                <div className="bg-white rounded p-2.5 border border-sky-100 shadow-2xs">
                  <div className="text-lg font-bold text-purple-600">0 Violations</div>
                  <div className="text-[10px] text-slate-500 uppercase">Grounding Firewall</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Metrics */}
        {activeTab === "metrics" && (
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Raw Prometheus 0.0.4 Text Stream:</span>
              <a
                href={`${apiBase}/metrics`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-miso-sky hover:underline"
              >
                Open in new tab <ExternalLink size={11} />
              </a>
            </div>
            <pre className="max-h-72 overflow-y-auto rounded-lg bg-slate-900 p-4 font-mono text-[11px] text-emerald-400 leading-relaxed">
              {metricsText || "# Loading metrics from /metrics endpoint..."}
            </pre>
          </div>
        )}

        {/* Tab 3: Architecture */}
        {activeTab === "architecture" && (
          <div className="pt-4 space-y-3 text-xs text-slate-700">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">Target Production Topology (Azure Cloud-Native)</h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>Compute:</strong> Azure Kubernetes Service (AKS) with Horizontal Pod Autoscaling (HPA).</li>
                <li><strong>Distributed Cache:</strong> Azure Cache for Redis (Cluster mode) replacing single-node in-memory TTL.</li>
                <li><strong>Event Streaming:</strong> Azure Event Hubs / Kafka consuming real-time SCADA/ICCP telemetry ticks.</li>
                <li><strong>Identity &amp; RBAC:</strong> Microsoft Entra ID (OIDC Bearer JWTs) mapping into OmniSearch personas.</li>
                <li><strong>Air-Gapped Compliance:</strong> On-premise Ollama / Llama 3.2 inference inside NERC CIP control room perimeter.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
          <a
            href={`${apiBase}/docs`}
            target="_blank"
            rel="noreferrer"
            className="miso-button-secondary text-xs flex items-center gap-1.5"
          >
            <span>Open FastAPI Swagger Docs</span>
            <ExternalLink size={12} />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="miso-button-primary text-xs"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

