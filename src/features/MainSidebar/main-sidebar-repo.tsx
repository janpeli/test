import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/hooks/hooks";
import {
  selectProjectPath,
  selectProjectStructure,
  selectProjectPlugins,
} from "@/API/project-api/project-api.selectors";
import {
  selectGitInfo,
  selectGitLoading,
  selectGitError,
} from "@/API/git-api/git-api.selectors";
import { refreshGitInfo } from "@/API/git-api/git-api";
import { openFileById } from "@/API/editor-api/editor-api";
import { addErrorMessage } from "@/API/GUI-api/status-panel-api";
import {
  groupResultsByFolder,
  resultName,
} from "@/API/search-api/search-grouping.core";
import { FileIcon } from "@/lib/file-icon";
import { buildIconMetaMap, extensionOf } from "@/lib/icon-meta.core";
import type { IconMeta } from "@/lib/icon-meta.core";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderClosed,
  GitBranch,
  GitCommitHorizontal,
  RefreshCcw,
  Server,
} from "lucide-react";
import { GitInfo, Plugin } from "electron/src/project";

const STATUS_GROUPS: {
  key: keyof GitInfo;
  label: string;
  // Deleted files no longer exist on disk, so their rows are display-only.
  clickable: boolean;
}[] = [
  { key: "conflicted", label: "Conflicted", clickable: true },
  { key: "staged", label: "Staged", clickable: true },
  { key: "modified", label: "Modified", clickable: true },
  { key: "deleted", label: "Deleted", clickable: false },
  { key: "not_added", label: "Untracked", clickable: true },
];

/** Opens a changed file; changes reflect the live repo, so the file may be
 * missing from the loaded structure or gone by click time — surface that
 * instead of an unhandled rejection. */
const openChangedFile = (id: string) => {
  openFileById(id).catch((error) => {
    addErrorMessage(
      `Failed to open ${id}: ${(error as Error).message}`,
      "error"
    );
  });
};

// Search-panel-style row (see ResultRow in main-sidebar-search.tsx): file icon
// + filename, nested under its folder header. Deleted files render as an inert
// row with the name struck through.
function ChangedFileRow({
  id,
  clickable,
  iconMeta,
  plugins,
}: {
  id: string;
  clickable: boolean;
  iconMeta: Map<string, IconMeta>;
  plugins: Plugin[];
}) {
  const name = resultName(id);
  const meta = iconMeta.get(id);
  const content = (
    <>
      <span className="flex shrink-0 items-center">
        <FileIcon
          name={name}
          sufix={meta?.sufix ?? extensionOf(name)}
          plugin_uuid={meta?.plugin_uuid ?? null}
          plugins={plugins}
        />
      </span>
      <span className={"truncate flex-1" + (clickable ? "" : " line-through")}>
        {name}
      </span>
    </>
  );
  // pl-12 nests the file one step past the folder header (pl-4 + chevron/icon).
  const rowClass = "w-full flex items-center gap-1.5 h-6 min-w-0 pl-12 pr-2";
  if (!clickable) {
    return (
      <div title={id} className={rowClass + " text-sm text-muted-foreground"}>
        {content}
      </div>
    );
  }
  return (
    <button
      type="button"
      title={id}
      onClick={() => openChangedFile(id)}
      className={rowClass + " rounded hover:bg-sidebar-accent text-left text-sm"}
    >
      {content}
    </button>
  );
}

// Collapsible folder sub-group inside a status group, styled like the search
// panel's FolderHeaderRow, indented one step past the status header.
function FolderGroup({
  label,
  fileIds,
  clickable,
  collapsed,
  onToggle,
  iconMeta,
  plugins,
}: {
  label: string;
  fileIds: string[];
  clickable: boolean;
  collapsed: boolean;
  onToggle: () => void;
  iconMeta: Map<string, IconMeta>;
  plugins: Plugin[];
}) {
  return (
    <div>
      <button
        type="button"
        title={label}
        onClick={onToggle}
        className="w-full flex items-center gap-1.5 h-6 min-w-0 pl-4 pr-2 rounded hover:bg-sidebar-accent text-left text-sm"
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
          {fileIds.length}
        </span>
      </button>
      {!collapsed &&
        fileIds.map((id) => (
          <ChangedFileRow
            key={id}
            id={id}
            clickable={clickable}
            iconMeta={iconMeta}
            plugins={plugins}
          />
        ))}
    </div>
  );
}

