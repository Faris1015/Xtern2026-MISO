import { useEffect, useState } from "react";
import { ArrowRight, Lightbulb } from "lucide-react";
import type { SessionPrefetchResponse } from "../types";

type Props = { apiBase: string; onSelectQuery: (query: string) => void };

export default function SessionRadar({ apiBase, onSelectQuery }: Props) {
  const [payload, setPayload] = useState<SessionPrefetchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`${apiBase}/api/session-prefetch`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Session prefetch failed (${response.status})`);
        return response.json() as Promise<SessionPrefetchResponse>;
      })
      .then(setPayload)
      .catch((caught: unknown) => {
        if (!(caught instanceof DOMException && caught.name === "AbortError"))
          setError(true);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [apiBase]);

  return (
    <aside
      aria-labelledby="starting-points-heading"
      className="border-l-4 border-miso-sky bg-white p-4 sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 bg-miso-navy p-2 text-white">
            <Lightbulb size={20} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-miso-sky">
              Suggested starting points
            </p>
            <h2
              id="starting-points-heading"
              className="mt-1 text-sm font-semibold text-miso-navy"
            >
              {loading
                ? "Loading suggested searches…"
                : error
                  ? "Suggested searches are unavailable."
                  : "Explore a common public-information question."}
            </h2>
            {!loading && !error && (
              <p className="mt-1 max-w-2xl text-sm leading-6 text-miso-muted">
                Suggestions are preconfigured starting points, not tracking of
                your browsing activity.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {payload?.quickStartChips.slice(0, 3).map((chip) => (
            <button
              key={`${chip.type}:${chip.label}`}
              type="button"
              onClick={() => onSelectQuery(chip.query)}
              className="group inline-flex items-center gap-2 border border-miso-border bg-white px-3 py-2 text-xs font-semibold text-miso-navy hover:border-miso-sky hover:text-miso-sky focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-miso-sky"
            >
              {chip.label}
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
