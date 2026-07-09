/**
 * Pure helper for the search sidebar (no app/electron runtime imports) so the
 * folder-grouping can be unit-tested in isolation. Groups a flat list of
 * per-file search results into one section per containing folder — the shape
 * the panel renders as collapsible, tree-styled groups.
 */

import type { SearchResult } from "electron/src/project";

export interface FolderGroup {
  /**
   * Project-relative, "/"-separated folder path shared by the group's files
   * ("" for root-level files).
   */
  dir: string;
  /** Human-facing header label — the dir path, or "/" for the root group. */
  label: string;
  /** The group's files, sorted by filename (case-insensitive). */
  files: SearchResult[];
  /** Sum of every file's match count in the group. */
  totalMatches: number;
}

/** Filename portion of a "/"-separated result id (everything after the last "/"). */
export function resultName(id: string): string {
  const slash = id.lastIndexOf("/");
  return slash >= 0 ? id.slice(slash + 1) : id;
}

/** Containing-folder portion of a "/"-separated result id ("" when root-level). */
export function resultDir(id: string): string {
  const slash = id.lastIndexOf("/");
  return slash >= 0 ? id.slice(0, slash) : "";
}

/**
 * Groups results by their immediate containing folder (flat — one section per
 * distinct folder, not a nested tree). Groups are ordered by folder path and
 * files within a group by name, both case-insensitively, so ordering is stable
 * regardless of the order ripgrep emitted files in.
 */
export function groupResultsByFolder(results: SearchResult[]): FolderGroup[] {
  const byDir = new Map<string, SearchResult[]>();
  for (const result of results) {
    const dir = resultDir(result.id);
    const bucket = byDir.get(dir);
    if (bucket) bucket.push(result);
    else byDir.set(dir, [result]);
  }

  const collator = new Intl.Collator(undefined, { sensitivity: "base" });
  const groups: FolderGroup[] = [];
  for (const [dir, files] of byDir) {
    files.sort((a, b) => collator.compare(resultName(a.id), resultName(b.id)));
    groups.push({
      dir,
      label: dir === "" ? "/" : dir,
      files,
      totalMatches: files.reduce((sum, f) => sum + f.matchCount, 0),
    });
  }
  groups.sort((a, b) => collator.compare(a.dir, b.dir));
  return groups;
}
