// Renderer-side diagram export: Mermaid source -> SVG string. The pure SVG
// string/size helpers live in `export-image.core.ts` (re-exported below) so they
// are unit-testable; PNG rasterisation happens in the MAIN process via resvg
// (see `electron/src/project/project.ts` `exportImageFile`), which renders the
// pure SVG deterministically at any size without a browser/canvas.

import mermaid from "mermaid";
import { initMermaid } from "./mermaid-init";

export * from "./export-image.core";

let renderSeq = 0;

/**
 * Renders Mermaid source to an SVG string using the given theme. Shares
 * `initMermaid` with the canvas pane so the preview and export match what is
 * shown on screen.
 */
export async function renderDiagramSvg(
  source: string,
  isDark: boolean
): Promise<string> {
  initMermaid(isDark);
  const { svg } = await mermaid.render(
    `export-diagram-${++renderSeq}`,
    source.trim()
  );
  return svg;
}
