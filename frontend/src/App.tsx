import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { BookOpen, ExternalLink, GitCompareArrows, HelpCircle, X } from "lucide-react";
import OmniSearch from "./components/OmniSearch";
import AudioBriefing from "./components/AudioBriefing";
import SessionRadar from "./components/SessionRadar";
import GuidedTour from "./components/GuidedTour";
import JargonHUD from "./components/JargonHUD";
import ErrorBoundary from "./components/ErrorBoundary";
import misoLogo from "./assets/miso-logo.png";
import { parseSearchResponse } from "./api/guards";
import {
  HUB_OPTIONS,
  type AudienceMode,
  type ComparisonType,
  type FollowUp,
  type SearchResponse,
  type SessionQuickStartChip,
} from "./types";
import { GlossaryProvider } from "./context/GlossaryContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const KnowledgeCanvas = lazy(() => import("./components/KnowledgeCanvas"));
const ComparisonMatrix = lazy(() => import("./components/ComparisonMatrix"));

function stringParameter(followUp: FollowUp, key: string): string | null {
  const value = followUp.params[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringArrayParameter(
  followUp: FollowUp,
  key: string,
): string[] | null {
  const value = followUp.params[key];
  if (!Array.isArray(value)) return null;

  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length ? [...new Set(items)] : null;
}

function scrollToComparison() {
  window.setTimeout(
    () =>
      document
        .getElementById("hub-comparison")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    100,
  );
}

export default function App() {
  const [audienceMode, setAudienceMode] =
    useState<AudienceMode>("Power Trader");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [requestedHubs, setRequestedHubs] = useState<string[] | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonType, setComparisonType] = useState<ComparisonType>("hubs");
  const [comparisonItems, setComparisonItems] = useState<string[] | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(() => {
    try {
      return !localStorage.getItem("miso_omnisearch_tour_completed");
    } catch {
      return false;
    }
  });
  const [isJargonHudOpen, setIsJargonHudOpen] = useState(false);
  const searchController = useRef<AbortController | null>(null);
  const lastQueryRef = useRef("");
  const requestVersion = useRef(0);

  const handleCloseTour = useCallback(() => {
    setIsTourOpen(false);
    try {
      localStorage.setItem("miso_omnisearch_tour_completed", "true");
    } catch {
      // ignore
    }
  }, []);

  const handleOpenTour = useCallback(() => {
    setIsTourOpen(true);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsJargonHudOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => () => searchController.current?.abort(), []);

  const search = useCallback(
    async (query: string, audienceOverride?: AudienceMode) => {
      const cleanQuery = query.trim();
      if (!cleanQuery) return;

      const selectedAudience = audienceOverride ?? audienceMode;
      lastQueryRef.current = cleanQuery;
      searchController.current?.abort();
      const controller = new AbortController();
      const version = ++requestVersion.current;
      searchController.current = controller;
      setError("");
      setIsSearching(true);

      try {
        const response = await fetch(
          `${API_BASE}/api/search?q=${encodeURIComponent(cleanQuery)}&persona=${encodeURIComponent(selectedAudience)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`Search failed (${response.status})`);

        const payload: unknown = await response.json();
        const nextResult = parseSearchResponse(payload);
        if (version === requestVersion.current) setResult(nextResult);
      } catch (caught: unknown) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        if (version === requestVersion.current) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to reach the backend.",
          );
        }
      } finally {
        if (version === requestVersion.current) setIsSearching(false);
      }
    },
    [audienceMode],
  );

  const openComparison = useCallback(
    (type: ComparisonType, items: string[]) => {
      setShowComparison(true);
      setComparisonType(type);
      setComparisonItems(items);
      setRequestedHubs(type === "hubs" ? items : null);
      scrollToComparison();
    },
    [],
  );

  const handleSessionChip = useCallback(
    (chip: SessionQuickStartChip) => {
      if (chip.type === "compare") {
        openComparison("hubs", ["INDIANA.HUB", "MICHIGAN.HUB"]);
        return;
      }
      void search(chip.query);
    },
    [openComparison, search],
  );

  const handleAudienceModeChange = useCallback(
    (nextAudience: AudienceMode) => {
      if (nextAudience === audienceMode) return;

      const queryToRefresh = result?.query ?? lastQueryRef.current;
      setAudienceMode(nextAudience);

      if (queryToRefresh) {
        setResult(null);
        void search(queryToRefresh, nextAudience);
      }
    },
    [audienceMode, result, search],
  );

  const handleFollowUp = useCallback(
    (followUp: FollowUp) => {
      setError("");

      switch (followUp.action) {
        case "compare_hubs": {
          const requested = stringArrayParameter(followUp, "hubs");
          const validHubs =
            requested
              ?.map((hub) => hub.toUpperCase())
              .filter((hub) =>
                HUB_OPTIONS.includes(hub as (typeof HUB_OPTIONS)[number]),
              ) ?? [];

          if (validHubs.length < 2) {
            setError(
              "The hub comparison action did not include two valid hubs",
            );
            return;
          }
          openComparison("hubs", validHubs);
          return;
        }

        case "compare_fuels": {
          const fuels = stringArrayParameter(followUp, "fuels");
          if (!fuels?.length) {
            setError("The fuel comparison action did not include any fuels");
            return;
          }
          openComparison("fuels", fuels);
          return;
        }

        case "compare_plans": {
          const plans = stringArrayParameter(followUp, "plans");
          if (!plans?.length) {
            setError("The plan comparison action did not include any plans");
            return;
          }
          openComparison("plans", plans);
          return;
        }

        case "search": {
          const query = stringParameter(followUp, "q");
          if (!query) {
            setError("The search action did not include a query");
            return;
          }
          void search(query);
          return;
        }

        case "view_glossary": {
          const term = stringParameter(followUp, "term");
          if (!term) {
            setError(
              "Related-acronym browsing is not available in this prototype yet",
            );
            return;
          }
          void search(`What is ${term}?`);
          return;
        }

        case "view_fuel_mix":
          void search("Current Fuel Mix");
          return;

        default:
          setError(
            `“${followUp.label}” is not available in this prototype yet`,
          );
      }
    },
    [openComparison, search],
  );

  const changeComparisonType = useCallback((type: ComparisonType) => {
    setComparisonType(type);
    setComparisonItems(
      type === "fuels"
        ? ["Solar", "Wind"]
        : type === "plans"
          ? ["mtep_local", "lrtp_regional"]
          : null,
    );
    setRequestedHubs(null);
    setShowComparison(true);
  }, []);

  const clearRequestedHubs = useCallback(() => setRequestedHubs(null), []);

  const resultResetKey = result
    ? `${result.chartType}:${result.query}:${audienceMode}`
    : `empty:${audienceMode}`;
  const comparisonResetKey = `${comparisonType}:${comparisonItems?.join("|") ?? "default"}:${requestedHubs?.join("|") ?? "none"}`;

  return (
    <GlossaryProvider apiBase={API_BASE} onSearchTerm={(q) => void search(q)}>
      <div className="miso-omnisearch min-h-screen bg-canvas">
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>

      <div className="bg-miso-navy text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-2 text-xs">
          <span className="font-semibold tracking-wide">
            Markets &amp; Operations · Public Information
          </span>
          <a
            href="https://www.misoenergy.org/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-slate-200 hover:text-white"
          >
            MISOenergy.org <ExternalLink size={12} aria-hidden="true" />
          </a>
        </div>
      </div>

      <header className="border-b border-miso-border bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-8 py-4">
          <div className="flex items-center gap-4">
            <img src={misoLogo} alt="MISO" className="h-11 w-auto" />
            <div className="border-l border-miso-border pl-4">
              <p className="text-lg font-bold tracking-tight text-miso-navy">
                OmniSearch
              </p>
              <p className="text-xs text-miso-muted">
                Predictive and comparative knowledge engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AudioBriefing
              audienceMode={audienceMode}
              onAudienceModeChange={handleAudienceModeChange}
            />

            <button
              type="button"
              onClick={() => setIsJargonHudOpen(true)}
              aria-label="Open MISO Jargon HUD (Acronym dictionary)"
              className="miso-button-secondary text-xs sm:text-sm flex items-center gap-1.5"
            >
              <BookOpen size={16} className="text-miso-sky" aria-hidden="true" />
              <span>Jargon HUD</span>
              <kbd className="hidden md:inline-block rounded bg-miso-soft px-1.5 py-0.5 text-[10px] font-semibold text-miso-muted border border-miso-border">
                Ctrl+J
              </kbd>
            </button>

            <button
              type="button"
              onClick={handleOpenTour}
              aria-label="Start interactive guided tour"
              className="miso-button-secondary text-xs sm:text-sm"
            >
              <HelpCircle size={16} className="text-miso-sky" aria-hidden="true" />
              Guided Tour
            </button>

            <button
              type="button"
              data-tour="comparison-btn"
              onClick={() => {
                if (showComparison) {
                  setShowComparison(false);
                  return;
                }
                setComparisonType("hubs");
                setComparisonItems(null);
                setShowComparison(true);
                scrollToComparison();
              }}
              className="miso-button-secondary text-xs sm:text-sm"
            >
              <GitCompareArrows size={16} aria-hidden="true" />
              {showComparison ? "Close comparison" : "Comparison workspace"}
            </button>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto max-w-[1440px] space-y-6 px-8 py-7 lg:py-9"
      >
        <nav aria-label="Breadcrumb" className="text-xs text-miso-muted">
          <span>Markets &amp; Operations</span>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span className="font-semibold text-miso-navy">OmniSearch</span>
        </nav>

        <OmniSearch
          audienceMode={audienceMode}
          onAudienceModeChange={handleAudienceModeChange}
          onSearch={search}
          isSearching={isSearching}
        />

        <SessionRadar apiBase={API_BASE} onSelectChip={handleSessionChip} />

        {isSearching && (
          <div
            role="status"
            className="border-l-4 border-l-miso-sky bg-miso-soft px-4 py-3 text-sm font-semibold text-miso-navy"
          >
            Preparing the search result…
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <span>
              {error}. Check that the local backend is running when the problem
              is connection-related, then try again.
            </span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="icon-button text-red-700 hover:bg-red-100 hover:text-red-900"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <ErrorBoundary
          title="The search result could not be displayed"
          resetKey={resultResetKey}
        >
          <Suspense
            fallback={
              <p role="status" className="text-sm text-miso-muted">
                Loading result view…
              </p>
            }
          >
            <KnowledgeCanvas
              apiBase={API_BASE}
              audienceMode={audienceMode}
              result={result}
              onFollowUp={handleFollowUp}
            />
          </Suspense>
        </ErrorBoundary>

        {showComparison && (
          <ErrorBoundary
            title="The comparison workspace could not be displayed"
            resetKey={comparisonResetKey}
          >
            <Suspense
              fallback={
                <p role="status" className="text-sm text-miso-muted">
                  Loading comparison workspace…
                </p>
              }
            >
              <ComparisonMatrix
                apiBase={API_BASE}
                requestedHubs={requestedHubs}
                comparisonType={comparisonType}
                requestedItems={comparisonItems}
                onRequestedHubsHandled={clearRequestedHubs}
                onComparisonTypeChange={changeComparisonType}
                onClose={() => setShowComparison(false)}
              />
            </Suspense>
          </ErrorBoundary>
        )}
      </main>

      <footer className="mt-10 border-t border-miso-border bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-5 text-xs text-miso-muted">
          <span>MISO OmniSearch · Xtern Fall 2026</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsJargonHudOpen(true)}
              className="text-miso-slate underline-offset-2 hover:text-miso-sky hover:underline transition font-semibold"
            >
              Jargon HUD
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleOpenTour}
              className="text-miso-slate underline-offset-2 hover:text-miso-sky hover:underline transition font-semibold"
            >
              Interactive Guide
            </button>
            <span aria-hidden="true">·</span>
            <span>Search · Compare · Export</span>
          </div>
        </div>
      </footer>

      <GuidedTour
        isOpen={isTourOpen}
        onClose={handleCloseTour}
        audienceMode={audienceMode}
        onAudienceModeChange={handleAudienceModeChange}
        onTriggerSampleSearch={(sampleQuery) => void search(sampleQuery)}
      />

      <JargonHUD
        isOpen={isJargonHudOpen}
        onClose={() => setIsJargonHudOpen(false)}
        onSelectTerm={(term) => void search(term)}
      />
      </div>
    </GlossaryProvider>
  );
}
