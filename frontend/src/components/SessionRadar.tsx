import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Clock,
  Lightbulb,
  Sun,
  Wind,
} from "lucide-react";
import { parseSessionPrefetchResponse } from "../api/guards";
import type { SessionPrefetchResponse, SessionQuickStartChip } from "../types";

type Props = {
  apiBase: string;
  onSelectChip: (chip: SessionQuickStartChip) => void;
};

function formatSnapshotTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Prepared session context";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function contextSummary(value: string) {
  return value.replace(/^Active Session Radar:\s*/i, "");
}

export default function SessionRadar({ apiBase, onSelectChip }: Props) {
  const [payload, setPayload] = useState<SessionPrefetchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadPrefetch() {
      setLoading(true);
      setError(false);

      try {
        const response = await fetch(`${apiBase}/api/session-prefetch`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Session prefetch failed (${response.status})`);
        }

        const rawPayload: unknown = await response.json();
        const nextPayload = parseSessionPrefetchResponse(rawPayload);
        if (active) setPayload(nextPayload);
      } catch (caught: unknown) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPrefetch();
    return () => {
      active = false;
      controller.abort();
    };
  }, [apiBase]);

  const generationSnapshot = useMemo(
    () => payload?.generationMixSummary.slice(0, 3) ?? [],
    [payload],
  );

  if (loading) {
    return (
      <aside
        aria-label="Session briefing"
        aria-busy="true"
        className="miso-panel border-l-4 border-l-miso-sky p-5"
      >
        <div className="flex items-center gap-3 text-sm text-miso-muted">
          <Activity className="animate-pulse" size={19} aria-hidden="true" />
          Preparing the session briefing…
        </div>
      </aside>
    );
  }

  if (error || !payload) {
    return (
      <aside
        aria-labelledby="session-briefing-heading"
        className="miso-panel border-l-4 border-l-miso-border p-5"
      >
        <div className="flex gap-3">
          <div className="mt-0.5 bg-miso-navy p-2 text-white">
            <Lightbulb size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="miso-eyebrow">Suggested starting points</p>
            <h2
              id="session-briefing-heading"
              className="mt-1 text-sm font-semibold text-miso-navy"
            >
              The prepared session briefing is unavailable.
            </h2>
            <p className="mt-1 text-sm text-miso-muted">
              Search remains available above.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const { featuredHub, recentPeaks } = payload;
  const summary = featuredHub.summary;

  return (
    <aside
      aria-labelledby="session-briefing-heading"
      className="miso-panel overflow-hidden"
    >
      <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(23rem,0.65fr)]">
        <section className="border-l-4 border-l-miso-sky p-5 lg:p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex min-w-0 gap-3">
              <div className="mt-0.5 shrink-0 bg-miso-navy p-2 text-white">
                <Activity size={19} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <p className="miso-eyebrow">Prepared session context</p>
                  <span className="inline-flex items-center gap-1 text-xs text-miso-muted">
                    <Clock size={12} aria-hidden="true" />
                    {formatSnapshotTime(payload.timestamp)}
                  </span>
                </div>
                <h2
                  id="session-briefing-heading"
                  className="mt-1 text-xl font-bold tracking-tight text-miso-navy"
                >
                  Continue from {featuredHub.hubName}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-miso-muted">
                  {contextSummary(payload.sessionContext)} Key hub and system
                  indicators are prepared for the next step in the research
                  flow.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onSelectChip({
                  label: `${featuredHub.hubName} briefing`,
                  query: `${featuredHub.hubName} LMP`,
                  type: "hub",
                })
              }
              className="miso-button-secondary shrink-0 text-xs"
            >
              Open hub view <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>

          <dl className="mt-5 grid grid-cols-4 divide-x divide-miso-border border-y border-miso-border bg-miso-card">
            {[
              ["Real-Time average", `$${summary.realTimeAvg.toFixed(2)}/MWh`],
              ["Day-Ahead average", `$${summary.dayAheadAvg.toFixed(2)}/MWh`],
              ["Peak interval", summary.peakHour],
              ["Cleared volume", summary.formattedVolume],
            ].map(([label, value]) => (
              <div key={label} className="px-4 py-3">
                <dt className="miso-metric-label">{label}</dt>
                <dd className="mt-1 text-sm font-bold tabular-nums text-miso-navy">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-t border-miso-border bg-miso-card p-5 lg:border-l lg:border-t-0 lg:p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="miso-eyebrow">System signals</p>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-miso-border pb-3">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-miso-slate">
                    <Wind
                      size={14}
                      className="text-miso-emerald"
                      aria-hidden="true"
                    />
                    Wind record
                  </span>
                  <span className="text-sm font-bold tabular-nums text-miso-navy">
                    {recentPeaks.windPeak.valueGw} GW
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-miso-slate">
                    <Sun
                      size={14}
                      className="text-miso-amber"
                      aria-hidden="true"
                    />
                    Solar record
                  </span>
                  <span className="text-sm font-bold tabular-nums text-miso-navy">
                    {recentPeaks.solarPeak.valueGw} GW
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="miso-eyebrow">Generation snapshot</p>
              <dl className="mt-3 space-y-2">
                {generationSnapshot.map((fuel) => (
                  <div
                    key={fuel.fuel}
                    className="flex items-center justify-between gap-4 text-xs"
                  >
                    <dt className="text-miso-muted">{fuel.fuel}</dt>
                    <dd className="font-bold tabular-nums text-miso-navy">
                      {fuel.percentage}%
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="mt-5 border-t border-miso-border pt-4">
            <p className="miso-eyebrow">Continue research</p>
            <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-2">
              {payload.quickStartChips.map((chip) => (
                <button
                  key={`${chip.type}:${chip.label}`}
                  type="button"
                  onClick={() => onSelectChip(chip)}
                  className="group flex items-center justify-between gap-3 py-1 text-left text-xs font-semibold text-miso-navy hover:text-miso-sky"
                >
                  <span>{chip.label}</span>
                  <ArrowRight
                    size={12}
                    className="shrink-0 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
}
