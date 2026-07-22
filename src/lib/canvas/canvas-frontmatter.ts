import { store } from "@/app/store";
import { setFileContent } from "@/API/editor-api/editor-api.slice";
import { getFileContentFromState } from "./get-canvas-content";
import { applyMermaidConfig } from "./mermaid-frontmatter.core";

/**
 * Persists a layout/theme (or other Mermaid `config`) choice directly into a
 * canvas file's own content as frontmatter, then dispatches the updated
 * content. No `fromSource` flag — this is a programmatic write, not a
 * genuine Monaco edit (same convention `canvas-insert.ts` uses), and it's
 * what drives the re-render: `canvas-editor.tsx`'s render effect watches
 * `content`, so the diagram re-renders only after the frontmatter update
 * lands in the store.
 */
export function setCanvasConfig(
  fileId: string,
  patch: Record<string, string | undefined>
): void {
  const content = getFileContentFromState(fileId) ?? "";
  const updated = applyMermaidConfig(content, patch);
  if (updated === content) return;
  store.dispatch(setFileContent({ fileId, content: updated }));
}
