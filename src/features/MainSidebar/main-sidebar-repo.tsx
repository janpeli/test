import { useEffect } from "react";
import { useAppSelector } from "@/hooks/hooks";
import { selectProjectPath } from "@/API/project-api/project-api.selectors";
import {
  selectGitInfo,
  selectGitLoading,
} from "@/API/git-api/git-api.selectors";
import { refreshGitInfo } from "@/API/git-api/git-api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDown,
  ArrowUp,
  GitBranch,
  GitCommitHorizontal,
  RefreshCcw,
  Server,
} from "lucide-react";
import { GitInfo } from "electron/src/project";

const STATUS_GROUPS: { key: keyof GitInfo; label: string }[] = [
  { key: "conflicted", label: "Conflicted" },
  { key: "staged", label: "Staged" },
  { key: "modified", label: "Modified" },
  { key: "deleted", label: "Deleted" },
  { key: "not_added", label: "Untracked" },
];

function FileGroup({ label, files }: { label: string; files: string[] }) {
  if (files.length === 0) return null;
  return (
    <div className="mb-2">
      <div className="text-xs uppercase text-muted-foreground mb-1">
        {label} ({files.length})
      </div>
      <ul className="space-y-0.5">
        {files.map((file) => (
          <li key={file} className="text-sm font-mono truncate" title={file}>
            {file}
          </li>
        ))}
      </ul>
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
    <div className="flex-1 overflow-auto px-2 pb-4">
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
              label={g.label}
              files={info[g.key] as string[]}
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
  );
}

function MainSidebarRepo() {
  const projectFolder = useAppSelector(selectProjectPath);
  const info = useAppSelector(selectGitInfo);
  const loading = useAppSelector(selectGitLoading);

  // Refresh on mount and whenever the open project changes.
  useEffect(() => {
    refreshGitInfo();
  }, [projectFolder]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex flex-row justify-between px-2 pt-1 flex-none h-7">
        <span className="uppercase flex-none">Repo</span>
        <div className="flex flex-row">
          <Button
            variant="outline"
            disabled={projectFolder ? false : true}
            className="h-7 w-7 p-1"
            onClick={() => refreshGitInfo()}
          >
            <RefreshCcw className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <Separator className="my-2" />
      {!projectFolder ? (
        <div className="p-2 text-sm text-muted-foreground">
          Open a project to see git information.
        </div>
      ) : loading && !info ? (
        <div className="p-2 text-sm text-muted-foreground">Loading…</div>
      ) : info ? (
        <RepoBody info={info} />
      ) : null}
    </div>
  );
}

export default MainSidebarRepo;
