import { Area, AreaChart, Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileText, Info, Sparkles } from "lucide-react";
import type { FuelPoint, HourlyPoint, SearchResponse } from "../types";

const kpiColors: Record<string, string> = { sky: "#007c83", slate: "#5d6b86", red: "#c94c4c", emerald: "#3c8a68", amber: "#d4773c", purple: "#8f5a9c" };
const fuelFallbackColors = ["#007c83", "#5d6b86", "#3c8a68", "#8f5a9c", "#d4773c", "#6b9aa1"];

type Props = { apiBase: string; result: SearchResponse | null; onFollowUp: (query: string) => void };

function downloadCsv(result: SearchResponse) {
  if (!Array.isArray(result.data) || !result.data.length) return;
  const rows = result.data as Array<Record<string, unknown>>;
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = `${result.hubId ?? "miso"}-data.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function ChartForResult({ result }: { result: SearchResponse }) {
  if (result.chartType === "lmp_series" && Array.isArray(result.data)) {
    return <div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={result.data as HourlyPoint[]}><XAxis dataKey="intervalLabel" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} unit=" $" /><Tooltip formatter={(value: number) => [`$${value.toFixed(2)}/MWh`, ""]} /><Legend /><Area type="monotone" dataKey="realTimeLmp" name="Real-time" stroke="#007c83" fill="#b8e0df" fillOpacity={0.6} /><Area type="monotone" dataKey="dayAheadLmp" name="Day-ahead" stroke="#5d6b86" fill="#dfe4ec" fillOpacity={0.65} /></AreaChart></ResponsiveContainer></div>;
  }
  if (result.chartType === "fuel_mix" && Array.isArray(result.data)) {
    const data = result.data as FuelPoint[];
    return <div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="percentage" nameKey="fuel" cx="50%" cy="50%" innerRadius={62} outerRadius={98} paddingAngle={2}>{data.map((item, index) => <Cell key={item.fuel} fill={item.color ?? fuelFallbackColors[index % fuelFallbackColors.length]} />)}</Pie><Tooltip formatter={(value: number) => [`${value}%`, "Share"]} /><Legend /></PieChart></ResponsiveContainer></div>;
  }
  if (result.chartType === "transmission_bar" && Array.isArray(result.data)) {
    const data = result.data as Array<{ categoryName?: string; projectsCount?: number; miles?: number }>;
    return <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><XAxis dataKey="categoryName" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Bar dataKey="projectsCount" name="Projects" fill="#007c83" radius={[4, 4, 0, 0]} /><Bar dataKey="miles" name="Line miles" fill="#d4773c" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>;
  }
  return <div className="flex h-48 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">This answer is presented as a reference card rather than a chart.</div>;
}

export default function KnowledgeCanvas({ apiBase, result, onFollowUp }: Props) {
  if (!result) return <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-subtle"><Sparkles className="mx-auto text-miso-teal" /><h2 className="mt-3 font-display text-xl font-semibold text-miso-ink">Your knowledge canvas is ready</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Search for a hub, fuel peak, transmission plan, or any acronym in the MISO glossary to see a grounded answer and supporting data.</p></section>;

  return <section className="space-y-5">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-miso-teal"><Sparkles size={14} /> Verified answer</p><h2 className="font-display text-2xl font-semibold text-miso-ink">{result.query}</h2></div><button type="button" title={result.sourceCitation} aria-label={`Source: ${result.sourceCitation}`} className="rounded-full bg-teal-50 p-2 text-miso-teal"><Info size={17} /></button></div>
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">{result.directAnswer}</p>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500"><span className="font-semibold text-slate-700">Grounded in:</span> {result.sourceCitation}</p>
    </div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{result.kpis.map((kpi) => <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{kpi.label}</p><p className="mt-2 text-xl font-bold" style={{ color: kpiColors[kpi.color] ?? kpiColors.sky }}>{kpi.value}</p></div>)}</div>
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle sm:p-6"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Supporting view</p><h3 className="mt-1 font-display text-lg font-semibold text-miso-ink">{result.chartType === "lmp_series" ? "24-hour LMP curve" : result.chartType === "fuel_mix" ? "Generation mix on margin" : result.chartType === "transmission_bar" ? "Transmission portfolio" : "Glossary reference"}</h3></div><ChartForResult result={result} /></div>
    <div className="flex flex-wrap items-center gap-2">{result.proactiveFollowUps.map((followUp) => <button key={followUp.label} type="button" onClick={() => onFollowUp(String(followUp.params.q ?? followUp.params.term ?? followUp.label))} className="rounded-full border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-miso-teal hover:bg-teal-100">{followUp.label}</button>)}{result.hubId && <><button type="button" onClick={() => window.open(`${apiBase}/api/generate-briefing?hub_id=${encodeURIComponent(result.hubId!)}`, "_blank")} className="ml-auto inline-flex items-center gap-2 rounded-full bg-miso-ink px-3 py-2 text-xs font-semibold text-white"><FileText size={14} /> PDF fact sheet</button><button type="button" onClick={() => downloadCsv(result)} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"><Download size={14} /> CSV</button></>}</div>
  </section>;
}
