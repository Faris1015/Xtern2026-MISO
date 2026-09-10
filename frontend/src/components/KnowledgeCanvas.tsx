import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Database,
  Download,
  ExternalLink,
  FileText,
  Sparkles,
  Star,
} from "lucide-react";
import type {
  AudienceMode,
  ChartType,
  FollowUp,
  GlossarySearchResponse,
  GuidanceSearchResponse,
  KpiColor,
  SearchResponse,
} from "../types";
import { CHART_SERIES, CHART_TOOLTIP_STYLE, MISO_THEME } from "../theme";
import { GlossaryHighlight } from "./GlossaryHighlight";
import { CanvasCopilotDrawer } from "./CanvasCopilotDrawer";


const kpiColors: Record<KpiColor, string> = {
  sky: MISO_THEME.blue,
  slate: MISO_THEME.ink,
  red: MISO_THEME.red,
  emerald: MISO_THEME.green,
  amber: MISO_THEME.amber,
  purple: MISO_THEME.purple,
};

const TARIFF_DOCUMENTATION_URL =
  "https://www.misoenergy.org/legal/business-practice-manuals/";

const SOURCE_DIRECTORY: Record<ChartType, { title: string; url: string }> = {
  lmp_series: {
    title: "Market Data Exchange",
    url: "https://www.misoenergy.org/markets-and-operations/RTDataAPIs/",
  },
  fuel_mix: {
    title: "Operations displays and fuel information",
    url: "https://www.misoenergy.org/markets-and-operations/real-time--market-data/operations-displays/",
  },
  transmission_bar: {
    title: "Transmission planning",
    url: "https://www.misoenergy.org/planning/",
  },
  glossary_card: {
    title: "Tariff and business practice documentation",
    url: TARIFF_DOCUMENTATION_URL,
  },
  guidance_card: {
    title: "MISO Knowledge Scope Directory",
    url: "https://www.misoenergy.org",
  },
};

type LmpChartMode = "prices" | "spread" | "components";
type TransmissionMetric = "projectsCount" | "miles";
type FuelChartMode = "donut" | "bar";

type Props = {
  apiBase: string;
  audienceMode: AudienceMode;
  result: SearchResponse | null;
  onFollowUp: (followUp: FollowUp) => void;
  isStarred?: boolean;
  onToggleStar?: (query: string) => void;
};

function formatCurrencyPerMwh(value: unknown) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? `$${numericValue.toFixed(2)}/MWh`
    : "—";
}

function formatPercent(value: unknown) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `${numericValue}%` : "—";
}

function formatNumber(value: unknown) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toLocaleString() : "—";
}

function briefingUrl(
  apiBase: string,
  hubId: string,
  audienceMode: AudienceMode,
) {
  const params = new URLSearchParams({
    hub_id: hubId,
    audience_mode: audienceMode,
  });
  return `${apiBase}/api/generate-briefing?${params.toString()}`;
}

function resultRows(result: SearchResponse): Array<Record<string, unknown>> {
  if (result.chartType === "glossary_card" || result.chartType === "guidance_card") return [];
  return result.data.map((row) => ({ ...row }));
}


