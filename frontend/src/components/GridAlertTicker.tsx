import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  Zap,
  TrendingUp,
  DollarSign,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from "lucide-react";

type RegionStatus = {
  demandMw: number;
  status: string;
  reserveMarginPct: number;
};

type GridTelemetry = {
  forecastedPeakDemandMw: number;
  currentDemandMw: number;
  marginalEnergyCost: number;
  scheduledNetInterchangeMw: number;
  status: string;
  statusSeverity: string;
  statusDescription: string;
  timestamp: string;
  regions: Record<string, RegionStatus>;
  drillDownQueries: {
    demand: string;
    peak: string;
    mec: string;
    interchange: string;
  };
};

type Props = {
  apiBase: string;
  onSearch: (query: string) => void;
};

export default function GridAlertTicker({ apiBase, onSearch }: Props) {
  const [telemetry, setTelemetry] = useState<GridTelemetry | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`${apiBase}/api/grid-telemetry`);
        if (res.ok) {
          const data: GridTelemetry = await res.json();
          if (active) setTelemetry(data);
        }
      } catch {
        // Fallback default snapshot if offline
        if (active) {
          setTelemetry({
            forecastedPeakDemandMw: 107605,
            currentDemandMw: 92893,
            marginalEnergyCost: 45.01,
            scheduledNetInterchangeMw: -4248,
            status: "Normal Operations",
            statusSeverity: "normal",
            statusDescription:
              "All regional operating reserves adequate across North, Central, and South regions. No Maximum Generation Emergencies active.",
            timestamp: "2026-09-09T09:58:00-05:00",
            regions: {
              North: { demandMw: 18450, status: "Normal", reserveMarginPct: 19.4 },
              Central: { demandMw: 49120, status: "Normal", reserveMarginPct: 18.2 },
              South: { demandMw: 25323, status: "Normal", reserveMarginPct: 21.0 },
            },
            drillDownQueries: {
              demand: "Current Fuel Mix",
              peak: "Solar and Wind Peak records",
              mec: "Indiana Hub LMP",
              interchange: "transmission line miles by category",
            },
          });
        }
      }
    };

    void fetchTelemetry();
    const interval = setInterval(() => void fetchTelemetry(), 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [apiBase]);

  const handleCardClick = useCallback(
    (query: string) => {
      onSearch(query);
    },
    [onSearch],
  );

  if (!telemetry) return null;

  return (
    <aside
      aria-label="MISO Live Grid Conditions and Telemetry"
      className="border-b border-slate-700 bg-slate-900 text-slate-100 shadow-inner"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={14} aria-hidden="true" />
              {telemetry.status}
            </span>
            <span className="hidden md:inline text-slate-400 text-[11px]">
              · {telemetry.statusDescription}
            </span>
          </div>

          {/* Quick Telemetry Cards */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1 scrollbar-none">
            {/* Current Demand */}
            <button
              type="button"
              onClick={() => handleCardClick(telemetry.drillDownQueries.demand)}
              className="group flex items-center gap-1.5 rounded bg-slate-800/80 px-2.5 py-1 text-left transition hover:bg-slate-800 hover:ring-1 hover:ring-miso-sky cursor-pointer"
              title="Click to view real-time generation fuel mix"
            >
              <Zap size={13} className="text-amber-400" aria-hidden="true" />
              <span className="text-[11px] text-slate-400 group-hover:text-slate-300">
                Demand:
              </span>
              <span className="font-mono font-bold text-white">
                {telemetry.currentDemandMw.toLocaleString()} MW
              </span>
            </button>

            {/* Forecast Peak */}
            <button
              type="button"
              onClick={() => handleCardClick(telemetry.drillDownQueries.peak)}
              className="group flex items-center gap-1.5 rounded bg-slate-800/80 px-2.5 py-1 text-left transition hover:bg-slate-800 hover:ring-1 hover:ring-miso-sky cursor-pointer"
              title="Click to view all-time fuel and peak records"
            >
              <TrendingUp size={13} className="text-sky-400" aria-hidden="true" />
              <span className="text-[11px] text-slate-400 group-hover:text-slate-300">
                Forecast Peak:
              </span>
              <span className="font-mono font-bold text-white">
                {telemetry.forecastedPeakDemandMw.toLocaleString()} MW
              </span>
            </button>

            {/* Marginal Energy Cost */}
            <button
              type="button"
              onClick={() => handleCardClick(telemetry.drillDownQueries.mec)}
              className="group flex items-center gap-1.5 rounded bg-slate-800/80 px-2.5 py-1 text-left transition hover:bg-slate-800 hover:ring-1 hover:ring-emerald-400 cursor-pointer"
              title="Click to explore real-time LMP pricing"
            >
              <DollarSign size={13} className="text-emerald-400" aria-hidden="true" />
              <span className="text-[11px] text-slate-400 group-hover:text-slate-300">
                MEC:
              </span>
              <span className="font-mono font-bold text-emerald-400">
                ${telemetry.marginalEnergyCost.toFixed(2)}
              </span>
            </button>

            {/* Net Scheduled Interchange */}
            <button
              type="button"
              onClick={() => handleCardClick(telemetry.drillDownQueries.interchange)}
              className="group hidden lg:flex items-center gap-1.5 rounded bg-slate-800/80 px-2.5 py-1 text-left transition hover:bg-slate-800 hover:ring-1 hover:ring-miso-sky cursor-pointer"
              title="Click to view transmission & interchange details"
            >
              <ArrowRightLeft size={13} className="text-indigo-400" aria-hidden="true" />
              <span className="text-[11px] text-slate-400 group-hover:text-slate-300">
                Interchange:
              </span>
              <span className="font-mono font-bold text-slate-200">
                {telemetry.scheduledNetInterchangeMw.toLocaleString()} MW
              </span>
            </button>

            {/* Regional breakdown toggle */}
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
            >
              <span>Regions</span>
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        {/* Regional Detail Drawer */}
        {isExpanded && (
          <div className="mt-2 grid grid-cols-1 gap-2 border-t border-slate-800 pt-2 sm:grid-cols-3">
            {Object.entries(telemetry.regions).map(([region, data]) => (
              <div
                key={region}
                className="flex items-center justify-between rounded bg-slate-950/60 px-3 py-1.5 text-[11px]"
              >
                <div className="flex items-center gap-1.5">
                  <Activity size={12} className="text-miso-sky" />
                  <span className="font-semibold text-slate-200">
                    {region} Region:
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-300">
                    {data.demandMw.toLocaleString()} MW
                  </span>
                  <span className="text-emerald-400 font-medium">
                    +{data.reserveMarginPct}% reserves
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

