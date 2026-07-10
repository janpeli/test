// Pure helpers for the editor tab context menu. No app/store/Electron imports
// so they can be unit-tested in isolation (see CLAUDE.md testing policy).

export type CloseScope = "all" | "left" | "right";

/**
 * Given the ordered tab ids of one editor pane, returns the ids to close for
 * the given scope relative to the anchor tab. An anchor not present in the
 * list returns [] (defensive); "all" ignores the anchor.
 */
export function getCloseTargets(
  tabIds: string[],
  anchorId: string,
  scope: CloseScope
): string[] {
  if (scope === "all") return [...tabIds];
  const idx = tabIds.indexOf(anchorId);
  if (idx === -1) return [];
  return scope === "left" ? tabIds.slice(0, idx) : tabIds.slice(idx + 1);
}

/**
 * Joins the project folder path (a native absolute path — backslashes on
 * Windows, as returned by the OS folder dialog) with a file id (the
 * "/"-separated project-relative path used throughout the app) into a native
 * absolute path, using the folder's own separator.
 */
export function toAbsolutePath(folderPath: string, id: string): string {
  const sep = folderPath.includes("\\") ? "\\" : "/";
  const trimmed = folderPath.replace(/[\\/]+$/, "");
  return trimmed + sep + id.split("/").join(sep);
}
