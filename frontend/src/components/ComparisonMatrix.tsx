import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  Database,
  GitCompareArrows,
  LoaderCircle,
  X,
} from "lucide-react";
import { parseComparisonResponse } from "../api/guards";
import {
  HUB_OPTIONS,
  type ComparisonResponse,
  type ComparisonType,
  type HubId,
} from "../types";
import { CHART_SERIES, CHART_TOOLTIP_STYLE, MISO_THEME } from "../theme";

const PLAN_CATEGORY_BY_ID: Record<string, string> = {
  mtep_local: "Local MTEP Projects",
  lrtp_regional: "Regional LRTP (Long Range Transmission Planning)",
  jtiq_interregional:
    "Interregional JTIQ (Joint Targeted Interconnection Queue)",
};

const HUB_LABELS: Record<HubId, string> = {
  "INDIANA.HUB": "Indiana",
  "ILLINOIS.HUB": "Illinois",
  "MICHIGAN.HUB": "Michigan",
  "MINN.HUB": "Minnesota",
  "LOUISIANA.HUB": "Louisiana",
  "TEXAS.HUB": "Texas",
};

type HubMetric = "rt" | "da" | "spread" | "vol";
type FuelMetric = "percentage" | "installedGw";
type PlanMetric = "projects" | "miles";

type Props = {
  apiBase: string;
  requestedHubs: string[] | null;
  comparisonType: ComparisonType;
  requestedItems: string[] | null;
  onRequestedHubsHandled: () => void;
  onComparisonTypeChange: (type: ComparisonType) => void;
  onClose: () => void;
};

const HUB_METRICS: Array<{
  key: HubMetric;
  label: string;
  suffix: string;
}> = [
  { key: "rt", label: "Real-Time LMP", suffix: "_rt" },
  { key: "da", label: "Day-Ahead LMP", suffix: "_da" },
  { key: "spread", label: "RT–DA Spread", suffix: "_spread" },
  { key: "vol", label: "Volume", suffix: "_vol" },
];

function normalizeLabel(value: string) {
  return value.trim().toLowerCase();
}

function requestedPlanCategories(requestedItems: string[] | null) {
  return new Set(
    (requestedItems ?? [])
      .map((item) => PLAN_CATEGORY_BY_ID[item])
      .filter((item): item is string => Boolean(item)),
  );
}

function hubMetricConfig(metric: HubMetric) {
  return HUB_METRICS.find((item) => item.key === metric) ?? HUB_METRICS[0];
}

function formatHubMetric(value: unknown, metric: HubMetric) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  if (metric === "vol") return `${numeric.toLocaleString()} MWh`;
  return `$${numeric.toFixed(2)}/MWh`;
}

function formatFuelMetric(value: unknown, metric: FuelMetric) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  return metric === "percentage"
    ? `${numeric.toLocaleString()}%`
    : `${numeric.toLocaleString()} GW`;
}

function formatPlanMetric(value: unknown, metric: PlanMetric) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  return metric === "projects"
    ? `${numeric.toLocaleString()} projects`
    : `${numeric.toLocaleString()} miles`;
}

function shortPlanLabel(value: string) {
  if (value.startsWith("Local MTEP")) return "Local MTEP";
  if (value.startsWith("Regional LRTP")) return "Regional LRTP";
  if (value.startsWith("Interregional JTIQ")) return "Interregional JTIQ";
  return value;
}

function MetricButton<T extends string>({
  value,
  current,
  label,
  onSelect,
}: {
  value: T;
  current: T;
  label: string;
  onSelect: (value: T) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={current === value}
      onClick={() => onSelect(value)}
      className={`miso-segment ${
        current === value ? "miso-segment-active" : ""
      }`}
    >
      {label}
    </button>
  );
}

