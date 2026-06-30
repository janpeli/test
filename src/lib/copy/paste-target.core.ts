// Pure helper for resolving where a paste should land. No app/store/Electron
// imports so it can be transpiled with esbuild and exercised in isolation (see
// CLAUDE.md "Commands"). Shared by TreeController.paste (context-menu/keyboard
// path) and the menubar bridge so the two paste entry points can't drift.

/**
 * Given the folder a paste targets and the ids currently on the clipboard,
 * returns the folder the paste should actually land in.
 *
 * Pasting onto a node that is itself on the clipboard means "duplicate beside
 * it" — retarget to that node's parent folder (its id minus the last path
 * segment, `""` at the project root) so the copy lands as a sibling ("A" ->
 * "A copy") instead of being rejected as a paste into itself. Node ids are
 * project-relative slash-separated paths.
 *
 * @param targetFolderId - The folder the paste would target (a node id, or "").
 * @param clipboardIds - Ids captured by the last copy/cut.
 */
export function retargetPasteFolder(
  targetFolderId: string,
  clipboardIds: string[]
): string {
  if (!clipboardIds.includes(targetFolderId)) return targetFolderId;
  return targetFolderId.split("/").slice(0, -1).join("/");
}
