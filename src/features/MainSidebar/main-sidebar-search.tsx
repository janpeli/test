import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { List, RowComponentProps } from "react-window";
import { useAppSelector } from "@/hooks/hooks";
import {
  selectProjectPath,
  selectProjectStructure,
  selectProjectPlugins,
} from "@/API/project-api/project-api.selectors";
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
import {
  groupResultsByFolder,
  resultName,
} from "@/API/search-api/search-grouping.core";
import { FileIcon } from "@/lib/file-icon";
import type { Plugin, ProjectStructure } from "electron/src/project";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  CaseSensitive,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderClosed,
  Regex,
  Search as SearchIcon,
  WholeWord,
  X,
} from "lucide-react";

/**
 * Icon-relevant fields resolved from the ProjectStructure node for a result.
 * Results reflect the live disk while the structure is a project-open snapshot,
 * so a node may be missing — the panel falls back to the filename extension.
 */
type IconMeta = { sufix: string; plugin_uuid: string | null };

/** Flattens the structure into an id → icon-meta map (one walk, not per file). */
function buildIconMetaMap(
  structure: ProjectStructure | null
): Map<string, IconMeta> {
  const map = new Map<string, IconMeta>();
  const walk = (node: ProjectStructure) => {
    if (node.isLeaf) {
      map.set(node.id, { sufix: node.sufix, plugin_uuid: node.plugin_uuid });
    }
    node.children?.forEach(walk);
  };
  if (structure) walk(structure);
  return map;
}

/** Extension of a filename ("" when none), used as the icon fallback sufix. */
function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1) : "";
}

// Memoized: up to MAX_RESULT_FILES rows are rendered and the panel re-renders on
// every query keystroke — unchanged rows must not be reconciled each time. Props
// are kept primitive (plus the stable `plugins` array ref) so memo holds.
const ResultRow = memo(function ResultRow({
  id,
  name,
  matchCount,
  sufix,
  plugin_uuid,
  plugins,
}: {
  id: string;
  name: string;
  matchCount: number;
  sufix: string;
  plugin_uuid: string | null;
  plugins: Plugin[];
}) {
  return (
    <button
      type="button"
      title={id}
      onClick={() => openSearchResult(id)}
      // h-6 = 24px, gap-1.5: matches a treeview node (tree-node.tsx). pl-8 nests
      // the file icon a step past the folder header's icon (chevron + icon).
      className="w-full flex items-center gap-1.5 h-6 min-w-0 pl-8 pr-2 rounded hover:bg-sidebar-accent text-left text-sm"
    >
      <span className="flex shrink-0 items-center">
        <FileIcon
          name={name}
          sufix={sufix}
          plugin_uuid={plugin_uuid}
          plugins={plugins}
        />
      </span>
      <span className="truncate flex-1">{name}</span>
      <span className="flex-none text-xs text-muted-foreground tabular-nums">
        {matchCount}
      </span>
    </button>
  );
});

// Collapsible folder header, styled like a non-leaf treeview node.
const FolderHeaderRow = memo(function FolderHeaderRow({
  dir,
  label,
  fileCount,
  collapsed,
  onToggle,
}: {
  dir: string;
  label: string;
  fileCount: number;
  collapsed: boolean;
  onToggle: (dir: string) => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={() => onToggle(dir)}
      className="w-full flex items-center gap-1.5 h-6 min-w-0 pr-2 rounded hover:bg-sidebar-accent text-left text-sm"
    >
      {collapsed ? (
        <ChevronRight className="w-4 h-4 shrink-0 text-faint" />
      ) : (
        <ChevronDown className="w-4 h-4 shrink-0 text-faint" />
      )}
      <span className="flex shrink-0 items-center">
        {collapsed ? (
          <FolderClosed className="w-4 h-4 text-icon-faint" />
        ) : (
          <Folder className="w-4 h-4 text-icon-faint" />
        )}
      </span>
      <span className="truncate flex-1 text-faint">{label}</span>
      <span className="flex-none text-xs text-faint tabular-nums">
        {fileCount}
      </span>
    </button>
  );
});

/** Virtualized row height in px — must match the h-6 (24px) rows above. */
const SEARCH_ROW_HEIGHT = 24;

/**
 * A flattened, virtualizable row: either a folder header or a file beneath it.
 * The grouped/collapsible result set is flattened into a single array of these
 * so react-window can virtualize it (mirrors the treeview's visibleNodes list).
 */
