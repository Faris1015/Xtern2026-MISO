import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, ExternalLink, FileText, Info } from "lucide-react";
import type {
  FollowUp,
  FuelPoint,
  HourlyPoint,
  SearchResponse,
} from "../types";

const kpiColors: Record<string, string> = {
  sky: "#0284C7",
  slate: "#1E293B",
  red: "#B91C1C",
  emerald: "#047857",
  amber: "#B45309",
  purple: "#6D28D9",
};
const fuelFallbackColors = [
  "#0284C7",
  "#475569",
  "#059669",
  "#7C3AED",
  "#D97706",
  "#0E7490",
];

type Props = {
  apiBase: string;
  result: SearchResponse | null;
  onFollowUp: (followUp: FollowUp) => void;
};

function sourceUrl(citation: string) {
  if (
    citation.includes("Data Exchange") ||
    citation.includes("Market Data Exchange")
  )
    return "https://www.misoenergy.org/markets-and-operations/RTDataAPIs/";
  if (citation.includes("Fuel") || citation.includes("Telemetry"))
    return "https://www.misoenergy.org/markets-and-operations/real-time--market-data/operations-displays/";
  if (citation.includes("MTEP") || citation.includes("LRTP"))
    return "https://www.misoenergy.org/planning/";
  if (citation.includes("Tariff"))
    return "https://www.misoenergy.org/legal/business-practice-manuals/";
  return "https://www.misoenergy.org/";
}

