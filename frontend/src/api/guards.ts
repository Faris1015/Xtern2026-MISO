import type {
  ComparisonResponse,
  FuelComparisonPoint,
  FuelMetricSummary,
  FuelPoint,
  FollowUp,
  GlossaryPoint,
  HourlyPoint,
  HubComparisonPoint,
  HubMetricSummary,
  HubPayload,
  HubSummary,
  Kpi,
  KpiColor,
  PeakRecord,
  PlanComparisonPoint,
  PlanMetricSummary,
  SearchResponse,
  SessionPrefetchResponse,
  TransmissionPoint,
} from "../types";

type JsonObject = Record<string, unknown>;

const KPI_COLORS: readonly KpiColor[] = [
  "sky",
  "slate",
  "red",
  "emerald",
  "amber",
  "purple",
];

function invalid(path: string, expectation: string): never {
  throw new Error(`Invalid API response: ${path} must be ${expectation}.`);
}

function objectValue(value: unknown, path: string): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return invalid(path, "an object");
  }
  return value as JsonObject;
}

function arrayValue(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) return invalid(path, "an array");
  return value;
}

function stringValue(value: unknown, path: string): string {
  if (typeof value !== "string") return invalid(path, "a string");
  return value;
}

function nullableStringValue(value: unknown, path: string): string | null {
  if (value === null) return null;
  return stringValue(value, path);
}

function optionalStringValue(
  value: unknown,
  path: string,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  return stringValue(value, path);
}

function numberValue(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return invalid(path, "a finite number");
  }
  return value;
}

function optionalNumberValue(
  value: unknown,
  path: string,
): number | undefined {
  if (value === undefined || value === null) return undefined;
  return numberValue(value, path);
}

function stringArrayValue(value: unknown, path: string): string[] {
  return arrayValue(value, path).map((item, index) =>
    stringValue(item, `${path}[${index}]`),
  );
}

function parseKpi(value: unknown, path: string): Kpi {
  const object = objectValue(value, path);
  const color = stringValue(object.color, `${path}.color`);
  if (!KPI_COLORS.includes(color as KpiColor)) {
    return invalid(
      `${path}.color`,
      `one of ${KPI_COLORS.map((item) => `"${item}"`).join(", ")}`,
    );
  }

  return {
    label: stringValue(object.label, `${path}.label`),
    value: stringValue(object.value, `${path}.value`),
    color: color as KpiColor,
  };
}

function parseFollowUp(value: unknown, path: string): FollowUp {
  const object = objectValue(value, path);
  return {
    label: stringValue(object.label, `${path}.label`),
    action: stringValue(object.action, `${path}.action`),
    params: objectValue(object.params, `${path}.params`),
  };
}

function parseHourlyPoint(value: unknown, path: string): HourlyPoint {
  const object = objectValue(value, path);
  return {
    hourEnding: numberValue(object.hourEnding, `${path}.hourEnding`),
    intervalLabel: stringValue(object.intervalLabel, `${path}.intervalLabel`),
    realTimeLmp: numberValue(object.realTimeLmp, `${path}.realTimeLmp`),
    dayAheadLmp: numberValue(object.dayAheadLmp, `${path}.dayAheadLmp`),
    spread: numberValue(object.spread, `${path}.spread`),
    volumeMwh: numberValue(object.volumeMwh, `${path}.volumeMwh`),
    energyComponent: optionalNumberValue(
      object.energyComponent,
      `${path}.energyComponent`,
    ),
    congestionComponent: optionalNumberValue(
      object.congestionComponent,
      `${path}.congestionComponent`,
    ),
    lossComponent: optionalNumberValue(
      object.lossComponent,
      `${path}.lossComponent`,
    ),
  };
}

function parseFuelPoint(value: unknown, path: string): FuelPoint {
  const object = objectValue(value, path);
  return {
    fuel: stringValue(object.fuel, `${path}.fuel`),
    percentage: numberValue(object.percentage, `${path}.percentage`),
    installedGw: numberValue(object.installedGw, `${path}.installedGw`),
    color: optionalStringValue(object.color, `${path}.color`),
  };
}

