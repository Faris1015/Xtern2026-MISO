import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { GlossaryItem } from "../types";

// Baseline dictionary ensuring instant rendering before first API response resolves
const BASELINE_GLOSSARY: Record<string, GlossaryItem> = {
  LMP: {
    acronym: "LMP",
    term: "Locational Marginal Price",
    category: "Markets",
    eli5: "The price of electricity at one specific spot on the grid at one moment, accounting for energy cost, power line congestion, and line losses.",
    technical: "The marginal cost to serve the next MW of load at a specific pricing node: LMP = Energy (MEC) + Congestion (MCC) + Loss (MLC).",
    formula: "LMP = Energy + Congestion + Loss",
    related: ["MEC", "MCC", "MLC", "SCED", "CPNODE"],
    source: "https://help.misoenergy.org/knowledgebase",
  },
  CONE: {
    acronym: "CONE",
    term: "Cost of New Entry",
    category: "Reliability",
    eli5: "The estimated annual cost to build a brand-new natural gas power plant, used as the benchmark price cap in MISO capacity auctions.",
    technical: "Annualized fixed cost of a reference peaking unit used to calibrate capacity demand curves and offer caps under Tariff Module E-1.",
    formula: "Benchmark Cap for Capacity Auctions ($/MW-day)",
    related: ["PRA", "ZRC", "PRM"],
    source: "https://www.misoenergy.org/planning/resource-adequacy/",
  },
  PRA: {
    acronym: "PRA",
    term: "Planning Resource Auction",
    category: "Reliability",
    eli5: "MISO's annual capacity auction where utilities ensure they have enough power plants reserved to keep the lights on during peak days.",
    technical: "Annual voluntary auction clearing Zonal Resource Credits (ZRC) against Planning Reserve Margin Requirements (PRMR) across 10 Local Resource Zones.",
    formula: "Demand (PRMR) vs. Supply (ZRCs)",
    related: ["ZRC", "PRM", "LOLE", "CONE"],
    source: "https://www.misoenergy.org/planning/resource-adequacy/",
  },
  MTEP: {
    acronym: "MTEP",
    term: "MISO Transmission Expansion Plan",
    category: "Planning",
    eli5: "MISO's comprehensive multi-billion-dollar annual master plan to build, upgrade, and reinforce high-voltage power lines across 15 states.",
    technical: "Annual regional transmission planning portfolio approved by MISO's Board of Directors covering reliability, market efficiency, and public policy projects.",
    formula: "Annual Board Approved Portfolio",
    related: ["LRTP", "JTIQ", "MEP"],
    source: "https://www.misoenergy.org/planning/transmission-planning/",
  },
  LRTP: {
    acronym: "LRTP",
    term: "Long Range Transmission Planning",
    category: "Planning",
    eli5: "A multi-decade initiative building high-voltage transmission superhighways to move low-cost renewable power to major demand centers.",
    technical: "Scenario-based regional transmission planning effort developing 345 kV and 765 kV multi-value project portfolios across regional tranches.",
    formula: "Regional 345kV & 765kV Backbone",
    related: ["MTEP", "MVP"],
    source: "https://www.misoenergy.org/planning/long-range-transmission-planning/",
  },
  JTIQ: {
    acronym: "JTIQ",
    term: "Joint Targeted Interconnection Queue",
    category: "Planning",
    eli5: "A coordinated partnership between MISO and Southwest Power Pool (SPP) to build shared power lines along their border so new generators can connect affordably.",
    technical: "Interregional planning framework between MISO and SPP identifying high-priority seam network upgrades to reduce generator interconnection costs.",
    formula: "5 Seam Projects (~490 miles)",
    related: ["MTEP", "SPP"],
    source: "https://www.misoenergy.org/planning/interregional-planning/",
  },
  DPP: {
    acronym: "DPP",
    term: "Definitive Planning Phase",
    category: "Interconnection",
    eli5: "The technical study process where developers of wind, solar, and battery plants wait for approval and network upgrade cost assignments to connect to the grid.",
    technical: "Three-phase cluster study cycle evaluating system impact, thermal constraints, and cost assignments under Attachment X.",
    formula: "Phase 1 (SIS) -> Phase 2 (Detailed) -> Phase 3 (Facilities)",
    related: ["GIP", "GIA", "POI"],
    source: "https://www.misoenergy.org/planning/generator-interconnection/",
  },
  LOLE: {
    acronym: "LOLE",
    term: "Loss of Load Expectation",
    category: "Reliability",
    eli5: "A strict grid safety standard requiring enough generators so power never runs short more than 1 day in 10 years (0.1 days/year).",
    technical: "Probabilistic resource adequacy metric standard targeting an LOLE of <= 0.1 days/year to calibrate the Planning Reserve Margin.",
    formula: "LOLE <= 0.1 days/year",
    related: ["PRA", "PRM"],
    source: "https://www.misoenergy.org/planning/resource-adequacy/",
  },
  OASIS: {
    acronym: "OASIS",
    term: "Open Access Same-Time Information System",
    category: "Operations",
    eli5: "The public website and reservation system where electricity transmission customers buy capacity on high-voltage power lines.",
    technical: "FERC-mandated real-time information system for reserving Available Transfer Capability (ATC) under Order 889.",
    formula: "Available Transfer Capability (ATC) Marketplace",
    related: ["ATC", "OATT"],
    source: "https://www.misoenergy.org/markets-and-operations/",
  },
  FTR: {
    acronym: "FTR",
    term: "Financial Transmission Rights",
    category: "Markets",
    eli5: "A financial contract protecting electricity buyers and sellers from price differences caused by transmission bottlenecks on the grid.",
    technical: "Financial instruments entitling the holder to revenues or charges based on Day-Ahead Market locational marginal price congestion component differences.",
    formula: "Target = (MCC_Sink - MCC_Source) * MW",
    related: ["ARR", "MCC", "LMP"],
    source: "https://www.misoenergy.org/markets-and-operations/",
  },
  RT: {
    acronym: "RT",
    term: "Real-Time Market",
    category: "Markets",
    eli5: "The physical spot market that balances electricity supply and demand every 5 minutes.",
    technical: "Security-Constrained Economic Dispatch balancing real-time physical deviations against day-ahead scheduled positions.",
    formula: "5-minute SCED Dispatch",
    related: ["DA", "LMP", "SCED"],
    source: "https://www.misoenergy.org/markets-and-operations/",
  },
  DA: {
    acronym: "DA",
    term: "Day-Ahead Market",
    category: "Markets",
    eli5: "The forward energy auction where power buyers and sellers lock in prices 24 hours before power is actually generated.",
    technical: "Financially binding forward market run each morning using SCUC and SCED to commit generation for the next operating day.",
    formula: "24-Hour Forward Auction",
    related: ["RT", "LMP", "SCUC"],
    source: "https://www.misoenergy.org/markets-and-operations/",
  },
  HE: {
    acronym: "HE",
    term: "Hour Ending",
    category: "Markets",
    eli5: "The standard clock convention in electricity markets numbering the 24 hours of a day by the time an interval finishes (e.g. HE 01 is 12:00 AM–1:00 AM).",
    technical: "Standard power market time-block convention designating hourly market settlements by the trailing hour boundary in prevailing local time.",
    formula: "HE 01 through HE 24",
    related: ["LMP", "RT", "DA"],
    source: "https://www.misoenergy.org/markets-and-operations/",
  },
  MWh: {
    acronym: "MWh",
    term: "Megawatt-Hour",
    category: "Grid Units",
    eli5: "A unit of electrical energy representing one megawatt of power produced or consumed continuously for one hour. Wholesale power prices are quoted in $/MWh.",
    technical: "Unit of electrical energy equal to one megawatt of power sustained over one hour (3.6 gigajoules); standard wholesale trading unit.",
    formula: "Energy (MWh) = Power (MW) × Time (Hours)",
    related: ["MW", "GW", "LMP"],
    source: "https://www.eia.gov/tools/glossary/",
  },
  MW: {
    acronym: "MW",
    term: "Megawatt",
    category: "Grid Units",
    eli5: "A unit of electrical power equal to 1,000,000 watts, roughly enough to supply power to 750–1,000 average homes.",
    technical: "Unit of instantaneous real electrical power (10^6 watts) used to measure plant capacity and substation load.",
    formula: "1 MW = 1,000 kW = 1,000,000 W",
    related: ["MWh", "GW"],
    source: "https://www.eia.gov/tools/glossary/",
  },
  GW: {
    acronym: "GW",
    term: "Gigawatt",
    category: "Grid Units",
    eli5: "A unit of electrical power equal to 1,000 megawatts (1 billion watts), used to describe regional peak demand and large fleets of power plants.",
    technical: "Unit of electrical power equal to 10^9 watts. MISO's all-time footprint peak demand is 127.1 GW.",
    formula: "1 GW = 1,000 MW = 1,000,000 kW",
    related: ["MW", "MWh"],
    source: "https://www.eia.gov/tools/glossary/",
  },
  MISO: {
    acronym: "MISO",
    term: "Midcontinent Independent System Operator",
    category: "Governance",
    eli5: "The not-for-profit organization that coordinates the electric grid and wholesale power markets across 15 U.S. states and Manitoba.",
    technical: "FERC-certified Regional Transmission Organization (RTO) managing open-access transmission, centralized dispatch, and resource adequacy.",
    formula: "45M Population · 15 States · 77,000 Miles",
    related: ["RTO", "FERC", "NERC"],
    source: "https://www.misoenergy.org/about/",
  },
};

