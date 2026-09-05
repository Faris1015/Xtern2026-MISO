import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, GitCompareArrows, LoaderCircle } from "lucide-react";
import type { ComparisonResponse } from "../types";

const hubs = ["INDIANA.HUB", "MICHIGAN.HUB", "ILLINOIS.HUB", "TEXAS.HUB"];
const strokeColors = ["#0284C7", "#B45309", "#1E293B", "#047857"];
type Props = {
  apiBase: string;
  requestedHubs: string[] | null;
  onRequestedHubsHandled: () => void;
};

export default function ComparisonMatrix({
  apiBase,
  requestedHubs,
  onRequestedHubsHandled,
}: Props) {
  const [selected, setSelected] = useState(["INDIANA.HUB", "MICHIGAN.HUB"]);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    if (!requestedHubs) return;
    const validHubs = requestedHubs.filter((hub) => hubs.includes(hub));
    if (validHubs.length >= 2) setSelected(validHubs);
    onRequestedHubsHandled();
  }, [onRequestedHubsHandled, requestedHubs]);

  useEffect(() => {
    const controller = new AbortController();
    const version = ++requestVersion.current;
    setLoading(true);
    setError("");
    fetch(`${apiBase}/api/compare?type=hubs&items=${selected.join(",")}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Comparison failed (${response.status})`);
        return response.json() as Promise<ComparisonResponse>;
      })
      .then((payload) => {
        const missingField = selected.find((hub) =>
          payload.series.some(
            (point) =>
              typeof point[`${hub.replace(".HUB", "")}_rt`] !== "number",
          ),
        );
        if (missingField)
          throw new Error(
            `Comparison response is missing ${missingField.replace(".HUB", "")}_rt.`,
          );
        if (version === requestVersion.current) setComparison(payload);
      })
      .catch((caught: unknown) => {
        if (
          !(caught instanceof DOMException && caught.name === "AbortError") &&
          version === requestVersion.current
        )
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load comparison.",
          );
      })
      .finally(() => {
        if (version === requestVersion.current) setLoading(false);
      });
    return () => controller.abort();
  }, [apiBase, selected]);

  const chartData = useMemo(
    () =>
      comparison?.series.map((point) => {
        const next: Record<string, string | number> = {
          intervalLabel: point.intervalLabel ?? "",
          hourEnding: point.hourEnding ?? 0,
        };
        selected.forEach((hub) => {
          const prefix = hub.replace(".HUB", "");
          next[prefix] = point[`${prefix}_rt`] as number;
        });
        return next;
      }) ?? [],
    [comparison, selected],
  );

  const toggleHub = (hub: string) =>
    setSelected((current) =>
      current.includes(hub)
        ? current.length > 2
          ? current.filter((item) => item !== hub)
          : current
        : [...current, hub],
    );

  return (
    <section
      id="hub-comparison"
      aria-labelledby="comparison-heading"
      className="border border-miso-border bg-white p-5 sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-miso-sky">
            <GitCompareArrows size={15} aria-hidden="true" /> Hub comparison
          </p>
          <h2
            id="comparison-heading"
            className="mt-1 font-display text-xl font-semibold text-miso-navy"
          >
            Compare hub price curves
          </h2>
          <p className="mt-1 text-sm text-miso-muted">
            Select two to four hubs. Keep at least two selected for a meaningful
            comparison.
          </p>
        </div>
        <span className="bg-miso-card px-3 py-1 text-xs font-semibold text-miso-muted">
          {selected.length} selected
        </span>
      </div>
      <fieldset className="mt-5">
        <legend className="sr-only">Hubs to compare</legend>
        <div className="flex flex-wrap gap-3">
          {hubs.map((hub) => {
            const isSelected = selected.includes(hub);
            const required = isSelected && selected.length === 2;
            return (
              <label
                key={hub}
                className={`flex items-center gap-2 border px-3 py-2 text-sm ${isSelected ? "border-miso-sky bg-sky-50 text-miso-navy" : "border-miso-border text-miso-muted hover:border-miso-sky"}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleHub(hub)}
                  disabled={required}
                  className="accent-sky-700"
                />
                <span>{hub.replace(".HUB", "")}</span>
                {required && (
                  <span className="sr-only">
                    Required to keep two hubs selected
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div aria-live="polite">
        {loading && (
          <div className="flex items-center gap-2 py-12 text-sm text-miso-muted">
            <LoaderCircle
              size={18}
              className="animate-spin"
              aria-hidden="true"
            />{" "}
            Loading comparison…
          </div>
        )}
        {!loading && error && (
          <p className="flex items-center gap-2 py-8 text-sm text-red-700">
            <AlertCircle size={17} aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
      {!loading && !error && comparison && (
        <>
          <div
            className="mt-5 h-72"
            role="img"
            aria-label={`24-hour real-time LMP comparison for ${selected.map((hub) => hub.replace(".HUB", "")).join(", ")}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis dataKey="intervalLabel" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {selected.map((hub, index) => (
                  <Area
                    key={hub}
                    type="monotone"
                    dataKey={hub.replace(".HUB", "")}
                    name={hub.replace(".HUB", "")}
                    stroke={strokeColors[index % strokeColors.length]}
                    fill={strokeColors[index % strokeColors.length]}
                    fillOpacity={0.1}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {comparison.metricsSummary
              .filter((summary) => selected.includes(String(summary.hubId)))
              .map((summary) => (
                <div
                  key={String(summary.hubId)}
                  className="border border-miso-border bg-miso-card p-3 text-sm"
                >
                  <p className="font-semibold text-miso-navy">
                    {String(summary.name)}
                  </p>
                  <p className="mt-1 text-miso-muted">
                    RT avg <strong>${String(summary.realTimeAvg)}</strong>/MWh
                  </p>
                  <p className="text-miso-muted">
                    RT–DA spread <strong>${String(summary.spreadAvg)}</strong>
                    /MWh
                  </p>
                </div>
              ))}
          </div>
          <details className="mt-4 border-t border-miso-border pt-3">
            <summary className="cursor-pointer text-sm font-semibold text-miso-sky">
              View comparison data as a table
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[540px] border-collapse text-left text-xs">
                <thead>
                  <tr>
                    <th className="border-b border-miso-border px-2 py-2">
                      Interval
                    </th>
                    {selected.map((hub) => (
                      <th
                        key={hub}
                        className="border-b border-miso-border px-2 py-2"
                      >
                        {hub.replace(".HUB", "")} RT LMP
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((point) => (
                    <tr key={String(point.hourEnding)}>
                      <td className="border-b border-slate-100 px-2 py-2">
                        {point.intervalLabel}
                      </td>
                      {selected.map((hub) => (
                        <td
                          key={hub}
                          className="border-b border-slate-100 px-2 py-2"
                        >
                          ${Number(point[hub.replace(".HUB", "")]).toFixed(2)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <p className="mt-3 text-xs text-miso-muted">
            {comparison.sourceCitation}
          </p>
        </>
      )}
    </section>
  );
}