function parseTransmissionPoint(
  value: unknown,
  path: string,
): TransmissionPoint {
  const object = objectValue(value, path);
  return {
    id: stringValue(object.id, `${path}.id`),
    categoryName: stringValue(object.categoryName, `${path}.categoryName`),
    projectsCount: numberValue(
      object.projectsCount,
      `${path}.projectsCount`,
    ),
    miles: numberValue(object.miles, `${path}.miles`),
    investmentEst: stringValue(
      object.investmentEst,
      `${path}.investmentEst`,
    ),
    focus: stringValue(object.focus, `${path}.focus`),
  };
}

function parseGlossaryPoint(value: unknown, path: string): GlossaryPoint {
  const object = objectValue(value, path);
  const related = object.related;
  if (related !== undefined && related !== null && !Array.isArray(related)) {
    return invalid(`${path}.related`, "an array when present");
  }

  return {
    acronym: optionalStringValue(object.acronym, `${path}.acronym`),
    term: stringValue(object.term, `${path}.term`),
    category: stringValue(object.category, `${path}.category`),
    eli5: stringValue(object.eli5, `${path}.eli5`),
    technical: stringValue(object.technical, `${path}.technical`),
    formula: optionalStringValue(object.formula, `${path}.formula`),
    related: Array.isArray(related) ? related : undefined,
    source: optionalStringValue(object.source, `${path}.source`),
  };
}

export function parseSearchResponse(value: unknown): SearchResponse {
  const object = objectValue(value, "search response");
  const chartType = stringValue(object.chartType, "search response.chartType");
  const hubId = nullableStringValue(object.hubId, "search response.hubId");
  const common = {
    query: stringValue(object.query, "search response.query"),
    directAnswer: stringValue(
      object.directAnswer,
      "search response.directAnswer",
    ),
    sourceCitation: stringValue(
      object.sourceCitation,
      "search response.sourceCitation",
    ),
    kpis: arrayValue(object.kpis, "search response.kpis").map((item, index) =>
      parseKpi(item, `search response.kpis[${index}]`),
    ),
    proactiveFollowUps: arrayValue(
      object.proactiveFollowUps,
      "search response.proactiveFollowUps",
    ).map((item, index) =>
      parseFollowUp(item, `search response.proactiveFollowUps[${index}]`),
    ),
  };

  switch (chartType) {
    case "lmp_series": {
      if (!hubId) return invalid("search response.hubId", "a hub ID");
      return {
        ...common,
        chartType,
        hubId,
        data: arrayValue(object.data, "search response.data").map(
          (item, index) =>
            parseHourlyPoint(item, `search response.data[${index}]`),
        ),
      };
    }
    case "fuel_mix":
      if (hubId !== null) {
        return invalid("search response.hubId", "null for fuel data");
      }
      return {
        ...common,
        chartType,
        hubId: null,
        data: arrayValue(object.data, "search response.data").map(
          (item, index) =>
            parseFuelPoint(item, `search response.data[${index}]`),
        ),
      };
    case "transmission_bar":
      if (hubId !== null) {
        return invalid("search response.hubId", "null for transmission data");
      }
      return {
        ...common,
        chartType,
        hubId: null,
        data: arrayValue(object.data, "search response.data").map(
          (item, index) =>
            parseTransmissionPoint(item, `search response.data[${index}]`),
        ),
      };
    case "glossary_card":
      if (hubId !== null) {
        return invalid("search response.hubId", "null for glossary data");
      }
      return {
        ...common,
        chartType,
        hubId: null,
        data: parseGlossaryPoint(object.data, "search response.data"),
      };
    default:
      return invalid(
        "search response.chartType",
        '"lmp_series", "fuel_mix", "transmission_bar", or "glossary_card"',
      );
  }
}

function parseHubMetricSummary(
  value: unknown,
  path: string,
): HubMetricSummary {
  const object = objectValue(value, path);
  return {
    hubId: stringValue(object.hubId, `${path}.hubId`),
    name: stringValue(object.name, `${path}.name`),
    realTimeAvg: numberValue(object.realTimeAvg, `${path}.realTimeAvg`),
    dayAheadAvg: numberValue(object.dayAheadAvg, `${path}.dayAheadAvg`),
    spreadAvg: numberValue(object.spreadAvg, `${path}.spreadAvg`),
    peakHour: stringValue(object.peakHour, `${path}.peakHour`),
    peakPrice: numberValue(object.peakPrice, `${path}.peakPrice`),
    volume: stringValue(object.volume, `${path}.volume`),
  };
}