type GlossaryContextType = {
  glossary: Record<string, GlossaryItem>;
  acronyms: string[];
  regex: RegExp;
  isLoaded: boolean;
  getTerm: (acronym: string) => GlossaryItem | undefined;
  onSearchTerm?: (query: string) => void;
};

const GlossaryContext = createContext<GlossaryContextType | null>(null);

function buildAcronymRegex(acronyms: string[]): RegExp {
  if (acronyms.length === 0) return /$^/;
  const escaped = acronyms.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  // Use word boundaries with case-sensitive matching
  return new RegExp(`\\b(${escaped.join("|")})\\b`, "g");
}

export function GlossaryProvider({
  apiBase,
  onSearchTerm,
  children,
}: {
  apiBase: string;
  onSearchTerm?: (query: string) => void;
  children: ReactNode;
}) {
  const [glossary, setGlossary] =
    useState<Record<string, GlossaryItem>>(BASELINE_GLOSSARY);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function fetchGlossary() {
      try {
        const response = await fetch(`${apiBase}/api/glossary`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: unknown = await response.json();
        if (active && data && typeof data === "object") {
          const loadedMap: Record<string, GlossaryItem> = {
            ...BASELINE_GLOSSARY,
          };
          for (const [key, val] of Object.entries(data)) {
            if (val && typeof val === "object" && "term" in val) {
              const item = val as GlossaryItem;
              loadedMap[key] = {
                acronym: item.acronym || key,
                term: item.term,
                category: item.category || "General",
                eli5: item.eli5 || "",
                technical: item.technical || "",
                formula: item.formula || "",
                related: item.related || [],
                source: item.source || "",
              };
            }
          }
          setGlossary(loadedMap);
          setIsLoaded(true);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Baseline remains active as fallback
        if (active) setIsLoaded(true);
      }
    }

    void fetchGlossary();
    return () => {
      active = false;
      controller.abort();
    };
  }, [apiBase]);

  // Sort acronyms by length descending so longer acronyms match first (e.g. MTEP before MEP)
  const acronyms = useMemo(() => {
    return Object.keys(glossary).sort((a, b) => b.length - a.length);
  }, [glossary]);

  const regex = useMemo(() => buildAcronymRegex(acronyms), [acronyms]);

  const getTerm = useCallback(
    (acronym: string) => {
      return glossary[acronym] ?? glossary[acronym.toUpperCase()];
    },
    [glossary],
  );

  const contextValue = useMemo(
    () => ({
      glossary,
      acronyms,
      regex,
      isLoaded,
      getTerm,
      onSearchTerm,
    }),
    [glossary, acronyms, regex, isLoaded, getTerm, onSearchTerm],
  );

  return (
    <GlossaryContext.Provider value={contextValue}>
      {children}
    </GlossaryContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGlossary(): GlossaryContextType {
  const context = useContext(GlossaryContext);
  if (!context) {
    // Return a default baseline fallback if used outside provider
    const acronyms = Object.keys(BASELINE_GLOSSARY).sort(
      (a, b) => b.length - a.length,
    );
    return {
      glossary: BASELINE_GLOSSARY,
      acronyms,
      regex: buildAcronymRegex(acronyms),
      isLoaded: false,
      getTerm: (acronym: string) =>
        BASELINE_GLOSSARY[acronym] ??
        BASELINE_GLOSSARY[acronym.toUpperCase()],
    };
  }
  return context;
}
