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
import { HUB_OPTIONS, type ComparisonResponse } from "../types";
const strokeColors = ["#0284C7", "#B45309", "#1E293B", "#047857"];

function numberValue(value: unknown) {
  return typeof value === "number" ? value : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

function metricValue(
  summary: ComparisonResponse["metricsSummary"][number],
  key: string,
) {
  return key in summary
    ? Reflect.get(summary, key)
    : undefined;
}
type Props = {
  apiBase: string;
  requestedHubs: string[] | null;
  comparisonType: "hubs" | "fuels" | "plans";
  requestedItems: string[] | null;
  onRequestedHubsHandled: () => void;
  onComparisonTypeChange: (type: "hubs" | "fuels" | "plans") => void;
  onClose: () => void;
};

export default function ComparisonMatrix({
  apiBase,
  requestedHubs,
  comparisonType,
  requestedItems,
  onRequestedHubsHandled,
  onComparisonTypeChange,
  onClose,
}: Props) {
  const [selected, setSelected] = useState(["INDIANA.HUB", "MICHIGAN.HUB"]);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    if (!requestedHubs) return;
    const validHubs = requestedHubs
      .map((hub) => hub.toUpperCase())
      .filter((hub): hub is (typeof HUB_OPTIONS)[number] =>
        HUB_OPTIONS.includes(hub as (typeof HUB_OPTIONS)[number]),
      );
    if (validHubs.length >= 2) setSelected(validHubs);
    onRequestedHubsHandled();
  }, [onRequestedHubsHandled, requestedHubs]);

  useEffect(() => {
    setComparison(null);
  }, [comparisonType, requestedItems]);

  useEffect(() => {
    const controller = new AbortController();
    const version = ++requestVersion.current;
    setLoading(true);
    setError("");
    const items = comparisonType === "hubs" ? selected : requestedItems ?? [];
    fetch(
      `${apiBase}/api/compare?type=${comparisonType}&items=${encodeURIComponent(items.join(","))}`,
      {
        signal: controller.signal,
      },
    )
      .then((response) => {
        if (!response.ok)
          throw new Error(`Comparison failed (${response.status})`);
        return response.json() as Promise<ComparisonResponse>;
      })
      .then((payload) => {
        if (comparisonType === "hubs") {
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
        }
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
  }, [apiBase, comparisonType, requestedItems, selected]);

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
  const isHubComparison = comparisonType === "hubs";
  const isDataComparison = !isHubComparison;
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
            <GitCompareArrows size={15} aria-hidden="true" />{" "}
            {isHubComparison ? "Hub comparison" : "Dataset comparison"}
          </p>
          <h2
            id="comparison-heading"
            className="mt-1 font-display text-xl font-semibold text-miso-navy"
          >
            {isHubComparison ? "Compare hub price curves" : "Compare market datasets"}
          </h2>
          <p className="mt-1 text-sm text-miso-muted">
            {isHubComparison
              ? "Select two or more hubs. Keep at least two selected for a meaningful comparison."
              : "Compare the selected backend datasets side by side."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-miso-card px-3 py-1 text-xs font-semibold text-miso-muted">
            {isHubComparison ? selected.length : requestedItems?.length ?? 0} selected
          </span>
          <button
            type="button"
            onClick={onClose}
            className="border border-miso-border px-3 py-1 text-xs font-semibold text-miso-muted hover:border-miso-sky hover:text-miso-sky"
          >
            Close
          </button>
        </div>
      </div>
      <nav
        aria-label="Comparison type"
        className="mt-5 flex flex-wrap gap-2 border-b border-miso-border pb-4"
      >
        {(
          [
            ["hubs", "Hub prices"],
          ] as const
        ).map(([type, label]) => (
          <button
            key={type}
            type="button"
            aria-current={comparisonType === type ? "page" : undefined}
            onClick={() => onComparisonTypeChange(type)}
            className={`px-3 py-2 text-xs font-semibold ${
              comparisonType === type
                ? "bg-miso-navy text-white"
                : "border border-miso-border text-miso-muted hover:border-miso-sky hover:text-miso-sky"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          aria-current={isDataComparison ? "page" : undefined}
          onClick={() =>
            onComparisonTypeChange(
              comparisonType === "hubs" ? "fuels" : comparisonType,
            )
          }
          className={`px-3 py-2 text-xs font-semibold ${
            isDataComparison
              ? "bg-miso-navy text-white"
              : "border border-miso-border text-miso-muted hover:border-miso-sky hover:text-miso-sky"
          }`}
        >
          Data comparison
        </button>
      </nav>
      {isDataComparison && (
        <nav
          aria-label="Data comparison type"
          className="mt-4 flex flex-wrap gap-2"
        >
          {(
            [
              ["fuels", "Fuel mix"],
              ["plans", "Transmission plans"],
            ] as const
          ).map(([type, label]) => (
            <button
              key={type}
              type="button"
              aria-current={comparisonType === type ? "page" : undefined}
              onClick={() => onComparisonTypeChange(type)}
              className={`px-3 py-1.5 text-xs font-semibold ${
                comparisonType === type
                  ? "border border-miso-sky bg-sky-50 text-miso-sky"
                  : "border border-miso-border text-miso-muted hover:border-miso-sky hover:text-miso-sky"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
      {isHubComparison && <fieldset className="mt-5">
        <legend className="sr-only">Hubs to compare</legend>
        <div className="flex flex-wrap gap-3">
          {HUB_OPTIONS.map((hub) => {
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
      </fieldset>}
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
      {!loading && !error && comparison && isHubComparison && (
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
              .filter(
                (summary): summary is {
                  hubId: string;
                  name: string;
                  realTimeAvg: number;
                  dayAheadAvg: number;
                  spreadAvg: number;
                  peakHour: string;
                  peakPrice: number;
                  volume: string;
                } =>
                  "hubId" in summary &&
                  "name" in summary &&
                  "realTimeAvg" in summary &&
                  "spreadAvg" in summary,
              )
              .filter((summary) => selected.includes(summary.hubId))
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
      {!loading && !error && comparison && !isHubComparison && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {comparison.metricsSummary.map((summary, index) => {
              const label =
                stringValue(metricValue(summary, "fuel")) ??
                stringValue(metricValue(summary, "category")) ??
                `Option ${index + 1}`;
              const primary =
                numberValue(metricValue(summary, "percentage")) ??
                numberValue(metricValue(summary, "projects")) ??
                0;
              const unit =
                comparisonType === "fuels" ? "%" : "projects";
              return (
                <div
                  key={`${label}-${index}`}
                  className="border border-miso-border bg-miso-card p-4"
                >
                  <p className="font-semibold text-miso-navy">{label}</p>
                  <p className="mt-1 text-xl font-bold text-miso-sky">
                    {primary.toLocaleString()} {unit}
                  </p>
                  {comparisonType === "fuels" && (
                    <p className="mt-1 text-xs text-miso-muted">
                      Peak record: {stringValue(metricValue(summary, "peakRecord")) ?? "—"}
                    </p>
                  )}
                  {comparisonType === "plans" && (
                    <p className="mt-1 text-xs text-miso-muted">
                      {stringValue(metricValue(summary, "miles")) ?? "—"} ·{" "}
                      {stringValue(metricValue(summary, "investment")) ?? "Investment not listed"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
