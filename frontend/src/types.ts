export type AudienceMode =
  | "Power Trader"
  | "Municipal Co-op"
  | "Public / Media"
  | "State Regulator";

export type Kpi = { label: string; value: string; color: string };
export type FollowUp = { label: string; action: string; params: Record<string, unknown> };

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
  data: HourlyPoint[] | FuelPoint[] | Array<Record<string, unknown>> | Record<string, unknown>;
  proactiveFollowUps: FollowUp[];
};

export type ComparisonResponse = {
  compareType: string;
  items: string[];
  title: string;
  metricsSummary: Array<Record<string, unknown>>;
  series: Array<Record<string, string | number>>;
  sourceCitation: string;
};