// Collapsible status group header (styled like search's FolderHeaderRow),
// containing one collapsible folder sub-group per distinct containing folder
// (reuses the search panel's groupResultsByFolder — match counts unused).
function FileGroup({
  groupKey,
  label,
  files,
  clickable,
  collapsedGroups,
  onToggle,
  iconMeta,
  plugins,
}: {
  groupKey: string;
  label: string;
  files: string[];
  clickable: boolean;
  collapsedGroups: Set<string>;
  onToggle: (key: string) => void;
  iconMeta: Map<string, IconMeta>;
  plugins: Plugin[];
}) {
  if (files.length === 0) return null;
  const collapsed = collapsedGroups.has(groupKey);
  const folders = groupResultsByFolder(
    files.map((id) => ({ id, matchCount: 0 }))
  );
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => onToggle(groupKey)}
        className="w-full flex items-center gap-1.5 h-6 min-w-0 pr-2 rounded hover:bg-sidebar-accent text-left text-sm"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 shrink-0 text-faint" />
        ) : (
          <ChevronDown className="w-4 h-4 shrink-0 text-faint" />
        )}
        <span className="truncate flex-1 uppercase text-xs text-faint">
          {label}
        </span>
        <span className="flex-none text-xs text-faint tabular-nums">
          {files.length}
        </span>
      </button>
      {!collapsed &&
        folders.map((folder) => (
          <FolderGroup
            key={folder.dir}
            label={folder.label}
            fileIds={folder.files.map((f) => f.id)}
            clickable={clickable}
            collapsed={collapsedGroups.has(`${groupKey}:${folder.dir}`)}
            onToggle={() => onToggle(`${groupKey}:${folder.dir}`)}
            iconMeta={iconMeta}
            plugins={plugins}
          />
        ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 px-2 mb-1 uppercase text-xs text-muted-foreground">
      {children}
    </div>
  );
}

function RepoBody({ info }: { info: GitInfo }) {
  const structure = useAppSelector(selectProjectStructure);
  const plugins = useAppSelector(selectProjectPlugins);
  // Icon-relevant fields per file id, resolved from the structure in one walk.
  const iconMeta = useMemo(() => buildIconMetaMap(structure), [structure]);

  // Set of *collapsed* group keys — empty means all expanded, so groups default
  // open. Reset whenever git info refreshes (mirrors search's reset-on-results).
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );
  useEffect(() => setCollapsedGroups(new Set()), [info]);
  const toggleGroup = (key: string) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (!info.isRepo) {
    return (
      <div className="p-2 text-sm text-muted-foreground">
        This project folder is not a git repository.
      </div>
    );
  }

  const hasChanges = STATUS_GROUPS.some(
    (g) => (info[g.key] as string[]).length > 0
  );

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="px-2 pb-4">
        {/* Branch + ahead/behind */}
        <SectionTitle>
          <GitBranch className="h-3.5 w-3.5" /> Branch
        </SectionTitle>
        <div className="px-2 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{info.branch ?? "(detached)"}</span>
            {(info.ahead > 0 || info.behind > 0) && (
              <span className="flex items-center gap-1 text-muted-foreground">
                {info.ahead > 0 && (
                  <span className="flex items-center">
                    <ArrowUp className="h-3.5 w-3.5" />
                    {info.ahead}
                  </span>
                )}
                {info.behind > 0 && (
                  <span className="flex items-center">
                    <ArrowDown className="h-3.5 w-3.5" />
                    {info.behind}
                  </span>
                )}
              </span>
            )}
          </div>
          {info.tracking && (
            <div className="text-xs text-muted-foreground mt-0.5">
              tracking {info.tracking}
            </div>
          )}
        </div>

        <Separator className="my-2" />

        {/* Working tree status */}
        <SectionTitle>Changes</SectionTitle>
        <div className="px-2">
          {hasChanges ? (
            STATUS_GROUPS.map((g) => (
              <FileGroup
                key={g.key}
                groupKey={g.key}
                label={g.label}
                files={info[g.key] as string[]}
                clickable={g.clickable}
                collapsedGroups={collapsedGroups}
                onToggle={toggleGroup}
                iconMeta={iconMeta}
                plugins={plugins}
              />
            ))
          ) : (
            <div className="text-sm text-muted-foreground">
              Working tree clean
            </div>
          )}
        </div>

        <Separator className="my-2" />

        {/* Recent commits */}
        <SectionTitle>
          <GitCommitHorizontal className="h-3.5 w-3.5" /> Recent commits
        </SectionTitle>
        <div className="px-2">
          {info.commits.length === 0 ? (
            <div className="text-sm text-muted-foreground">No commits yet</div>
          ) : (
            <ul className="space-y-1.5">
              {info.commits.map((c) => (
                <li key={c.hash} className="text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {c.hash.slice(0, 7)}
                    </span>
                    <span className="truncate" title={c.message}>
                      {c.message}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.author_name} · {c.date}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Separator className="my-2" />

        {/* Remotes */}
        <SectionTitle>
          <Server className="h-3.5 w-3.5" /> Remotes
        </SectionTitle>
        <div className="px-2">
          {info.remotes.length === 0 ? (
            <div className="text-sm text-muted-foreground">No remotes</div>
          ) : (
            <ul className="space-y-1">
              {info.remotes.map((r) => (
                <li key={r.name} className="text-sm">
                  <span className="font-medium">{r.name}</span>
                  <div
                    className="text-xs font-mono text-muted-foreground truncate"
                    title={r.url}
                  >
                    {r.url}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}

function MainSidebarRepo() {
  const projectFolder = useAppSelector(selectProjectPath);
  const info = useAppSelector(selectGitInfo);
  const loading = useAppSelector(selectGitLoading);
  const error = useAppSelector(selectGitError);

  // Refresh on mount and whenever the open project changes.
  useEffect(() => {
    refreshGitInfo();
  }, [projectFolder]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex flex-row items-center justify-between h-7 flex-none px-2.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">
          Repo
        </span>
        <div className="flex flex-row items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            disabled={!projectFolder}
            className="h-5 w-5 text-faint hover:text-foreground"
            onClick={() => refreshGitInfo()}
          >
            <RefreshCcw className="h-[13px] w-[13px]" />
          </Button>
        </div>
      </div>
      {!projectFolder ? (
        <div className="p-2 text-sm text-muted-foreground">
          Open a project to see git information.
        </div>
      ) : loading && !info ? (
        <div className="p-2 text-sm text-muted-foreground">Loading…</div>
      ) : error && !info ? (
        <div className="p-2 text-sm text-destructive">{error}</div>
      ) : info ? (
        <RepoBody info={info} />
      ) : null}
    </div>
  );
}

export default MainSidebarRepo;
