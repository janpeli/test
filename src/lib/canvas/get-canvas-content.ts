import { store } from "@/app/store";

/**
 * Reads a file's current content out of the editor state (the source of truth
 * for canvas files, which are edited as raw text rather than through a form).
 * Shared by `canvas-insert.ts` (append-on-drop) and `canvas-frontmatter.ts`
 * (layout/theme picker).
 */
export function getFileContentFromState(fileId: string): string | undefined {
  for (const editor of store.getState().editorAPI.editors) {
    const file = editor.editedFiles.find((f) => f.id === fileId);
    if (file) return file.content;
  }
  return undefined;
}
