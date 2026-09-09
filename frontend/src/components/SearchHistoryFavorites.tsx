import { useState, useEffect, useCallback } from "react";
import { Star, Clock, Trash2, X } from "lucide-react";

export type StarredItem = {
  id: string;
  label: string;
  query: string;
};

const DEFAULT_STARRED: StarredItem[] = [
  { id: "star-indiana", label: "Indiana Hub", query: "Indiana Hub LMP" },
  { id: "star-michigan", label: "Michigan Hub", query: "Michigan Hub LMP" },
  { id: "star-texas", label: "Texas Hub", query: "Texas Hub LMP" },
  { id: "star-fuel", label: "Fuel Mix", query: "Current Fuel Mix" },
  { id: "star-lrtp", label: "LRTP Portfolios", query: "LRTP transmission lines" },
];

type Props = {
  currentQuery?: string;
  onSelectQuery: (query: string) => void;
};

export default function SearchHistoryFavorites({
  currentQuery,
  onSelectQuery,
}: Props) {
  const [starred, setStarred] = useState<StarredItem[]>(() => {
    try {
      const stored = localStorage.getItem("miso_omnisearch_starred");
      return stored ? JSON.parse(stored) : DEFAULT_STARRED;
    } catch {
      return DEFAULT_STARRED;
    }
  });

  const [history, setHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("miso_omnisearch_history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Track search query into history
  useEffect(() => {
    if (!currentQuery || !currentQuery.trim()) return;
    const clean = currentQuery.trim();

    setHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 6);
      try {
        localStorage.setItem("miso_omnisearch_history", JSON.stringify(updated));
      } catch {
        // ignore quota
      }
      return updated;
    });
  }, [currentQuery]);

  const toggleStar = useCallback(
    (query: string, label?: string) => {
      setStarred((prev) => {
        const clean = query.trim();
        const exists = prev.some(
          (item) => item.query.toLowerCase() === clean.toLowerCase(),
        );
        let updated: StarredItem[];
        if (exists) {
          updated = prev.filter(
            (item) => item.query.toLowerCase() !== clean.toLowerCase(),
          );
        } else {
          const newLabel = label || clean;
          updated = [
            ...prev,
            {
              id: `star-${Date.now()}`,
              label: newLabel,
              query: clean,
            },
          ];
        }
        try {
          localStorage.setItem("miso_omnisearch_starred", JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    [],
  );

  const removeHistoryItem = useCallback((e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    setHistory((prev) => {
      const updated = prev.filter((h) => h !== item);
      try {
        localStorage.setItem("miso_omnisearch_history", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem("miso_omnisearch_history");
    } catch {
      // ignore
    }
  }, []);

  const isCurrentQueryStarred =
    currentQuery &&
    starred.some(
      (item) => item.query.toLowerCase() === currentQuery.trim().toLowerCase(),
    );

  return (
    <div
      aria-label="Search History and Favorite Hubs"
      className="flex flex-col gap-2 pt-1 pb-2 text-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Starred Hubs / Favorites Row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-miso-muted uppercase tracking-wider">
            <Star size={12} className="text-amber-500 fill-amber-400" aria-hidden="true" />
            Starred:
          </span>
          {starred.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectQuery(item.query)}
              className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-medium text-amber-900 border border-amber-300 transition-colors cursor-pointer"
              title={`Execute starred search: "${item.query}"`}
            >
              <span>{item.label}</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStar(item.query);
                }}
                className="hover:text-red-600 transition-colors ml-0.5 text-[10px]"
                title="Remove from Starred"
                role="button"
                tabIndex={0}
                aria-label={`Unstar ${item.label}`}
              >
                ×
              </span>
            </button>
          ))}

          {/* Quick star current search button */}
          {currentQuery && (
            <button
              type="button"
              onClick={() => toggleStar(currentQuery)}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border transition-colors cursor-pointer ${
                isCurrentQueryStarred
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-800 border-slate-300"
              }`}
            >
              <Star
                size={10}
                className={isCurrentQueryStarred ? "fill-amber-400 text-amber-500" : ""}
              />
              <span>{isCurrentQueryStarred ? "Starred" : "+ Star this query"}</span>
            </button>
          )}
        </div>

        {/* Clear History Button */}
        {history.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="flex items-center gap-1 text-[11px] text-miso-muted hover:text-red-600 transition-colors cursor-pointer"
            title="Clear all recent search history"
          >
            <Trash2 size={11} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Recent Searches Row */}
      {history.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-miso-muted uppercase tracking-wider">
            <Clock size={11} className="text-miso-sky" aria-hidden="true" />
            Recent:
          </span>
          {history.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onSelectQuery(q)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-miso-soft px-2.5 py-0.5 text-[11px] text-miso-navy border border-miso-border transition-colors group cursor-pointer shadow-2xs"
              title={`Repeat search: "${q}"`}
            >
              <span className="truncate max-w-[140px] sm:max-w-[200px]">{q}</span>
              <span
                onClick={(e) => removeHistoryItem(e, q)}
                className="text-miso-muted hover:text-red-500 transition-colors text-[10px]"
                title="Remove from history"
                role="button"
                tabIndex={0}
                aria-label={`Remove ${q} from history`}
              >
                <X size={10} />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

