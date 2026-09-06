export type AudienceMode =
  | "Power Trader"
  | "Municipal Co-op"
  | "Public / Media"
  | "State Regulator";

export const HUB_OPTIONS = [
  "INDIANA.HUB",
  "ILLINOIS.HUB",
  "MICHIGAN.HUB",
  "MINN.HUB",
  "LOUISIANA.HUB",
  "TEXAS.HUB",
] as const;

export type KpiColor = "sky" | "slate" | "red" | "emerald" | "amber" | "purple";
export type Kpi = { label: string; value: string; color: KpiColor };
export type FollowUp = {
  label: string;
  action: string;
  params: Record<string, unknown>;
};

export type HourlyPoint = {
  hourEnding: number;
  intervalLabel: string;
  realTimeLmp: number;
  dayAheadLmp: number;
  spread: number;
  volumeMwh: number;
  energyComponent?: number;
  congestionComponent?: number;
  lossComponent?: number;
};

export type FuelPoint = {
  fuel: string;
  percentage: number;
  installedGw: number;
  color?: string;
};

export type SearchResponse = {
  query: string;
  directAnswer: string;
  sourceCitation: string;
  kpis: Kpi[];
  chartType: "lmp_series" | "fuel_mix" | "transmission_bar" | "glossary_card";
  hubId: string | null;
  data:
    | HourlyPoint[]
    | FuelPoint[]
    | Array<Record<string, unknown>>
    | Record<string, unknown>;
  proactiveFollowUps: FollowUp[];
};

export type ComparisonResponse = {
  compareType: "hubs" | "fuels" | "plans";
  items: string[];
  title: string;
  metricsSummary: Array<HubMetricSummary | Record<string, unknown>>;
  series: ComparisonSeriesPoint[];
  sourceCitation: string;
};

export type HubMetricSummary = {
  hubId: string;
  name: string;
  realTimeAvg: number;
  dayAheadAvg: number;
  spreadAvg: number;
  peakHour: string;
  peakPrice: number;
  volume: string;
};

export type ComparisonSeriesPoint = {
  hourEnding: number;
  intervalLabel: string;
  [key: string]: string | number;
};

export type SessionPrefetchResponse = {
  sessionContext: string;
  timestamp: string;
  featuredHub: Record<string, unknown>;
  generationMixSummary: FuelPoint[];
  recentPeaks: Record<string, unknown>;
  quickStartChips: Array<{ label: string; query: string; type: string }>;
};
