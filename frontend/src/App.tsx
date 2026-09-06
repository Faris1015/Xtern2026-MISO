import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { RefreshCw } from "lucide-react";
import OmniSearch from "./components/OmniSearch";
import SessionRadar from "./components/SessionRadar";
import misoLogo from "./assets/miso-logo.png";
import {
  HUB_OPTIONS,
  type AudienceMode,
  type FollowUp,
  type SearchResponse,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const KnowledgeCanvas = lazy(() => import("./components/KnowledgeCanvas"));
const ComparisonMatrix = lazy(() => import("./components/ComparisonMatrix"));

function followUpQuery(followUp: FollowUp) {
  const query = followUp.params.q ?? followUp.params.term;
  if (typeof query === "string" && query.trim()) return query;
  if (followUp.action === "compare_fuels") return "Current Fuel Mix";
  if (followUp.action === "compare_plans") return "MTEP24 LRTP Tranche 2";
  return followUp.label;
}

export default function App() {
  const [audienceMode, setAudienceMode] =
    useState<AudienceMode>("Power Trader");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [requestedHubs, setRequestedHubs] = useState<string[] | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonType, setComparisonType] = useState<
    "hubs" | "fuels" | "plans"
  >("hubs");
  const [comparisonItems, setComparisonItems] = useState<string[] | null>(null);
  const searchController = useRef<AbortController | null>(null);
  const requestVersion = useRef(0);

  useEffect(() => () => searchController.current?.abort(), []);

  const search = useCallback(
    async (query: string) => {
      const cleanQuery = query.trim();
      if (!cleanQuery) return;
      searchController.current?.abort();
      const controller = new AbortController();
      const version = ++requestVersion.current;
      searchController.current = controller;
      setError("");
      setIsSearching(true);
      try {
        const response = await fetch(
          `${API_BASE}/api/search?q=${encodeURIComponent(cleanQuery)}&persona=${encodeURIComponent(audienceMode)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`Search failed (${response.status})`);
        const nextResult = (await response.json()) as SearchResponse;
        if (version === requestVersion.current) setResult(nextResult);
      } catch (caught: unknown) {
        if (caught instanceof DOMException && caught.name === "AbortError")
          return;
        if (version === requestVersion.current)
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to reach the backend.",
          );
      } finally {
        if (version === requestVersion.current) setIsSearching(false);
      }
    },
    [audienceMode],
  );

  const handleFollowUp = useCallback(
    (followUp: FollowUp) => {
      if (
        followUp.action === "compare_hubs" &&
        Array.isArray(followUp.params.hubs)
      ) {
        const validHubs = followUp.params.hubs.filter(
          (hub): hub is string =>
            typeof hub === "string" &&
            HUB_OPTIONS.includes(
              hub.toUpperCase() as (typeof HUB_OPTIONS)[number],
            ),
        );
        if (validHubs.length >= 2) {
          setShowComparison(true);
          setComparisonType("hubs");
          setRequestedHubs(validHubs);
          setComparisonItems(validHubs);
          window.setTimeout(
            () =>
              document
                .getElementById("hub-comparison")
                ?.scrollIntoView({ behavior: "smooth", block: "start" }),
            100,
          );
          return;
        }
      }
      if (
        followUp.action === "compare_fuels" ||
        followUp.action === "compare_plans"
      ) {
        const key = followUp.action === "compare_fuels" ? "fuels" : "plans";
        const rawItems = followUp.params[key];
        if (!Array.isArray(rawItems)) {
          void search(followUpQuery(followUp));
          return;
        }
        const items = rawItems.filter(
          (item): item is string => typeof item === "string",
        );
        setShowComparison(true);
        setComparisonType(
          followUp.action === "compare_fuels" ? "fuels" : "plans",
        );
        setComparisonItems(items);
        setRequestedHubs(null);
        window.setTimeout(
          () =>
            document
              .getElementById("hub-comparison")
              ?.scrollIntoView({ behavior: "smooth", block: "start" }),
          100,
        );
        return;
      }
      void search(followUpQuery(followUp));
    },
    [search],
  );

  const changeComparisonType = useCallback(
    (type: "hubs" | "fuels" | "plans") => {
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
    },
    [],
  );

  return (
    <main className="min-h-screen bg-canvas">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="bg-miso-navy text-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-3 lg:px-10">
          <div className="flex items-center gap-3">
            <img
              src={misoLogo}
              alt="MISO"
              className="h-10 w-auto bg-white px-2 py-1"
            />
            <div>
              <p className="text-base font-semibold tracking-tight">
                MISO OmniSearch
              </p>
              <p className="text-xs text-slate-300">
                Public energy data, made navigable
              </p>
            </div>
          </div>
        </div>
      </header>
      <div
        id="main-content"
        className="mx-auto max-w-[1400px] space-y-7 px-5 py-7 lg:px-10 lg:py-9"
      >
        <OmniSearch
          audienceMode={audienceMode}
          onAudienceModeChange={setAudienceMode}
          onSearch={search}
          isSearching={isSearching}
        />
        <SessionRadar apiBase={API_BASE} onSelectQuery={search} />
        {isSearching && (
          <p role="status" className="text-sm text-miso-muted">
            Loading search result...
          </p>
        )}
        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <span>
              {error}. Check that the local backend is running, then try again.
            </span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="icon-button"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        )}
        <Suspense
          fallback={
            <p role="status" className="text-sm text-miso-muted">
              Loading result view...
            </p>
          }
        >
          <KnowledgeCanvas
            apiBase={API_BASE}
            result={result}
            onFollowUp={handleFollowUp}
          />
        </Suspense>
        {!showComparison && (
          <div className="border border-miso-border bg-white p-4 text-sm text-miso-muted">
            Need to compare locations?{" "}
            <button
              type="button"
              onClick={() => {
                setComparisonType("hubs");
                setComparisonItems(null);
                setShowComparison(true);
              }}
              className="font-semibold text-miso-sky underline"
            >
              Compare hub price curves
            </button>
          </div>
        )}
        {showComparison && (
          <Suspense
            fallback={
              <p role="status" className="text-sm text-miso-muted">
                Loading comparison workspace...
              </p>
            }
          >
            <ComparisonMatrix
              apiBase={API_BASE}
              requestedHubs={requestedHubs}
              comparisonType={comparisonType}
              requestedItems={comparisonItems}
              onRequestedHubsHandled={() => setRequestedHubs(null)}
              onComparisonTypeChange={changeComparisonType}
              onClose={() => setShowComparison(false)}
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