export default function ComparisonMatrix({
  apiBase,
  requestedHubs,
  comparisonType,
  requestedItems,
  onRequestedHubsHandled,
  onComparisonTypeChange,
  onClose,
}: Props) {
  const [selected, setSelected] = useState<HubId[]>([
    "INDIANA.HUB",
    "MICHIGAN.HUB",
  ]);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hubMetric, setHubMetric] = useState<HubMetric>("rt");
  const [fuelMetric, setFuelMetric] = useState<FuelMetric>("percentage");
  const [planMetric, setPlanMetric] = useState<PlanMetric>("projects");
  const requestVersion = useRef(0);

  useEffect(() => {
    if (!requestedHubs) return;

    const validHubs = [
      ...new Set(requestedHubs.map((hub) => hub.toUpperCase())),
    ].filter((hub): hub is HubId => HUB_OPTIONS.includes(hub as HubId));

    if (validHubs.length >= 2) setSelected(validHubs);
    onRequestedHubsHandled();
  }, [onRequestedHubsHandled, requestedHubs]);

  useEffect(() => {
    setComparison(null);
    setHubMetric("rt");
    setFuelMetric("percentage");
    setPlanMetric("projects");
  }, [comparisonType, requestedItems]);

  useEffect(() => {
    const controller = new AbortController();
    const version = ++requestVersion.current;
    const items = comparisonType === "hubs" ? selected : (requestedItems ?? []);

    async function loadComparison() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${apiBase}/api/compare?type=${comparisonType}&items=${encodeURIComponent(items.join(","))}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(`Comparison failed (${response.status})`);
        }

        const rawPayload: unknown = await response.json();
        const payload = parseComparisonResponse(rawPayload);

        if (payload.compareType !== comparisonType) {
          throw new Error(
            `Comparison response type "${payload.compareType}" did not match the requested type "${comparisonType}".`,
          );
        }

        if (payload.compareType === "hubs") {
          const requiredSuffixes = ["rt", "da", "spread", "vol"] as const;
          const missingField = selected
            .flatMap((hub) =>
              requiredSuffixes.map((suffix) => ({ hub, suffix })),
            )
            .find(({ hub, suffix }) =>
              payload.series.some(
                (point) =>
                  typeof point[`${hub.replace(".HUB", "")}_${suffix}`] !==
                  "number",
              ),
            );

          if (missingField) {
            throw new Error(
              `Comparison response is missing ${missingField.hub.replace(".HUB", "")}_${missingField.suffix}.`,
            );
          }
        }

        if (version === requestVersion.current) setComparison(payload);
      } catch (caught: unknown) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        if (version === requestVersion.current) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load comparison.",
          );
        }
      } finally {
        if (version === requestVersion.current) setLoading(false);
      }
    }

    void loadComparison();
    return () => controller.abort();
  }, [apiBase, comparisonType, requestedItems, selected]);

  const chartData = useMemo(() => {
    if (!comparison || comparison.compareType !== "hubs") return [];
    const metric = hubMetricConfig(hubMetric);

    return comparison.series.map((point) => {
      const next: Record<string, string | number> = {
        intervalLabel: point.intervalLabel,
        hourEnding: point.hourEnding,
      };
      selected.forEach((hub) => {
        const prefix = hub.replace(".HUB", "");
        next[prefix] = point[`${prefix}${metric.suffix}`];
      });
      return next;
    });
  }, [comparison, hubMetric, selected]);

  const visibleFuelSummaries = useMemo(() => {
    if (!comparison || comparison.compareType !== "fuels") return [];
    const selectedFuels = new Set(comparison.items.map(normalizeLabel));
    return comparison.metricsSummary.filter((summary) =>
      selectedFuels.has(normalizeLabel(summary.fuel)),
    );
  }, [comparison]);

  const visibleFuelSeries = useMemo(() => {
    if (!comparison || comparison.compareType !== "fuels") return [];
    const selectedFuels = new Set(comparison.items.map(normalizeLabel));
    return comparison.series.filter((point) =>
      selectedFuels.has(normalizeLabel(point.fuel)),
    );
  }, [comparison]);

  const visiblePlanSummaries = useMemo(() => {
    if (!comparison || comparison.compareType !== "plans") return [];
    const selectedCategories = requestedPlanCategories(requestedItems);
    if (!selectedCategories.size) return comparison.metricsSummary;
    return comparison.metricsSummary.filter((summary) =>
      selectedCategories.has(summary.category),
    );
  }, [comparison, requestedItems]);

  const visiblePlanSeries = useMemo(() => {
    if (!comparison || comparison.compareType !== "plans") return [];
    const selectedCategories = requestedPlanCategories(requestedItems);
    if (!selectedCategories.size) return comparison.series;
    return comparison.series.filter((point) =>
      selectedCategories.has(point.category),
    );
  }, [comparison, requestedItems]);

  const selectedCount =
    comparisonType === "hubs"
      ? selected.length
      : comparisonType === "fuels"
        ? visibleFuelSeries.length || requestedItems?.length || 0
        : visiblePlanSeries.length || requestedItems?.length || 0;

  const toggleHub = (hub: HubId) => {
    setSelected((current) =>
      current.includes(hub)
        ? current.length > 2
          ? current.filter((item) => item !== hub)
          : current
        : [...current, hub],
    );
  };

  const currentHubMetric = hubMetricConfig(hubMetric);

  return (
    <section
      id="hub-comparison"
      aria-labelledby="comparison-heading"
      className="miso-panel scroll-mt-5 overflow-hidden border-t-4 border-t-miso-sky"
    >
      <header className="border-b border-miso-border px-6 pt-6 lg:px-8 lg:pt-7">
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="miso-eyebrow flex items-center gap-2">
              <GitCompareArrows size={15} aria-hidden="true" /> Comparison
              workspace
            </p>
            <h2
              id="comparison-heading"
              className="mt-1 text-2xl font-bold tracking-tight text-miso-navy"
            >
              {comparison?.title ?? "Compare MISO public datasets"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-miso-muted">
              Switch between pricing, generation, and planning views without
              leaving the active research workspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-miso-muted">
              {selectedCount} selected
            </span>
            <button
              type="button"
              onClick={onClose}
              className="icon-button border border-miso-border"
              aria-label="Close comparison workspace"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <nav aria-label="Comparison type" className="mt-5 flex gap-7">
          {(
            [
              ["hubs", "Hub pricing"],
              ["fuels", "Fuel mix"],
              ["plans", "Transmission plans"],
            ] as const
          ).map(([type, label]) => (
            <button
              key={type}
              type="button"
              aria-current={comparisonType === type ? "page" : undefined}
              onClick={() => onComparisonTypeChange(type)}
              className={`miso-tab ${
                comparisonType === type ? "miso-tab-active" : ""
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="p-6 lg:p-8">
        {comparisonType === "hubs" && (
          <div className="mb-6 border border-miso-border bg-miso-card p-4">
            <div className="flex items-center justify-between gap-6">
              <fieldset>
                <legend className="miso-eyebrow mb-3">Hubs to compare</legend>
                <div className="flex flex-wrap gap-x-5 gap-y-3">
                  {HUB_OPTIONS.map((hub) => {
                    const isSelected = selected.includes(hub);
                    const required = isSelected && selected.length === 2;
                    return (
                      <label
                        key={hub}
                        className="flex items-center gap-2 text-sm font-semibold text-miso-slate"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleHub(hub)}
                          disabled={required}
                          className="h-4 w-4 accent-miso-sky"
                        />
                        <span>{HUB_LABELS[hub]}</span>
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

              <div
                className="flex shrink-0 gap-2"
                role="group"
                aria-label="Hub comparison metric"
              >
                {HUB_METRICS.map((metric) => (
                  <MetricButton
                    key={metric.key}
                    value={metric.key}
                    current={hubMetric}
                    label={metric.label}
                    onSelect={setHubMetric}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div aria-live="polite">
          {loading && (
            <div className="flex items-center gap-2 py-14 text-sm text-miso-muted">
              <LoaderCircle
                size={18}
                className="animate-spin"
                aria-hidden="true"
              />
              Loading comparison…
            </div>
          )}
          {!loading && error && (
            <p className="flex items-center gap-2 py-10 text-sm text-red-700">
              <AlertCircle size={17} aria-hidden="true" />
              {error}
            </p>
          )}
        </div>

        {!loading &&
          !error &&
          comparison &&
          comparison.compareType === "hubs" && (
            <div>
              <div className="mb-4 flex items-end justify-between gap-6">
                <div>
                  <p className="miso-eyebrow">24-hour aligned series</p>
                  <h3 className="mt-1 text-lg font-bold text-miso-navy">
                    {currentHubMetric.label}
                  </h3>
                </div>
                <p className="text-xs text-miso-muted">
                  Hour ending · Eastern Time
                </p>
              </div>

              <div
                className="h-[360px]"
                role="img"
                aria-label={`24-hour ${currentHubMetric.label} comparison for ${selected
                  .map((hub) => HUB_LABELS[hub])
                  .join(", ")}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 8, right: 18, bottom: 4, left: 10 }}
                  >
                    <CartesianGrid vertical={false} stroke={MISO_THEME.grid} />
                    <XAxis
                      dataKey="intervalLabel"
                      interval={2}
                      tick={{ fontSize: 11, fill: MISO_THEME.slate }}
                      tickLine={false}
                      axisLine={{ stroke: MISO_THEME.border }}
                    />
                    <YAxis
                      width={72}
                      tick={{ fontSize: 11, fill: MISO_THEME.slate }}
                      tickFormatter={(value: number) =>
                        hubMetric === "vol"
                          ? value.toLocaleString()
                          : `$${value.toFixed(hubMetric === "spread" ? 1 : 0)}`
                      }
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={CHART_TOOLTIP_STYLE}
                      formatter={(value: unknown, name: unknown) => [
                        formatHubMetric(value, hubMetric),
                        String(name),
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {selected.map((hub, index) => (
                      <Line
                        key={hub}
                        type="monotone"
                        dataKey={hub.replace(".HUB", "")}
                        name={HUB_LABELS[hub]}
                        stroke={CHART_SERIES[index % CHART_SERIES.length]}
                        strokeWidth={2.25}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 overflow-x-auto border border-miso-border">
                <table className="w-full min-w-[860px] border-collapse text-left text-xs">
                  <caption className="sr-only">
                    Summary metrics for selected hubs
                  </caption>
                  <thead className="bg-miso-navy text-white">
                    <tr>
                      {[
                        "Hub",
                        "RT average",
                        "DA average",
                        "RT–DA spread",
                        "Peak interval",
                        "Volume",
                      ].map((heading) => (
                        <th
                          key={heading}
                          scope="col"
                          className="px-4 py-3 font-semibold"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.metricsSummary
                      .filter((summary) =>
                        selected.includes(summary.hubId as HubId),
                      )
                      .map((summary) => (
                        <tr key={summary.hubId}>
                          <th
                            scope="row"
                            className="border-b border-miso-border px-4 py-3 font-bold text-miso-navy"
                          >
                            {summary.name}
                          </th>
                          <td className="border-b border-miso-border px-4 py-3 tabular-nums">
                            ${summary.realTimeAvg.toFixed(2)}/MWh
                          </td>
                          <td className="border-b border-miso-border px-4 py-3 tabular-nums">
                            ${summary.dayAheadAvg.toFixed(2)}/MWh
                          </td>
                          <td className="border-b border-miso-border px-4 py-3 tabular-nums">
                            ${summary.spreadAvg.toFixed(2)}/MWh
                          </td>
                          <td className="border-b border-miso-border px-4 py-3 tabular-nums">
                            {summary.peakHour}
                          </td>
                          <td className="border-b border-miso-border px-4 py-3 tabular-nums">
                            {summary.volume}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {!loading &&
          !error &&
          comparison &&
          comparison.compareType === "fuels" && (
            <div>
              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="miso-eyebrow">Selected fuel comparison</p>
                  <h3 className="mt-1 text-lg font-bold text-miso-navy">
                    {fuelMetric === "percentage"
                      ? "Generation mix share"
                      : "Installed capacity"}
                  </h3>
                </div>
                <div
                  className="flex gap-2"
                  role="group"
                  aria-label="Fuel comparison metric"
                >
                  <MetricButton
                    value="percentage"
                    current={fuelMetric}
                    label="Mix share"
                    onSelect={setFuelMetric}
                  />
                  <MetricButton
                    value="installedGw"
                    current={fuelMetric}
                    label="Installed GW"
                    onSelect={setFuelMetric}
                  />
                </div>
              </div>

              {visibleFuelSeries.length > 0 && (
                <div
                  className="mt-5"
                  role="img"
                  aria-label={`Fuel comparison by ${
                    fuelMetric === "percentage" ? "mix share" : "installed GW"
                  }`}
                  style={{
                    height: Math.max(250, visibleFuelSeries.length * 76),
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={visibleFuelSeries}
                      layout="vertical"
                      margin={{ top: 4, right: 70, bottom: 4, left: 20 }}
                    >
                      <CartesianGrid
                        horizontal={false}
                        stroke={MISO_THEME.grid}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: MISO_THEME.slate }}
                        tickFormatter={(value: number) =>
                          fuelMetric === "percentage"
                            ? `${value}%`
                            : `${value} GW`
                        }
                        tickLine={false}
                        axisLine={{ stroke: MISO_THEME.border }}
                      />
                      <YAxis
                        type="category"
                        dataKey="fuel"
                        width={110}
                        tick={{ fontSize: 12, fill: MISO_THEME.ink }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        formatter={(value: unknown) => [
                          formatFuelMetric(value, fuelMetric),
                          fuelMetric === "percentage"
                            ? "Mix share"
                            : "Installed capacity",
                        ]}
                      />
                      <Bar
                        dataKey={fuelMetric}
                        name={
                          fuelMetric === "percentage"
                            ? "Mix share"
                            : "Installed capacity"
                        }
                        fill={MISO_THEME.blue}
                        radius={[0, 2, 2, 0]}
                      >
                        <LabelList
                          dataKey={fuelMetric}
                          position="right"
                          formatter={(value: unknown) =>
                            formatFuelMetric(value, fuelMetric)
                          }
                          style={{
                            fill: MISO_THEME.ink,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {visibleFuelSummaries.length > 0 && (
                <section className="mt-6 border-t border-miso-border pt-5">
                  <h4 className="text-sm font-bold text-miso-navy">
                    Operational context
                  </h4>
                  <div className="mt-3 divide-y divide-miso-border border-y border-miso-border">
                    {visibleFuelSummaries.map((summary) => (
                      <div
                        key={summary.fuel}
                        className="grid grid-cols-[10rem_11rem_minmax(0,1fr)] gap-5 py-3 text-xs"
                      >
                        <p className="font-bold text-miso-navy">
                          {summary.fuel}
                        </p>
                        <p className="text-miso-muted">
                          <span className="font-semibold text-miso-slate">
                            Peak record:
                          </span>{" "}
                          {summary.peakRecord}
                        </p>
                        <p className="text-miso-muted">{summary.role}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

        {!loading &&
          !error &&
          comparison &&
          comparison.compareType === "plans" && (
            <div>
              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="miso-eyebrow">Selected portfolio comparison</p>
                  <h3 className="mt-1 text-lg font-bold text-miso-navy">
                    {planMetric === "projects"
                      ? "Approved project count"
                      : "Transmission line miles"}
                  </h3>
                </div>
                <div
                  className="flex gap-2"
                  role="group"
                  aria-label="Transmission comparison metric"
                >
                  <MetricButton
                    value="projects"
                    current={planMetric}
                    label="Projects"
                    onSelect={setPlanMetric}
                  />
                  <MetricButton
                    value="miles"
                    current={planMetric}
                    label="Line miles"
                    onSelect={setPlanMetric}
                  />
                </div>
              </div>

              {visiblePlanSeries.length > 0 && (
                <div
                  className="mt-5"
                  role="img"
                  aria-label={`Transmission plan comparison by ${planMetric}`}
                  style={{
                    height: Math.max(260, visiblePlanSeries.length * 92),
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={visiblePlanSeries.map((item) => ({
                        ...item,
                        displayName: shortPlanLabel(item.category),
                      }))}
                      layout="vertical"
                      margin={{ top: 4, right: 85, bottom: 4, left: 35 }}
                    >
                      <CartesianGrid
                        horizontal={false}
                        stroke={MISO_THEME.grid}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: MISO_THEME.slate }}
                        tickFormatter={(value: number) =>
                          value.toLocaleString()
                        }
                        tickLine={false}
                        axisLine={{ stroke: MISO_THEME.border }}
                      />
                      <YAxis
                        type="category"
                        dataKey="displayName"
                        width={145}
                        tick={{ fontSize: 12, fill: MISO_THEME.ink }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        formatter={(value: unknown) => [
                          formatPlanMetric(value, planMetric),
                          planMetric === "projects" ? "Projects" : "Line miles",
                        ]}
                      />
                      <Bar
                        dataKey={planMetric}
                        name={
                          planMetric === "projects" ? "Projects" : "Line miles"
                        }
                        fill={MISO_THEME.blue}
                        radius={[0, 2, 2, 0]}
                      >
                        <LabelList
                          dataKey={planMetric}
                          position="right"
                          formatter={(value: unknown) =>
                            formatPlanMetric(value, planMetric)
                          }
                          style={{
                            fill: MISO_THEME.ink,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {visiblePlanSummaries.length > 0 && (
                <section className="mt-6 border-t border-miso-border pt-5">
                  <h4 className="text-sm font-bold text-miso-navy">
                    Portfolio context
                  </h4>
                  <div className="mt-3 divide-y divide-miso-border border-y border-miso-border">
                    {visiblePlanSummaries.map((summary) => (
                      <div
                        key={summary.category}
                        className="grid grid-cols-[15rem_8rem_minmax(0,1fr)] gap-5 py-3 text-xs"
                      >
                        <p className="font-bold text-miso-navy">
                          {shortPlanLabel(summary.category)}
                        </p>
                        <p className="font-semibold tabular-nums text-miso-slate">
                          {summary.investment}
                        </p>
                        <p className="leading-5 text-miso-muted">
                          {summary.focus}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

        {!loading && !error && comparison && (
          <div className="mt-7 flex items-start gap-2 border-t border-miso-border pt-4 text-xs text-miso-muted">
            <Database
              size={14}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <span>{comparison.sourceCitation}</span>
          </div>
        )}
      </div>
    </section>
  );
}
