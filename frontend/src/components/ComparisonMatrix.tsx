import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertCircle, GitCompareArrows, LoaderCircle } from "lucide-react";
import type { ComparisonResponse } from "../types";

const hubs = ["INDIANA.HUB", "MICHIGAN.HUB", "ILLINOIS.HUB", "TEXAS.HUB"];
const strokeColors = ["#007c83", "#d4773c", "#5d6b86", "#8f5a9c"];

type Props = { apiBase: string };

export default function ComparisonMatrix({ apiBase }: Props) {
  const [selected, setSelected] = useState(["INDIANA.HUB", "MICHIGAN.HUB"]);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selected.length) { setComparison(null); return; }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`${apiBase}/api/compare?type=hubs&items=${selected.join(",")}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error(`Comparison failed (${response.status})`); return response.json() as Promise<ComparisonResponse>; })
      .then(setComparison)
      .catch((caught: unknown) => { if (!(caught instanceof DOMException && caught.name === "AbortError")) setError(caught instanceof Error ? caught.message : "Unable to load comparison."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [apiBase, selected]);

  const chartData = useMemo(() => comparison?.series.map((point) => {
    const next: Record<string, string | number> = { intervalLabel: point.intervalLabel ?? "", hourEnding: point.hourEnding ?? 0 };
    selected.forEach((hub) => { const prefix = hub.replace(".HUB", ""); next[prefix] = point[`${prefix}_rt`] ?? 0; });
    return next;
  }) ?? [], [comparison, selected]);

  const toggleHub = (hub: string) => setSelected((current) => current.includes(hub) ? current.filter((item) => item !== hub) : [...current, hub]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-miso-teal"><GitCompareArrows size={15} /> Comparison workspace</p><h2 className="mt-1 font-display text-xl font-semibold text-miso-ink">Compare hub price curves</h2><p className="mt-1 text-sm text-slate-500">Select two or more hubs to expose real-time price divergence.</p></div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{selected.length} selected</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">{hubs.map((hub) => <label key={hub} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${selected.includes(hub) ? "border-teal-200 bg-teal-50 text-miso-ink" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}><input type="checkbox" checked={selected.includes(hub)} onChange={() => toggleHub(hub)} className="accent-teal-700" />{hub.replace(".HUB", "")}</label>)}</div>
      {loading && <div className="flex items-center gap-2 py-12 text-sm text-slate-500"><LoaderCircle size={18} className="animate-spin" /> Loading comparison…</div>}
      {!loading && error && <p className="flex items-center gap-2 py-8 text-sm text-red-700"><AlertCircle size={17} />{error}</p>}
      {!loading && !error && !selected.length && <p className="py-8 text-sm text-slate-500">Select at least one hub.</p>}
      {!loading && !error && comparison && <><div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><XAxis dataKey="intervalLabel" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend />{selected.map((hub, index) => <Area key={hub} type="monotone" dataKey={hub.replace(".HUB", "")} name={hub.replace(".HUB", "")} stroke={strokeColors[index % strokeColors.length]} fill={strokeColors[index % strokeColors.length]} fillOpacity={0.1} />)}</AreaChart></ResponsiveContainer></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{comparison.metricsSummary.filter((summary) => selected.includes(String(summary.hubId))).map((summary) => <div key={String(summary.hubId)} className="rounded-xl bg-slate-50 p-3 text-sm"><p className="font-semibold text-miso-ink">{String(summary.name)}</p><p className="mt-1 text-slate-600">RT avg <strong>${String(summary.realTimeAvg)}</strong>/MWh</p><p className="text-slate-600">RT–DA spread <strong>${String(summary.spreadAvg)}</strong>/MWh</p></div>)}</div></>}
    </section>
  );
}
