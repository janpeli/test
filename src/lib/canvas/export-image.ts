// Renderer-side diagram export: Mermaid source -> SVG string. The pure SVG
// string/size helpers live in `export-image.core.ts` (re-exported below) so they
// are unit-testable; PNG rasterisation happens in the MAIN process via resvg
// (see `electron/src/project/project.ts` `exportImageFile`), which renders the
// pure SVG deterministically at any size without a browser/canvas.

import mermaid from "mermaid";
import { initMermaid } from "./mermaid-init";
import { applyMermaidConfig } from "./mermaid-frontmatter.core";

export * from "./export-image.core";

let renderSeq = 0;

/**
 * Renders Mermaid source to an SVG string using the given theme. Shares
 * `initMermaid` with the canvas pane so the preview and export match what is
 * shown on screen for the non-theme settings (htmlLabels, fontFamily,
 * securityLevel). The theme itself is scoped to this call by merging it into
 * the source's own frontmatter `config` rather than the global config:
 * `initMermaid`'s `theme` option is a mutable singleton shared with the live
 * canvas pane, and the export modal can now show a different theme than the
 * app/canvas — merging keeps this render's theme immune to a concurrent
 * `initMermaid()` call from `canvas-editor.tsx` racing it, while preserving
 * any `layout` (or other config) the file already persists in its
 * frontmatter — a plain string prepend would push an existing frontmatter
 * block off line 1 and break Mermaid's frontmatter detection.
 */
export async function renderDiagramSvg(
  source: string,
  isDark: boolean
): Promise<string> {
  initMermaid(isDark);
  const themedSource = applyMermaidConfig(source.trim(), {
    theme: isDark ? "dark" : "default",
  });
  const { svg } = await mermaid.render(
    `export-diagram-${++renderSeq}`,
    themedSource
  );
  return svg;
}