function parseHubComparisonPoint(
  value: unknown,
  path: string,
): HubComparisonPoint {
  const object = objectValue(value, path);
  const point: HubComparisonPoint = {
    hourEnding: numberValue(object.hourEnding, `${path}.hourEnding`),
    intervalLabel: stringValue(object.intervalLabel, `${path}.intervalLabel`),
  };

  Object.entries(object).forEach(([key, item]) => {
    if (key === "hourEnding" || key === "intervalLabel") return;
    if (typeof item !== "string" && typeof item !== "number") {
      invalid(`${path}.${key}`, "a string or number");
    }
    point[key] = item;
  });

  return point;
}

function parseFuelMetricSummary(
  value: unknown,
  path: string,
): FuelMetricSummary {
  const object = objectValue(value, path);
  return {
    fuel: stringValue(object.fuel, `${path}.fuel`),
    percentage: numberValue(object.percentage, `${path}.percentage`),
    peakRecord: stringValue(object.peakRecord, `${path}.peakRecord`),
    role: stringValue(object.role, `${path}.role`),
  };
}

function parseFuelComparisonPoint(
  value: unknown,
  path: string,
): FuelComparisonPoint {
  const object = objectValue(value, path);
  return {
    fuel: stringValue(object.fuel, `${path}.fuel`),
    percentage: numberValue(object.percentage, `${path}.percentage`),
    installedGw: numberValue(object.installedGw, `${path}.installedGw`),
  };
}

function parsePlanMetricSummary(
  value: unknown,
  path: string,
): PlanMetricSummary {
  const object = objectValue(value, path);
  return {
    category: stringValue(object.category, `${path}.category`),
    projects: numberValue(object.projects, `${path}.projects`),
    miles: stringValue(object.miles, `${path}.miles`),
    investment: stringValue(object.investment, `${path}.investment`),
    focus: stringValue(object.focus, `${path}.focus`),
  };
}

function parsePlanComparisonPoint(
  value: unknown,
  path: string,
): PlanComparisonPoint {
  const object = objectValue(value, path);
  return {
    category: stringValue(object.category, `${path}.category`),
    projects: numberValue(object.projects, `${path}.projects`),
    miles: numberValue(object.miles, `${path}.miles`),
  };
}

export function parseComparisonResponse(value: unknown): ComparisonResponse {
  const object = objectValue(value, "comparison response");
  const compareType = stringValue(
    object.compareType,
    "comparison response.compareType",
  );
  const base = {
    items: stringArrayValue(object.items, "comparison response.items"),
    title: stringValue(object.title, "comparison response.title"),
    sourceCitation: stringValue(
      object.sourceCitation,
      "comparison response.sourceCitation",
    ),
  };

  switch (compareType) {
    case "hubs":
      return {
        ...base,
        compareType,
        metricsSummary: arrayValue(
          object.metricsSummary,
          "comparison response.metricsSummary",
        ).map((item, index) =>
          parseHubMetricSummary(
            item,
            `comparison response.metricsSummary[${index}]`,
          ),
        ),
        series: arrayValue(object.series, "comparison response.series").map(
          (item, index) =>
            parseHubComparisonPoint(
              item,
              `comparison response.series[${index}]`,
            ),
        ),
      };
    case "fuels":
      return {
        ...base,
        compareType,
        metricsSummary: arrayValue(
          object.metricsSummary,
          "comparison response.metricsSummary",
        ).map((item, index) =>
          parseFuelMetricSummary(
            item,
            `comparison response.metricsSummary[${index}]`,
          ),
        ),
        series: arrayValue(object.series, "comparison response.series").map(
          (item, index) =>
            parseFuelComparisonPoint(
              item,
              `comparison response.series[${index}]`,
            ),
        ),
      };
    case "plans":
      return {
        ...base,
        compareType,
        metricsSummary: arrayValue(
          object.metricsSummary,
          "comparison response.metricsSummary",
        ).map((item, index) =>
          parsePlanMetricSummary(
            item,
            `comparison response.metricsSummary[${index}]`,
          ),
        ),
        series: arrayValue(object.series, "comparison response.series").map(
          (item, index) =>
            parsePlanComparisonPoint(
              item,
              `comparison response.series[${index}]`,
            ),
        ),
      };
    default:
      return invalid(
        "comparison response.compareType",
        '"hubs", "fuels", or "plans"',
      );
  }
}

