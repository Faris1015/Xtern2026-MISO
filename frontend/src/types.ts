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

export type HubId = (typeof HUB_OPTIONS)[number];
export type ComparisonType = "hubs" | "fuels" | "plans";
export type ChartType =
  | "lmp_series"
  | "fuel_mix"
  | "transmission_bar"
  | "glossary_card"
  | "guidance_card"
  | "bpm_card";


export type KpiColor =
  | "sky"
  | "slate"
  | "red"
  | "emerald"
  | "amber"
  | "purple";

export type Kpi = {
  label: string;
  value: string;
  color: KpiColor;
};

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

export type TransmissionPoint = {
  id: string;
  categoryName: string;
  projectsCount: number;
  miles: number;
  investmentEst: string;
  focus: string;
};

export type GlossaryPoint = {
  acronym?: string;
  term: string;
  category: string;
  eli5: string;
  technical: string;
  formula?: string;
  related?: unknown[];
  source?: string;
  governingBpm?: string;
};

export type GlossaryItem = {
  acronym: string;
  term: string;
  category: string;
  eli5: string;
  technical: string;
  formula?: string;
  related?: unknown[];
  source?: string;
  governingBpm?: string;
};

type SearchResponseBase<
  TChart extends ChartType,
  TData,
  THub extends string | null,
> = {
  query: string;
  directAnswer: string;
  sourceCitation: string;
  kpis: Kpi[];
  chartType: TChart;
  hubId: THub;
  data: TData;
  proactiveFollowUps: FollowUp[];
  isAiSynthesized?: boolean;
  inferredPersona?: AudienceMode;
  personaSuggestionReason?: string;
};


export type GuidanceData = {
  message?: string;
  suggestedQueries: string[];
  scopeCategories: { category: string; examples: string }[];
};

export type GuidanceSearchResponse = SearchResponseBase<
  "guidance_card",
  GuidanceData,
  null
>;

export type HubSearchResponse = SearchResponseBase<
  "lmp_series",
  HourlyPoint[],
  string
>;

export type FuelSearchResponse = SearchResponseBase<
  "fuel_mix",
  FuelPoint[],
  null
>;

export type TransmissionSearchResponse = SearchResponseBase<
  "transmission_bar",
  TransmissionPoint[],
  null
>;

export type GlossarySearchResponse = SearchResponseBase<
  "glossary_card",
  GlossaryPoint,
  null
>;

export type BpmManual = {
  bpmNumber: string;
  number?: number;
  title: string;
  category: string;
  tariffModule?: string;
  effectiveDate: string;
  summary: string;
  questionsAnswered: string[];
  governedConcepts?: string[];
  relevantPersonas?: string[];
  downloadUrl: string;
  misoWebUrl: string;
};

export type BpmData = BpmManual & {
  isCatalog?: boolean;
  manuals?: BpmManual[];
  allManualsCount?: number;
};

export type BpmSearchResponse = SearchResponseBase<
  "bpm_card",
  BpmData,
  null
>;

export type SearchResponse =
  | HubSearchResponse
  | FuelSearchResponse
  | TransmissionSearchResponse
  | GlossarySearchResponse
  | GuidanceSearchResponse
  | BpmSearchResponse;


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

export type HubComparisonPoint = {
  hourEnding: number;
  intervalLabel: string;
  [key: string]: string | number;
};

export type FuelMetricSummary = {
  fuel: string;
  percentage: number;
  peakRecord: string;
  role: string;
};

export type FuelComparisonPoint = {
  fuel: string;
  percentage: number;
  installedGw: number;
};

export type PlanMetricSummary = {
  category: string;
  projects: number;
  miles: string;
  investment: string;
  focus: string;
};

export type PlanComparisonPoint = {
  category: string;
  projects: number;
  miles: number;
};

type ComparisonResponseBase<TType extends ComparisonType> = {
  compareType: TType;
  items: string[];
  title: string;
  sourceCitation: string;
};

export type HubComparisonResponse = ComparisonResponseBase<"hubs"> & {
  metricsSummary: HubMetricSummary[];
  series: HubComparisonPoint[];
};

export type FuelComparisonResponse = ComparisonResponseBase<"fuels"> & {
  metricsSummary: FuelMetricSummary[];
  series: FuelComparisonPoint[];
};

export type PlanComparisonResponse = ComparisonResponseBase<"plans"> & {
  metricsSummary: PlanMetricSummary[];
  series: PlanComparisonPoint[];
};

export type ComparisonResponse =
  | HubComparisonResponse
  | FuelComparisonResponse
  | PlanComparisonResponse;

export type HubSummary = {
  realTimeAvg: number;
  dayAheadAvg: number;
  peakHour: string;
  peakPrice: number;
  peakHE: number;
  totalVolumeMwh: number;
  formattedVolume: string;
};

export type HubPayload = {
  hubId: string;
  hubName: string;
  region: string;
  summary: HubSummary;
  hourly: HourlyPoint[];
};

export type PeakRecord = {
  valueGw: number;
  date: string;
  time: string;
  description: string;
};

export type RecentPeaks = {
  windPeak: PeakRecord;
  solarPeak: PeakRecord;
  allTimeDemandRecord: PeakRecord;
};

export type SessionQuickStartChip = {
  label: string;
  query: string;
  type: string;
};

export type SessionPrefetchResponse = {
  sessionContext: string;
  timestamp: string;
  featuredHub: HubPayload;
  generationMixSummary: FuelPoint[];
  recentPeaks: RecentPeaks;
  quickStartChips: SessionQuickStartChip[];
};

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CanvasChatRequest {
  message: string;
  canvasContext: Record<string, unknown>;
  persona: AudienceMode;
  history?: ChatMessage[];
}

export interface CanvasChatResponse {
  response: string;
  citations: string[];
  suggestedFollowUps: string[];
  isAiGenerated: boolean;
}

export type FeedbackCategory =
  | "bug"
  | "data_inaccuracy"
  | "feature_request"
  | "general";

export interface FeedbackPayload {
  category: FeedbackCategory;
  rating?: number;
  message: string;
  persona?: AudienceMode;
  queryContext?: string;
  userEmail?: string;
}

export interface FeedbackResponse {
  status: string;
  feedbackId: string;
  message: string;
  timestamp: string;
}

