import { spawn } from "node:child_process";
// NOTE: @vscode/ripgrep is pinned to 1.17.1 (the last CommonJS release). 1.18.0+
// is ESM-only ("type":"module"), and require()-ing it from this CommonJS main
// bundle throws ERR_REQUIRE_ESM at startup. Keep the exact pin in package.json.
import { rgPath } from "@vscode/ripgrep";
import {
  buildRgArgs,
  parseCountMatchesLine,
  SearchOptions,
  SearchResult,
} from "./search.core";

export type { SearchOptions, SearchResult } from "./search.core";

export interface SearchProjectProps {
  folderPath: string;
  query: string;
  options: SearchOptions;
}

/** Cap on result files returned to the renderer to stay responsive. */
const MAX_RESULT_FILES = 2000;

/**
 * Resolves the ripgrep binary path. In a packaged app the binary is unpacked
 * out of the asar archive (see `asarUnpack` in electron-builder.json5), so the
 * path reported by `@vscode/ripgrep` (which points inside `app.asar`) must be
 * redirected to `app.asar.unpacked`.
 */
function resolveRgPath(): string {
  return rgPath.includes("app.asar")
    ? rgPath.replace("app.asar", "app.asar.unpacked")
    : rgPath;
}

/**
 * Runs a full-text search across `folderPath` using ripgrep and returns the
 * matching files with per-file occurrence counts, sorted by relative path.
 *
 * A dumb reader: it never mutates the project. An empty/whitespace query
 * resolves to `[]` without spawning. Output is parsed line-by-line as it
 * streams; once MAX_RESULT_FILES files are seen the child is killed instead of
 * buffering the rest. ripgrep exit codes are mapped as:
 *   0 → matches found
 *   1 → no matches (resolve `[]`; this is NOT an error)
 *   2 → rg exits 2 whenever ANY file was unreadable, even if matches were
 *       found and printed (--no-messages silences the message, not the exit
 *       status) — so parsed results still resolve, and an empty stderr with no
 *       results resolves `[]`; only a real diagnostic (e.g. an invalid regex
 *       pattern) rejects
 */
export function searchProject(props: SearchProjectProps): Promise<SearchResult[]> {
  const { folderPath, query, options } = props;
  if (!folderPath || !query.trim()) return Promise.resolve([]);

  return new Promise<SearchResult[]>((resolve, reject) => {
    const child = spawn(resolveRgPath(), buildRgArgs(query, options), {
      cwd: folderPath,
    });

    // setEncoding (rather than chunk.toString()) so a multi-byte UTF-8
    // sequence split across a chunk boundary is buffered, not decoded into
    // replacement characters that would corrupt a non-ASCII path.
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    const results: SearchResult[] = [];
    let leftover = "";
    let stderr = "";
    let settled = false;

    const finish = () => {
      settled = true;
      resolve(results.sort((a, b) => a.id.localeCompare(b.id)));
    };

    child.stdout.on("data", (chunk: string) => {
      if (settled) return;
      const lines = (leftover + chunk).split("\n");
      leftover = lines.pop() ?? "";
      for (const line of lines) {
        const result = parseCountMatchesLine(line);
        if (!result) continue;
        results.push(result);
        if (results.length >= MAX_RESULT_FILES) {
          finish();
          child.kill();
          return;
        }
      }
    });
    child.stderr.on("data", (chunk: string) => (stderr += chunk));

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });

    child.on("close", (code) => {
      if (settled) return;
      const last = parseCountMatchesLine(leftover);
      if (last) results.push(last);
      if (code === 0 || code === 1 || results.length > 0) return finish();
      // code 2 with silent stderr = only suppressed per-file I/O errors
      // occurred and nothing matched — that is "no results", not a failure.
      if (code === 2 && !stderr.trim()) return finish();
      settled = true;
      reject(new Error(stderr.trim() || `ripgrep exited with code ${code}`));
    });
  });
}
