import { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import type { GitCommit } from "electron/src/project";
import { useAppSelector, useAppSelectorWithParams } from "@/hooks/hooks";
import { selectOpenFile } from "@/API/editor-api/editor-api.selectors";

type GitHistoryEditorProps = {
  editorIdx: number;
};

/** Short, human-readable "time ago" for a commit date string. */
function relativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const sec = Math.round((Date.now() - then) / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mon = Math.round(day / 30);
  if (mon < 12) return `${mon}mo ago`;
  return `${Math.round(mon / 12)}y ago`;
}

/**
 * Read-only pane showing the git commit history of the open file. The top region
 * lists the commits that touched the file (newest first); selecting one shows the
 * unified diff that commit introduced to the file in the read-only Monaco view
 * below. History and diffs are read in the main process over IPC
 * (`getFileGitHistory` / `getFileGitDiff`) — this pane never mutates the repo.
 */
function GitHistoryEditor({ editorIdx }: GitHistoryEditorProps) {
  const openFile = useAppSelectorWithParams(selectOpenFile, { editorIdx });
  const folderPath = useAppSelector((s) => s.projectAPI.folderPath);

  // The file id is its project-relative path — the value the git readers expect.
  const fileId = openFile?.id;
  const isNew = openFile?.isNew ?? false;

  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [diff, setDiff] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Fetch the file's history whenever the open file (or project) changes.
  // Race-guarded so a slow fetch for a previous file can't overwrite the current.
  useEffect(() => {
    if (!folderPath || !fileId || isNew) {
      setCommits([]);
      setSelectedHash(null);
      setDiff("");
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const history = await window.project.getFileGitHistory(
          folderPath,
          fileId
        );
        if (cancelled) return;
        setCommits(history);
        setSelectedHash(history[0]?.hash ?? null);
      } catch (e) {
        if (cancelled) return;
        setCommits([]);
        setSelectedHash(null);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [folderPath, fileId, isNew]);

  // Fetch the diff for the selected commit. Race-guarded for the same reason.
  useEffect(() => {
    if (!folderPath || !fileId || !selectedHash) {
      setDiff("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const text = await window.project.getFileGitDiff(
          folderPath,
          fileId,
          selectedHash
        );
        if (!cancelled) setDiff(text);
      } catch (e) {
        if (!cancelled) {
          setDiff(
            `// Failed to load diff:\n// ${
              e instanceof Error ? e.message : String(e)
            }`
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [folderPath, fileId, selectedHash]);

  // Create the read-only diff editor once.
  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;
    editorRef.current = monaco.editor.create(containerRef.current, {
      value: "",
      language: "diff",
      theme: document.documentElement.classList.contains("dark")
        ? "vs-dark"
        : "vs",
      automaticLayout: true,
      readOnly: true,
      domReadOnly: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: "on",
    });
    return () => {
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, []);

  // Keep the editor value in sync with the rendered diff.
  useEffect(() => {
    const model = editorRef.current?.getModel();
    if (!model) return;
    if (model.getValue() !== diff) model.setValue(diff);
  }, [diff]);

  useEffect(() => {
    monaco.editor.setTheme(isDark ? "vs-dark" : "vs");
  }, [isDark]);

  const hasHistory = commits.length > 0;
  const emptyMessage = loading
    ? "Loading history…"
    : error
      ? `Could not read git history: ${error}`
      : "No git history for this file.";

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div
        className="flex flex-col overflow-auto border-b shrink-0"
        style={{ maxHeight: "40%" }}
      >
        {hasHistory ? (
          commits.map((commit) => {
            const selected = commit.hash === selectedHash;
            return (
              <button
                key={commit.hash}
                type="button"
                onClick={() => setSelectedHash(commit.hash)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs text-left border-b last:border-b-0 hover:bg-accent/50 ${
                  selected ? "bg-accent" : ""
                }`}
              >
                <span className="font-mono text-muted-foreground shrink-0">
                  {commit.hash.slice(0, 7)}
                </span>
                <span className="truncate flex-1">{commit.message}</span>
                <span className="text-muted-foreground shrink-0 truncate max-w-[8rem]">
                  {commit.author_name}
                </span>
                <span className="text-muted-foreground shrink-0">
                  {relativeDate(commit.date)}
                </span>
              </button>
            );
          })
        ) : (
          <div className="px-3 py-4 text-xs text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden" />
    </div>
  );
}

export default GitHistoryEditor;