type SearchRow =
  | {
      kind: "folder";
      dir: string;
      label: string;
      fileCount: number;
      collapsed: boolean;
    }
  | {
      kind: "file";
      id: string;
      name: string;
      matchCount: number;
      sufix: string;
      plugin_uuid: string | null;
    };

type SearchRowProps = {
  rows: SearchRow[];
  plugins: Plugin[];
  onToggle: (dir: string) => void;
};

// react-window rowComponent: applies the List's absolute `style` and switches
// on the flattened item. The List memoizes rows, so mounted rows only repaint
// when rowProps (rows/plugins/onToggle) change identity — not on every keystroke.
function SearchResultRow({
  index,
  style,
  rows,
  plugins,
  onToggle,
}: RowComponentProps<SearchRowProps>) {
  const row = rows[index];
  return (
    <div style={style}>
      {row.kind === "folder" ? (
        <FolderHeaderRow
          dir={row.dir}
          label={row.label}
          fileCount={row.fileCount}
          collapsed={row.collapsed}
          onToggle={onToggle}
        />
      ) : (
        <ResultRow
          id={row.id}
          name={row.name}
          matchCount={row.matchCount}
          sufix={row.sufix}
          plugin_uuid={row.plugin_uuid}
          plugins={plugins}
        />
      )}
    </div>
  );
}

function MainSidebarSearch() {
  const projectFolder = useAppSelector(selectProjectPath);
  const query = useAppSelector(selectSearchQuery);
  const options = useAppSelector(selectSearchOptions);
  const results = useAppSelector(selectSearchResults);
  const loading = useAppSelector(selectSearchLoading);
  const error = useAppSelector(selectSearchError);
  const hasSearched = useAppSelector(selectSearchHasSearched);
  const structure = useAppSelector(selectProjectStructure);
  const plugins = useAppSelector(selectProjectPlugins);

  const [showFilters, setShowFilters] = useState(false);

  // Results grouped into one collapsible section per containing folder.
  const groups = useMemo(() => groupResultsByFolder(results), [results]);
  // Icon-relevant fields per file id, resolved from the structure in one walk.
  const iconMeta = useMemo(() => buildIconMetaMap(structure), [structure]);

  // Set of *collapsed* folder dirs — empty means all expanded, so folders in a
  // fresh result set default open. Reset on every new result set.
  const [collapsedDirs, setCollapsedDirs] = useState<Set<string>>(new Set());
  useEffect(() => setCollapsedDirs(new Set()), [results]);
  // Stable identity (functional update, no deps) so it doesn't churn rowProps
  // and force every virtualized row to repaint.
  const toggleDir = useCallback(
    (dir: string) =>
      setCollapsedDirs((prev) => {
        const next = new Set(prev);
        if (next.has(dir)) next.delete(dir);
        else next.add(dir);
        return next;
      }),
    []
  );

  // Flatten groups + collapse state into the single array react-window renders:
  // each expanded folder contributes its header then its files; a collapsed one
  // contributes only its header. Stable while typing (deps unchanged), so no row
  // repaints on keystrokes.
  const rows = useMemo<SearchRow[]>(() => {
    const out: SearchRow[] = [];
    for (const group of groups) {
      const collapsed = collapsedDirs.has(group.dir);
      out.push({
        kind: "folder",
        dir: group.dir,
        label: group.label,
        fileCount: group.files.length,
        collapsed,
      });
      if (collapsed) continue;
      for (const f of group.files) {
        const name = resultName(f.id);
        const meta = iconMeta.get(f.id);
        out.push({
          kind: "file",
          id: f.id,
          name,
          matchCount: f.matchCount,
          sufix: meta?.sufix ?? extensionOf(name),
          plugin_uuid: meta?.plugin_uuid ?? null,
        });
      }
    }
    return out;
  }, [groups, collapsedDirs, iconMeta]);

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
            <div className="flex flex-col flex-1 min-h-0 px-1 pb-1">
              <div className="px-1 pb-1 text-xs text-muted-foreground flex-none">
                {results.length} file{results.length === 1 ? "" : "s"} in{" "}
                {groups.length} folder{groups.length === 1 ? "" : "s"}
              </div>
              <List
                className="flex-1 min-h-0 w-full"
                rowComponent={SearchResultRow}
                rowCount={rows.length}
                rowHeight={SEARCH_ROW_HEIGHT}
                rowProps={{ rows, plugins, onToggle: toggleDir }}
                overscanCount={10}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default MainSidebarSearch;