function parseHubSummary(value: unknown, path: string): HubSummary {
  const object = objectValue(value, path);
  return {
    realTimeAvg: numberValue(object.realTimeAvg, `${path}.realTimeAvg`),
    dayAheadAvg: numberValue(object.dayAheadAvg, `${path}.dayAheadAvg`),
    peakHour: stringValue(object.peakHour, `${path}.peakHour`),
    peakPrice: numberValue(object.peakPrice, `${path}.peakPrice`),
    peakHE: numberValue(object.peakHE, `${path}.peakHE`),
    totalVolumeMwh: numberValue(
      object.totalVolumeMwh,
      `${path}.totalVolumeMwh`,
    ),
    formattedVolume: stringValue(
      object.formattedVolume,
      `${path}.formattedVolume`,
    ),
  };
}

function parseHubPayload(value: unknown, path: string): HubPayload {
  const object = objectValue(value, path);
  return {
    hubId: stringValue(object.hubId, `${path}.hubId`),
    hubName: stringValue(object.hubName, `${path}.hubName`),
    region: stringValue(object.region, `${path}.region`),
    summary: parseHubSummary(object.summary, `${path}.summary`),
    hourly: arrayValue(object.hourly, `${path}.hourly`).map((item, index) =>
      parseHourlyPoint(item, `${path}.hourly[${index}]`),
    ),
  };
}

function parsePeakRecord(value: unknown, path: string): PeakRecord {
  const object = objectValue(value, path);
  return {
    valueGw: numberValue(object.valueGw, `${path}.valueGw`),
    date: stringValue(object.date, `${path}.date`),
    time: stringValue(object.time, `${path}.time`),
    description: stringValue(object.description, `${path}.description`),
  };
}

export function parseSessionPrefetchResponse(
  value: unknown,
): SessionPrefetchResponse {
  const object = objectValue(value, "session prefetch response");
  const recentPeaks = objectValue(
    object.recentPeaks,
    "session prefetch response.recentPeaks",
  );

  return {
    sessionContext: stringValue(
      object.sessionContext,
      "session prefetch response.sessionContext",
    ),
    timestamp: stringValue(
      object.timestamp,
      "session prefetch response.timestamp",
    ),
    featuredHub: parseHubPayload(
      object.featuredHub,
      "session prefetch response.featuredHub",
    ),
    generationMixSummary: arrayValue(
      object.generationMixSummary,
      "session prefetch response.generationMixSummary",
    ).map((item, index) =>
      parseFuelPoint(
        item,
        `session prefetch response.generationMixSummary[${index}]`,
      ),
    ),
    recentPeaks: {
      windPeak: parsePeakRecord(
        recentPeaks.windPeak,
        "session prefetch response.recentPeaks.windPeak",
      ),
      solarPeak: parsePeakRecord(
        recentPeaks.solarPeak,
        "session prefetch response.recentPeaks.solarPeak",
      ),
      allTimeDemandRecord: parsePeakRecord(
        recentPeaks.allTimeDemandRecord,
        "session prefetch response.recentPeaks.allTimeDemandRecord",
      ),
    },
    quickStartChips: arrayValue(
      object.quickStartChips,
      "session prefetch response.quickStartChips",
    ).map((item, index) => {
      const chip = objectValue(
        item,
        `session prefetch response.quickStartChips[${index}]`,
      );
      return {
        label: stringValue(
          chip.label,
          `session prefetch response.quickStartChips[${index}].label`,
        ),
        query: stringValue(
          chip.query,
          `session prefetch response.quickStartChips[${index}].query`,
        ),
        type: stringValue(
          chip.type,
          `session prefetch response.quickStartChips[${index}].type`,
        ),
      };
    }),
  };
}
