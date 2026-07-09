import { memo, useState } from "react";
import { useAppSelector } from "@/hooks/hooks";
import { selectProjectPath } from "@/API/project-api/project-api.selectors";
import {
  selectSearchQuery,
  selectSearchOptions,
  selectSearchResults,
  selectSearchLoading,
  selectSearchError,
  selectSearchHasSearched,
} from "@/API/search-api/search-api.selectors";
import {
  runSearch,
  setQuery,
  setOptions,
  openSearchResult,
} from "@/API/search-api/search-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CaseSensitive,
  ChevronDown,
  ChevronRight,
  Regex,
  Search as SearchIcon,
  WholeWord,
  X,
} from "lucide-react";

// Memoized: up to MAX_RESULT_FILES rows are rendered, and the panel re-renders
// on every query keystroke — unchanged rows must not be reconciled each time.
const ResultRow = memo(function ResultRow({
  id,
  matchCount,
}: {
  id: string;
  matchCount: number;
}) {
  const slash = id.lastIndexOf("/");
  const name = slash >= 0 ? id.slice(slash + 1) : id;
  const dir = slash >= 0 ? id.slice(0, slash) : "";
  return (
    <button
      type="button"
      title={id}
      onClick={() => openSearchResult(id)}
      className="w-full flex items-center justify-between gap-2 px-2 py-1 text-left text-sm rounded hover:bg-sidebar-accent"
    >
      <span className="flex items-baseline gap-1.5 min-w-0">
        <span className="truncate">{name}</span>
        {dir && (
          <span className="truncate text-xs text-muted-foreground">{dir}</span>
        )}
      </span>
      <span className="flex-none text-xs text-muted-foreground tabular-nums">
        {matchCount}
      </span>
    </button>
  );
});

function MainSidebarSearch() {
  const projectFolder = useAppSelector(selectProjectPath);
  const query = useAppSelector(selectSearchQuery);
  const options = useAppSelector(selectSearchOptions);
  const results = useAppSelector(selectSearchResults);
  const loading = useAppSelector(selectSearchLoading);
  const error = useAppSelector(selectSearchError);
  const hasSearched = useAppSelector(selectSearchHasSearched);

  const [showFilters, setShowFilters] = useState(false);

  // One submit handler for the query and both filter inputs so Enter behaves
  // identically in all three.
  const runSearchOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") runSearch();
  };

  // Empty the query and return the panel to its pristine "type to search"
  // state. runSearch() with an empty query dispatches clearSearchResults, which
  // clears results/status but keeps the case/regex/include filter options.
  const clearQuery = () => {
    setQuery("");
    runSearch();
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex flex-row items-center justify-between h-7 flex-none px-2.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">
          Search
        </span>
      </div>

      {!projectFolder ? (
        <div className="p-2 text-sm text-muted-foreground">
          Open a project to search.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5 px-2 pb-2 flex-none">
            <div className="flex items-center gap-1">
              <div className="relative flex-1">
                <Input
                  value={query}
                  placeholder="Search project…"
                  className="h-7 pr-8"
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={runSearchOnEnter}
                />
                {query.length > 0 && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    // Keep focus in the input when clearing.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={clearQuery}
                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-none"
                title="Search"
                onClick={() => runSearch()}
              >
                <SearchIcon className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-0.5">
              <Toggle
                size="sm"
                pressed={options.caseSensitive}
                aria-label="Match case"
                title="Match case"
                onPressedChange={(v) => setOptions({ caseSensitive: v })}
              >
                <CaseSensitive className="h-3.5 w-3.5" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={options.wholeWord}
                aria-label="Match whole word"
                title="Match whole word"
                onPressedChange={(v) => setOptions({ wholeWord: v })}
              >
                <WholeWord className="h-3.5 w-3.5" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={options.regex}
                aria-label="Use regular expression"
                title="Use regular expression (no lookaround/backreferences)"
                onPressedChange={(v) => setOptions({ regex: v })}
              >
                <Regex className="h-3.5 w-3.5" />
              </Toggle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 ml-auto px-1.5 text-xs text-muted-foreground"
                onClick={() => setShowFilters((s) => !s)}
              >
                {showFilters ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                files
              </Button>
            </div>

            {showFilters && (
              <div className="flex flex-col gap-1">
                <Input
                  value={options.include}
                  placeholder="files to include (e.g. *.yaml)"
                  className="h-7 text-xs"
                  onChange={(e) => setOptions({ include: e.target.value })}
                  onKeyDown={runSearchOnEnter}
                />
                <Input
                  value={options.exclude}
                  placeholder="files to exclude"
                  className="h-7 text-xs"
                  onChange={(e) => setOptions({ exclude: e.target.value })}
                  onKeyDown={runSearchOnEnter}
                />
              </div>
            )}
          </div>

          {error ? (
            <div className="px-2 py-1 text-sm text-destructive whitespace-pre-wrap break-words">
              {error}
            </div>
          ) : loading ? (
            <div className="px-2 py-1 text-sm text-muted-foreground">
              Searching…
            </div>
          ) : hasSearched && results.length === 0 ? (
            <div className="px-2 py-1 text-sm text-muted-foreground">
              No results found.
            </div>
          ) : results.length > 0 ? (
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-1 pb-4">
                <div className="px-1 pb-1 text-xs text-muted-foreground">
                  {results.length} file{results.length === 1 ? "" : "s"}
                </div>
                {results.map((r) => (
                  <ResultRow key={r.id} id={r.id} matchCount={r.matchCount} />
                ))}
              </div>
            </ScrollArea>
          ) : null}
        </>
      )}
    </div>
  );
}

export default MainSidebarSearch;