function downloadCsv(result: SearchResponse) {
  const rows = resultRows(result);
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [
    headers.map(escape).join(","),
    ...rows.map((row) =>
      headers.map((header) => escape(row[header])).join(","),
    ),
  ].join("\n");

  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${result.hubId ?? "miso"}-demo-data.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function SourceEvidence({
  result,
  audienceMode,
}: {
  result: SearchResponse;
  audienceMode: AudienceMode;
}) {
  const source = SOURCE_DIRECTORY[result.chartType];

  return (
    <section aria-labelledby="evidence-heading">
      <p id="evidence-heading" className="miso-eyebrow flex items-center gap-2">
        <Database size={14} aria-hidden="true" /> Evidence
      </p>
      <h3 className="mt-3 text-sm font-bold text-miso-navy">{source.title}</h3>
      <p className="mt-2 text-xs leading-5 text-miso-muted">
        {result.sourceCitation}
      </p>
      <dl className="mt-4 border-y border-miso-border py-3 text-xs">
        <div className="flex items-start justify-between gap-4">
          <dt className="text-miso-muted">Answer audience</dt>
          <dd className="text-right font-semibold text-miso-navy">
            {audienceMode}
          </dd>
        </div>
      </dl>
      <a
        className="miso-button-quiet mt-4 text-xs"
        href={source.url}
        target="_blank"
        rel="noreferrer"
      >
        Open MISO source area
        <ExternalLink size={13} aria-hidden="true" />
      </a>
    </section>
  );
}

function MetricRail({ result }: { result: SearchResponse }) {
  if (result.chartType === "glossary_card" || result.chartType === "guidance_card") return null;

  return (
    <dl className="grid grid-cols-4 divide-x divide-miso-border border-b border-miso-border bg-miso-card">
      {result.kpis.map((kpi) => (
        <div key={kpi.label} className="px-5 py-4">
          <dt className="miso-metric-label">
            <GlossaryHighlight text={kpi.label} />
          </dt>
          <dd
            className="mt-1 text-lg font-bold tabular-nums"
            style={{ color: kpiColors[kpi.color] }}
          >
            <GlossaryHighlight text={kpi.value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function LmpChart({
  result,
  mode,
}: {
  result: Extract<SearchResponse, { chartType: "lmp_series" }>;
  mode: LmpChartMode;
}) {
  const peakPoint = result.data.length
    ? result.data.reduce((peak, point) =>
        point.realTimeLmp > peak.realTimeLmp ? point : peak,
      )
    : null;

  if (mode === "spread") {
    return (
      <div
        className="h-[340px]"
        role="img"
        aria-label="24-hour real-time minus day-ahead LMP spread chart"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={result.data}
            margin={{ top: 12, right: 18, bottom: 4, left: 8 }}
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
              width={64}
              tick={{ fontSize: 11, fill: MISO_THEME.slate }}
              tickFormatter={(value: number) => `$${value.toFixed(1)}`}
              tickLine={false}
              axisLine={false}
            />
            <ReferenceLine y={0} stroke={MISO_THEME.slate} />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value: unknown) => [
                formatCurrencyPerMwh(value),
                "RT–DA spread",
              ]}
            />
            <Area
              type="monotone"
              dataKey="spread"
              name="RT–DA spread"
              stroke={MISO_THEME.amber}
              fill={MISO_THEME.amberSoft}
              fillOpacity={0.9}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (mode === "components") {
    return (
      <div
        className="h-[340px]"
        role="img"
        aria-label="24-hour LMP energy, congestion, and loss component chart"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={result.data}
            margin={{ top: 12, right: 18, bottom: 4, left: 8 }}
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
              width={64}
              tick={{ fontSize: 11, fill: MISO_THEME.slate }}
              tickFormatter={(value: number) => `$${value.toFixed(0)}`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value: unknown, name: unknown) => [
                formatCurrencyPerMwh(value),
                String(name),
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="energyComponent"
              name="Energy"
              stackId="lmp-components"
              stroke={MISO_THEME.blue}
              fill="#BCE2F2"
              fillOpacity={0.9}
            />
            <Area
              type="monotone"
              dataKey="congestionComponent"
              name="Congestion"
              stackId="lmp-components"
              stroke={MISO_THEME.amber}
              fill="#E8C890"
              fillOpacity={0.9}
            />
            <Area
              type="monotone"
              dataKey="lossComponent"
              name="Loss"
              stackId="lmp-components"
              stroke={MISO_THEME.slate}
              fill="#B8C7D1"
              fillOpacity={0.9}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div
      className="h-[340px]"
      role="img"
      aria-label="24-hour real-time and day-ahead LMP comparison chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={result.data}
          margin={{ top: 12, right: 18, bottom: 4, left: 8 }}
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
            width={64}
            tick={{ fontSize: 11, fill: MISO_THEME.slate }}
            tickFormatter={(value: number) => `$${value.toFixed(0)}`}
            tickLine={false}
            axisLine={false}
          />
          {peakPoint && (
            <ReferenceLine
              x={peakPoint.intervalLabel}
              stroke={MISO_THEME.red}
              strokeDasharray="4 4"
              label={{
                value: "Peak",
                position: "insideTopRight",
                fill: MISO_THEME.red,
                fontSize: 11,
              }}
            />
          )}
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value: unknown, name: unknown) => [
              formatCurrencyPerMwh(value),
              String(name),
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="realTimeLmp"
            name="Real-Time LMP"
            stroke={MISO_THEME.blue}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="dayAheadLmp"
            name="Day-Ahead LMP"
            stroke={MISO_THEME.navy}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function FuelMixChart({
  result,
  mode = "donut",
}: {
  result: Extract<SearchResponse, { chartType: "fuel_mix" }>;
  mode?: FuelChartMode;
}) {
  if (mode === "donut") {
    return (
      <div
        className="h-[340px]"
        role="img"
        aria-label="Generation fuel mix donut chart"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 18, bottom: 8, left: 18 }}>
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value: unknown, name: unknown) => [
                formatPercent(value),
                String(name),
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span style={{ color: MISO_THEME.ink, fontSize: "12px", fontWeight: 600 }}>
                  {value}
                </span>
              )}
            />
            <Pie
              data={result.data}
              dataKey="percentage"
              nameKey="fuel"
              cx="50%"
              cy="45%"
              innerRadius={65}
              outerRadius={105}
              paddingAngle={3}
              stroke="#ffffff"
              strokeWidth={2}
            >
              {result.data.map((item, index) => (
                <Cell
                  key={item.fuel}
                  fill={item.color ?? CHART_SERIES[index % CHART_SERIES.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div
      className="h-[340px]"
      role="img"
      aria-label="Generation fuel mix bar chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={result.data}
          layout="vertical"
          margin={{ top: 8, right: 58, bottom: 4, left: 12 }}
        >
          <CartesianGrid horizontal={false} stroke={MISO_THEME.grid} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: MISO_THEME.slate }}
            tickFormatter={(value: number) => `${value}%`}
            tickLine={false}
            axisLine={{ stroke: MISO_THEME.border }}
          />
          <YAxis
            type="category"
            dataKey="fuel"
            width={96}
            tick={{ fontSize: 12, fill: MISO_THEME.ink }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value: unknown) => [formatPercent(value), "Mix share"]}
          />
          <Bar dataKey="percentage" name="Mix share" radius={[0, 2, 2, 0]}>
            {result.data.map((item, index) => (
              <Cell
                key={item.fuel}
                fill={item.color ?? CHART_SERIES[index % CHART_SERIES.length]}
              />
            ))}
            <LabelList
              dataKey="percentage"
              position="right"
              formatter={(value: unknown) => formatPercent(value)}
              style={{ fill: MISO_THEME.ink, fontSize: 12, fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function shortPlanLabel(value: string) {
  if (value.startsWith("Local MTEP")) return "Local MTEP";
  if (value.startsWith("Regional LRTP")) return "Regional LRTP";
  if (value.startsWith("Interregional JTIQ")) return "Interregional JTIQ";
  return value;
}

function TransmissionChart({
  result,
  metric,
}: {
  result: Extract<SearchResponse, { chartType: "transmission_bar" }>;
  metric: TransmissionMetric;
}) {
  const isProjects = metric === "projectsCount";
  const data = result.data.map((item) => ({
    ...item,
    displayName: shortPlanLabel(item.categoryName),
  }));

  return (
    <div
      className="h-[340px]"
      role="img"
      aria-label={
        isProjects
          ? "Transmission projects by category chart"
          : "Transmission line miles by category chart"
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 64, bottom: 4, left: 16 }}
        >
          <CartesianGrid horizontal={false} stroke={MISO_THEME.grid} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: MISO_THEME.slate }}
            tickFormatter={(value: number) => value.toLocaleString()}
            tickLine={false}
            axisLine={{ stroke: MISO_THEME.border }}
          />
          <YAxis
            type="category"
            dataKey="displayName"
            width={132}
            tick={{ fontSize: 12, fill: MISO_THEME.ink }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value: unknown) => [
              `${formatNumber(value)} ${isProjects ? "projects" : "miles"}`,
              isProjects ? "Projects" : "Line miles",
            ]}
          />
          <Bar
            dataKey={metric}
            name={isProjects ? "Projects" : "Line miles"}
            fill={MISO_THEME.blue}
            radius={[0, 2, 2, 0]}
          >
            <LabelList
              dataKey={metric}
              position="right"
              formatter={(value: unknown) => formatNumber(value)}
              style={{ fill: MISO_THEME.ink, fontSize: 12, fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartForResult({
  result,
  lmpChartMode,
  transmissionMetric,
  fuelChartMode,
}: {
  result: SearchResponse;
  lmpChartMode: LmpChartMode;
  transmissionMetric: TransmissionMetric;
  fuelChartMode: FuelChartMode;
}) {
  if (result.chartType === "lmp_series") {
    return <LmpChart result={result} mode={lmpChartMode} />;
  }
  if (result.chartType === "fuel_mix") {
    return <FuelMixChart result={result} mode={fuelChartMode} />;
  }
  if (result.chartType === "transmission_bar") {
    return <TransmissionChart result={result} metric={transmissionMetric} />;
  }
  return null;
}

function HourlyDataDetails({
  result,
}: {
  result: Extract<SearchResponse, { chartType: "lmp_series" }>;
}) {
  return (
    <details className="mt-5 border-t border-miso-border pt-4">
      <summary className="cursor-pointer text-sm font-semibold text-miso-sky">
        View exact hourly values
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[850px] border-collapse text-left text-xs">
          <caption className="sr-only">
            Hourly LMP, component, and volume values
          </caption>
          <thead className="bg-miso-card text-miso-navy">
            <tr>
              {[
                "Interval",
                "RT LMP ($/MWh)",
                "DA LMP ($/MWh)",
                "Spread ($/MWh)",
                "Energy",
                "Congestion",
                "Loss",
                "Volume (MWh)",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="border-b border-miso-border px-3 py-2 font-semibold"
                >
                  <GlossaryHighlight text={heading} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.data.map((point) => (
              <tr key={point.hourEnding}>
                <th
                  scope="row"
                  className="border-b border-miso-border px-3 py-2 font-semibold text-miso-navy"
                >
                  {point.intervalLabel}
                </th>
                <td className="border-b border-miso-border px-3 py-2 tabular-nums">
                  {point.realTimeLmp.toFixed(2)}
                </td>
                <td className="border-b border-miso-border px-3 py-2 tabular-nums">
                  {point.dayAheadLmp.toFixed(2)}
                </td>
                <td className="border-b border-miso-border px-3 py-2 tabular-nums">
                  {point.spread.toFixed(2)}
                </td>
                <td className="border-b border-miso-border px-3 py-2 tabular-nums">
                  {point.energyComponent?.toFixed(2) ?? "—"}
                </td>
                <td className="border-b border-miso-border px-3 py-2 tabular-nums">
                  {point.congestionComponent?.toFixed(2) ?? "—"}
                </td>
                <td className="border-b border-miso-border px-3 py-2 tabular-nums">
                  {point.lossComponent?.toFixed(2) ?? "—"}
                </td>
                <td className="border-b border-miso-border px-3 py-2 tabular-nums">
                  {point.volumeMwh.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function GlossaryReference({ result }: { result: GlossarySearchResponse }) {
  const acronym =
    result.data.acronym ??
    result.kpis.find((kpi) => kpi.label === "Standard Acronym")?.value ??
    "MISO term";

  return (
    <article className="p-6 lg:p-8">
      <p className="miso-eyebrow flex items-center gap-2">
        <BookOpen size={15} aria-hidden="true" /> MISO terminology
      </p>

      <div className="mt-3 flex items-start gap-4 border-b border-miso-border pb-5">
        <span className="bg-miso-navy px-3 py-2 text-base font-bold text-white">
          {acronym}
        </span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-miso-navy">
            {result.data.term}
          </h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-miso-muted">
            {result.data.category}
          </p>
        </div>
      </div>

      <section aria-labelledby="plain-language-heading" className="mt-6">
        <h3
          id="plain-language-heading"
          className="text-sm font-bold text-miso-navy"
        >
          Plain-language explanation
        </h3>
        <p className="mt-2 max-w-4xl text-base leading-8 text-miso-slate">
          <GlossaryHighlight text={result.data.eli5} />
        </p>
      </section>

      <div className="mt-6 grid gap-6 border-t border-miso-border pt-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="technical-definition-heading">
          <h3
            id="technical-definition-heading"
            className="text-sm font-bold text-miso-navy"
          >
            Technical detail
          </h3>
          <p className="mt-2 text-sm leading-7 text-miso-muted">
            <GlossaryHighlight text={result.data.technical} />
          </p>
        </section>

        {result.data.formula && (
          <section
            aria-labelledby="formula-heading"
            className="border-l-4 border-miso-sky bg-miso-soft p-4"
          >
            <h3
              id="formula-heading"
              className="text-xs font-bold uppercase tracking-[0.1em] text-miso-navy"
            >
              Reference formula or benchmark
            </h3>
            <p className="mt-2 font-mono text-sm font-semibold leading-6 text-miso-navy">
              {result.data.formula}
            </p>
          </section>
        )}
      </div>
    </article>
  );
}

function GuidanceCardView({
  result,
  onFollowUp,
}: {
  result: GuidanceSearchResponse;
  onFollowUp: (followUp: FollowUp) => void;
}) {
  return (
    <article className="p-6 lg:p-8">
      <div className="flex items-center gap-2 text-amber-700">
        <Compass size={18} aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-wider">MISO Domain Guidance</span>
      </div>

      <div className="mt-3 border-b border-miso-border pb-5">
        <h2 className="text-2xl font-bold tracking-tight text-miso-navy">
          Out of Scope or Ambiguous Query
        </h2>
        <p className="mt-1 text-sm text-miso-muted">
          &ldquo;{result.query}&rdquo; does not match operational MISO wholesale electric market records.
        </p>
      </div>

      <section aria-labelledby="guidance-explanation" className="mt-6">
        <h3 id="guidance-explanation" className="text-sm font-bold text-miso-navy">
          Why did this happen?
        </h3>
        <p className="mt-2 max-w-4xl text-base leading-8 text-miso-slate">
          {result.directAnswer}
        </p>
      </section>

      {result.data?.scopeCategories && result.data.scopeCategories.length > 0 && (
        <section aria-labelledby="supported-topics" className="mt-8 border-t border-miso-border pt-6">
          <h3 id="supported-topics" className="text-xs font-bold uppercase tracking-wider text-miso-navy">
            Supported MISO Search Domains
          </h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {result.data.scopeCategories.map((item, idx) => (
              <li
                key={idx}
                className="flex flex-col gap-1 rounded-lg border border-miso-border bg-slate-50/70 p-3.5 text-xs text-miso-slate"
              >
                <span className="font-bold text-miso-navy">{item.category}</span>
                <span className="text-miso-muted text-[11px] leading-4">e.g. {item.examples}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.data?.suggestedQueries && result.data.suggestedQueries.length > 0 && (
        <section aria-labelledby="sample-queries" className="mt-8 border-t border-miso-border pt-6">
          <h3 id="sample-queries" className="text-xs font-bold uppercase tracking-wider text-miso-navy">
            Recommended Starting Searches
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.data.suggestedQueries.map((sampleQ) => (
              <button
                key={sampleQ}
                type="button"
                onClick={() =>
                  onFollowUp({
                    action: "search",
                    label: sampleQ,
                    params: { q: sampleQ },
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-miso-sky/40 bg-sky-50/60 px-3.5 py-1.5 text-xs font-medium text-miso-sky hover:bg-sky-100 hover:border-miso-sky transition cursor-pointer"
              >
                <span>{sampleQ}</span>
                <ArrowRight size={12} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function stringParameter(followUp: FollowUp, key: string) {
  const value = followUp.params[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringArrayParameter(followUp: FollowUp, key: string) {
  const value = followUp.params[key];
  if (!Array.isArray(value)) return null;
  const strings = value.filter(
    (item): item is string => typeof item === "string" && Boolean(item.trim()),
  );
  return strings.length ? strings : null;
}

function hasLmpComponents(result: SearchResponse) {
  return (
    result.chartType === "lmp_series" &&
    result.data.some(
      (point) =>
        typeof point.energyComponent === "number" &&
        typeof point.congestionComponent === "number" &&
        typeof point.lossComponent === "number",
    )
  );
}

function canRunFollowUp(result: SearchResponse, followUp: FollowUp) {
  switch (followUp.action) {
    case "compare_hubs":
      return (stringArrayParameter(followUp, "hubs")?.length ?? 0) >= 2;
    case "compare_fuels":
      return Boolean(stringArrayParameter(followUp, "fuels")?.length);
    case "compare_plans":
      return Boolean(stringArrayParameter(followUp, "plans")?.length);
    case "show_spread":
      return result.chartType === "lmp_series";
    case "show_components":
      return hasLmpComponents(result);
    case "download_csv":
      return resultRows(result).length > 0;
    case "generate_briefing":
      return Boolean(stringParameter(followUp, "hub") ?? result.hubId);
    case "view_tariff":
      return Boolean(stringParameter(followUp, "term"));
    case "view_glossary":
      return Boolean(stringParameter(followUp, "term"));
    case "search":
      return Boolean(stringParameter(followUp, "q"));
    case "view_fuel_mix":
      return true;
    default:
      return false;
  }
}

function chartHeading(
  result: SearchResponse,
  lmpChartMode: LmpChartMode,
  transmissionMetric: TransmissionMetric,
  fuelChartMode: FuelChartMode,
) {
  if (result.chartType === "lmp_series") {
    if (lmpChartMode === "spread") return "24-hour RT–DA price spread";
    if (lmpChartMode === "components") return "24-hour LMP components";
    return "24-hour LMP price curve";
  }
  if (result.chartType === "fuel_mix") {
    return fuelChartMode === "donut"
      ? "Generation fuel mix on margin"
      : "Generation fuel mix share";
  }
  return transmissionMetric === "projectsCount"
    ? "Transmission projects by portfolio"
    : "Transmission line miles by portfolio";
}

function resultCategory(result: SearchResponse) {
  if (result.chartType === "lmp_series") return "Market pricing result";
  if (result.chartType === "fuel_mix") return "Generation result";
  if (result.chartType === "transmission_bar") return "Planning result";
  if (result.chartType === "guidance_card") return "Scope guidance";
  return "Glossary result";
}

export default function KnowledgeCanvas({
  apiBase,
  audienceMode,
  result,
  onFollowUp,
  isStarred,
  onToggleStar,
}: Props) {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [lmpChartMode, setLmpChartMode] = useState<LmpChartMode>("prices");
  const [transmissionMetric, setTransmissionMetric] =
    useState<TransmissionMetric>("projectsCount");
  const [fuelChartMode, setFuelChartMode] = useState<FuelChartMode>("donut");

  useEffect(() => {
    setLmpChartMode("prices");
    setTransmissionMetric("projectsCount");
    setFuelChartMode("donut");
  }, [result]);

  const visibleFollowUps = useMemo(() => {
    if (!result) return [];
    return result.proactiveFollowUps.filter((followUp) => {
      if (!canRunFollowUp(result, followUp)) return false;

      if (
        result.hubId &&
        (followUp.action === "download_csv" ||
          followUp.action === "generate_briefing")
      ) {
        return false;
      }
      return true;
    });
  }, [result]);

  if (!result) {
    return (
      <section data-tour="knowledge-canvas" className="miso-panel border-dashed px-8 py-10 text-center">
        <h2 className="text-xl font-bold text-miso-navy">
          Search results will appear here
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-miso-muted">
          Search for a hub, fuel record, transmission plan, or glossary term to
          open a focused answer and analysis workspace.
        </p>
      </section>
    );
  }

  const activeHubId = result.hubId;

  const focusSupportingData = () => {
    window.setTimeout(
      () =>
        document
          .getElementById("supporting-data")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      0,
    );
  };

  const runAction = (followUp: FollowUp) => {
    switch (followUp.action) {
      case "download_csv":
        downloadCsv(result);
        return;

      case "generate_briefing": {
        const hub = stringParameter(followUp, "hub") ?? result.hubId;
        if (hub) {
          window.open(
            briefingUrl(apiBase, hub, audienceMode),
            "_blank",
            "noopener,noreferrer",
          );
        }
        return;
      }

      case "show_spread":
        if (result.chartType === "lmp_series") {
          setLmpChartMode("spread");
          focusSupportingData();
        }
        return;

      case "show_components":
        if (hasLmpComponents(result)) {
          setLmpChartMode("components");
          focusSupportingData();
        }
        return;

      case "view_tariff":
        window.open(TARIFF_DOCUMENTATION_URL, "_blank", "noopener,noreferrer");
        return;

      default:
        onFollowUp(followUp);
    }
  };

  const actionSidebar = (
    <aside data-tour="export-sidebar" className="border-t border-miso-border bg-miso-card p-5 xl:border-l xl:border-t-0 xl:p-6">
      <SourceEvidence result={result} audienceMode={audienceMode} />

      <div className="mt-6 border-t border-miso-border pt-5">
        <p className="miso-eyebrow">Interactive Copilot</p>
        <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50/70 p-3.5 text-xs text-purple-950">
          <div className="flex items-center gap-1.5 font-semibold text-purple-900">
            <Sparkles size={14} className="text-purple-600" />
            <span>Canvas Copilot</span>
          </div>
          <p className="mt-1 text-[11px] leading-4 text-purple-700">
            Ask grounded questions, explore spreads, or request deeper analysis on this data.
          </p>
          <button
            type="button"
            onClick={() => setIsCopilotOpen(true)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded bg-purple-700 px-3 py-2 font-semibold text-white shadow-xs hover:bg-purple-800 transition cursor-pointer"
          >
            <Sparkles size={13} />
            <span>Ask Canvas Copilot</span>
          </button>
        </div>
      </div>

      {(visibleFollowUps.length > 0 || activeHubId) && (
        <div className="mt-6 border-t border-miso-border pt-5">
          <p className="miso-eyebrow">Next actions</p>
          <div className="mt-3 space-y-2">
            {visibleFollowUps.map((followUp) => (
              <button
                key={`${followUp.action}:${followUp.label}:${JSON.stringify(followUp.params)}`}
                type="button"
                onClick={() => runAction(followUp)}
                className="miso-button-secondary w-full justify-start text-left text-xs"
              >
                {followUp.label}
              </button>
            ))}
          </div>

          {activeHubId && (
            <div className="mt-5 border-t border-miso-border pt-5">
              <p className="miso-eyebrow">Export active result</p>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      briefingUrl(apiBase, activeHubId, audienceMode),
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                  className="miso-button-primary w-full text-xs"
                >
                  <FileText size={14} aria-hidden="true" /> PDF fact sheet
                </button>
                <button
                  type="button"
                  onClick={() => downloadCsv(result)}
                  className="miso-button-secondary w-full text-xs"
                >
                  <Download size={14} aria-hidden="true" /> Download CSV
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );

  if (result.chartType === "glossary_card") {
    return (
      <>
        <section
          data-tour="knowledge-canvas"
          aria-live="polite"
          className="miso-panel overflow-hidden border-t-4 border-t-miso-sky"
        >
          <div className="grid xl:grid-cols-[minmax(0,1fr)_19rem]">
            <GlossaryReference result={result} />
            {actionSidebar}
          </div>
        </section>
        <CanvasCopilotDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          apiBase={apiBase}
          result={result}
          audienceMode={audienceMode}
        />
      </>
    );
  }

  if (result.chartType === "guidance_card") {
    return (
      <>
        <section
          data-tour="knowledge-canvas"
          aria-live="polite"
          className="miso-panel overflow-hidden border-t-4 border-t-amber-500"
        >
          <div className="grid xl:grid-cols-[minmax(0,1fr)_19rem]">
            <GuidanceCardView result={result} onFollowUp={onFollowUp} />
            {actionSidebar}
          </div>
        </section>
        <CanvasCopilotDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          apiBase={apiBase}
          result={result}
          audienceMode={audienceMode}
        />
      </>
    );
  }

  return (
    <>
      <section
        data-tour="knowledge-canvas"
        aria-live="polite"
        className="miso-panel overflow-hidden border-t-4 border-t-miso-sky"
      >
        <div className="grid xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0">
            <header className="border-b border-miso-border p-6 lg:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="miso-eyebrow">{resultCategory(result)}</p>
                    {result.isAiSynthesized && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-800 border border-purple-200"
                        title="Executive synthesis generated with Google Gemini based strictly on grounded MISO operational data"
                      >
                        <Sparkles size={11} className="text-purple-600" />
                        Grounded AI
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-miso-navy">
                    {result.query}
                  </h2>
                </div>
              {onToggleStar && (
                <button
                  type="button"
                  onClick={() => onToggleStar(result.query)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition cursor-pointer shadow-2xs ${
                    isStarred
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : "bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-800 border-slate-300"
                  }`}
                  title={isStarred ? "Remove from Starred Hubs" : "Add to Starred Hubs"}
                >
                  <Star
                    size={14}
                    className={isStarred ? "fill-amber-400 text-amber-500" : ""}
                  />
                  <span>{isStarred ? "Starred" : "Star Query"}</span>
                </button>
              )}
            </div>
            <p className="mt-4 max-w-5xl whitespace-pre-line text-sm leading-7 text-miso-slate">
              <GlossaryHighlight
                text={result.directAnswer.replace(/[*`]/g, "")}
              />
            </p>
          </header>

          <MetricRail result={result} />

          <div id="supporting-data" className="scroll-mt-4 p-6 lg:p-8">
            <div className="mb-5 flex items-end justify-between gap-6">
              <div>
                <p className="miso-eyebrow">Analysis</p>
                <h3 className="mt-1 text-lg font-bold text-miso-navy">
                  {chartHeading(
                    result,
                    lmpChartMode,
                    transmissionMetric,
                    fuelChartMode,
                  )}
                </h3>
              </div>

              {result.chartType === "lmp_series" && (
                <div
                  className="flex gap-2"
                  role="group"
                  aria-label="LMP chart view"
                >
                  {(
                    [
                      ["prices", "RT & DA"],
                      ["spread", "Spread"],
                      ["components", "Components"],
                    ] as const
                  ).map(([mode, label]) => {
                    const disabled =
                      mode === "components" && !hasLmpComponents(result);
                    return (
                      <button
                        key={mode}
                        type="button"
                        disabled={disabled}
                        aria-pressed={lmpChartMode === mode}
                        onClick={() => setLmpChartMode(mode)}
                        className={`miso-segment disabled:cursor-not-allowed disabled:opacity-50 ${
                          lmpChartMode === mode ? "miso-segment-active" : ""
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {result.chartType === "fuel_mix" && (
                <div
                  className="flex gap-2"
                  role="group"
                  aria-label="Fuel mix chart view"
                >
                  <button
                    type="button"
                    aria-pressed={fuelChartMode === "donut"}
                    onClick={() => setFuelChartMode("donut")}
                    className={`miso-segment ${
                      fuelChartMode === "donut" ? "miso-segment-active" : ""
                    }`}
                  >
                    Donut chart
                  </button>
                  <button
                    type="button"
                    aria-pressed={fuelChartMode === "bar"}
                    onClick={() => setFuelChartMode("bar")}
                    className={`miso-segment ${
                      fuelChartMode === "bar" ? "miso-segment-active" : ""
                    }`}
                  >
                    Bar chart
                  </button>
                </div>
              )}

              {result.chartType === "transmission_bar" && (
                <div
                  className="flex gap-2"
                  role="group"
                  aria-label="Transmission chart view"
                >
                  <button
                    type="button"
                    aria-pressed={transmissionMetric === "projectsCount"}
                    onClick={() => setTransmissionMetric("projectsCount")}
                    className={`miso-segment ${
                      transmissionMetric === "projectsCount"
                        ? "miso-segment-active"
                        : ""
                    }`}
                  >
                    Projects
                  </button>
                  <button
                    type="button"
                    aria-pressed={transmissionMetric === "miles"}
                    onClick={() => setTransmissionMetric("miles")}
                    className={`miso-segment ${
                      transmissionMetric === "miles"
                        ? "miso-segment-active"
                        : ""
                    }`}
                  >
                    Line miles
                  </button>
                </div>
              )}
            </div>

            <ChartForResult
              result={result}
              lmpChartMode={lmpChartMode}
              transmissionMetric={transmissionMetric}
              fuelChartMode={fuelChartMode}
            />

            {result.chartType === "lmp_series" && (
              <HourlyDataDetails result={result} />
            )}
          </div>
        </div>

        {actionSidebar}
      </div>
    </section>
    <CanvasCopilotDrawer
      isOpen={isCopilotOpen}
      onClose={() => setIsCopilotOpen(false)}
      apiBase={apiBase}
      result={result}
      audienceMode={audienceMode}
    />
  </>
  );
}