function downloadCsv(result: SearchResponse) {
  if (!Array.isArray(result.data) || !result.data.length) return;
  const rows = result.data as Array<Record<string, unknown>>;
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

function downloadTextBriefing(result: SearchResponse) {
  const text = `${result.query}\n\n${result.directAnswer.replace(/[*`]/g, "")}\n\nSource: ${result.sourceCitation}`;
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "miso-demo-summary.txt";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function ChartForResult({ result }: { result: SearchResponse }) {
  if (result.chartType === "lmp_series" && Array.isArray(result.data))
    return (
      <div
        className="h-72"
        role="img"
        aria-label="24-hour real-time and day-ahead LMP comparison chart"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={result.data as HourlyPoint[]}>
            <XAxis dataKey="intervalLabel" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit=" $" />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}/MWh`, ""]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="realTimeLmp"
              name="Real-time"
              stroke="#0284C7"
              fill="#BAE6FD"
              fillOpacity={0.7}
            />
            <Area
              type="monotone"
              dataKey="dayAheadLmp"
              name="Day-ahead"
              stroke="#1E293B"
              fill="#E2E8F0"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  if (result.chartType === "fuel_mix" && Array.isArray(result.data)) {
    const data = result.data as FuelPoint[];
    return (
      <div className="h-72" role="img" aria-label="Generation fuel mix chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="percentage"
              nameKey="fuel"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={98}
              paddingAngle={2}
            >
              {data.map((item, index) => (
                <Cell
                  key={item.fuel}
                  fill={
                    item.color ??
                    fuelFallbackColors[index % fuelFallbackColors.length]
                  }
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`${value}%`, "Share"]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }
  if (result.chartType === "transmission_bar" && Array.isArray(result.data))
    return (
      <div
        className="h-72"
        role="img"
        aria-label="Transmission portfolio projects and line miles chart"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={result.data as Array<Record<string, unknown>>}>
            <XAxis dataKey="categoryName" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="projectsCount"
              name="Projects"
              fill="#0284C7"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="miles"
              name="Line miles"
              fill="#B45309"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  return (
    <div className="flex h-48 items-center justify-center border border-miso-border bg-miso-card text-sm text-miso-muted">
      This answer is presented as a reference card rather than a chart.
    </div>
  );
}

function DataTable({ result }: { result: SearchResponse }) {
  if (!Array.isArray(result.data) || !result.data.length) return null;
  const rows = result.data as Array<Record<string, unknown>>;
  const headers = Object.keys(rows[0]);
  return (
    <details className="mt-4 border-t border-miso-border pt-3">
      <summary className="cursor-pointer text-sm font-semibold text-miso-sky">
        View chart data as a table
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-xs">
          <thead>
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="border-b border-miso-border px-2 py-2 font-semibold text-miso-navy"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {headers.map((header) => (
                  <td
                    key={header}
                    className="border-b border-slate-100 px-2 py-2 text-miso-slate"
                  >
                    {String(row[header] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

const relevantActions: Record<SearchResponse["chartType"], string[]> = {
  lmp_series: ["compare_hubs", "show_spread", "download_csv", "generate_briefing"],
  fuel_mix: ["compare_fuels", "view_queue", "download_factsheet"],
  transmission_bar: ["compare_plans", "download_factsheet"],
  glossary_card: ["view_tariff", "view_glossary", "search"],
};

export default function KnowledgeCanvas({
  apiBase,
  result,
  onFollowUp,
}: Props) {
  const [showCitation, setShowCitation] = useState(false);
  if (!result)
    return (
      <section className="border border-dashed border-miso-border bg-white p-8 text-center">
        <h2 className="font-display text-xl font-semibold text-miso-navy">
          Search results will appear here
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-miso-muted">
          Search for a hub, fuel peak, transmission plan, or glossary term to
          see a summary, source, and supporting data.
        </p>
      </section>
    );

  const runAction = (followUp: FollowUp) => {
    if (followUp.action === "download_csv") {
      downloadCsv(result);
      return;
    }
    if (followUp.action === "generate_briefing") {
      const hub =
        typeof followUp.params.hub === "string"
          ? followUp.params.hub
          : result.hubId;
      if (hub)
        window.open(
          `${apiBase}/api/generate-briefing?hub_id=${encodeURIComponent(hub)}`,
          "_blank",
          "noopener",
        );
      return;
    }
    if (followUp.action.startsWith("download_")) {
      downloadTextBriefing(result);
      return;
    }
    onFollowUp(followUp);
  };

  return (
    <section aria-live="polite" aria-busy={false} className="space-y-5">
      <div className="border border-miso-border bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-miso-sky">
              Search result
            </p>
            <h2 className="font-display text-2xl font-semibold text-miso-navy">
              {result.query}
            </h2>
          </div>
          <button
            type="button"
            aria-expanded={showCitation}
            aria-controls="source-citation"
            onClick={() => setShowCitation((visible) => !visible)}
            className="inline-flex items-center gap-1 border border-miso-sky px-3 py-2 text-xs font-bold text-miso-sky hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-miso-sky"
          >
            <Info size={15} aria-hidden="true" /> Source
          </button>
        </div>
        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-miso-slate">
          {result.directAnswer.replace(/[*`]/g, "")}
        </p>
        <div
          id="source-citation"
          hidden={!showCitation}
          className="mt-4 border-t border-miso-border pt-3 text-xs text-miso-muted"
        >
          <p>
            <span className="font-semibold text-miso-slate">Reference:</span>{" "}
            {result.sourceCitation}
          </p>
          <a
            className="mt-2 inline-flex items-center gap-1 font-semibold text-miso-sky underline"
            href={sourceUrl(result.sourceCitation)}
            target="_blank"
            rel="noreferrer"
          >
            Open official reference{" "}
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        </div>
      </div>
      {result.chartType !== "glossary_card" && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {result.kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="border border-miso-border bg-white p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-miso-muted">
                {kpi.label}
              </p>
              <p
                className="mt-2 text-xl font-bold"
                style={{ color: kpiColors[kpi.color] ?? kpiColors.sky }}
              >
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
      )}
      {result.chartType !== "glossary_card" && (
        <div className="border border-miso-border bg-white p-5 sm:p-6">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-miso-muted">
              Supporting data
            </p>
            <h3 className="mt-1 font-display text-lg font-semibold text-miso-navy">
              {result.chartType === "lmp_series"
                ? "24-hour LMP curve"
                : result.chartType === "fuel_mix"
                  ? "Generation mix"
                  : "Transmission portfolio"}
            </h3>
          </div>
          <ChartForResult result={result} />
          <DataTable result={result} />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {result.proactiveFollowUps
          .filter((followUp) =>
            relevantActions[result.chartType].includes(followUp.action),
          )
          .map((followUp) => (
          <button
            key={`${followUp.action}:${followUp.label}:${JSON.stringify(followUp.params)}`}
            type="button"
            onClick={() => runAction(followUp)}
            className="border border-miso-sky bg-sky-50 px-3 py-2 text-xs font-semibold text-miso-sky hover:bg-sky-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-miso-sky"
          >
            {followUp.label}
          </button>
        ))}
        {result.hubId && (
          <>
            <button
              type="button"
              onClick={() =>
                window.open(
                  `${apiBase}/api/generate-briefing?hub_id=${encodeURIComponent(result.hubId ?? "")}`,
                  "_blank",
                  "noopener",
                )
              }
              className="ml-auto inline-flex items-center gap-2 bg-miso-navy px-3 py-2 text-xs font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-miso-navy"
            >
              <FileText size={14} aria-hidden="true" /> PDF fact sheet
            </button>
            <button
              type="button"
              onClick={() => downloadCsv(result)}
              className="inline-flex items-center gap-2 border border-miso-border px-3 py-2 text-xs font-semibold text-miso-slate focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-miso-navy"
            >
              <Download size={14} aria-hidden="true" /> CSV
            </button>
          </>
        )}
      </div>
    </section>
  );
}
