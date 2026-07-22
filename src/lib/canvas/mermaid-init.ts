import mermaid from "mermaid";
import elkLayouts from "@mermaid-js/layout-elk";

// Registers the ELK layout engine (flowchart/state/er diagrams can opt in via
// `layout: elk*` in a file's own frontmatter, see mermaid-frontmatter.core.ts)
// alongside Mermaid's built-in dagre layout. Runs once at module load — both
// canvas-editor.tsx and export-image.ts import this module, and ES module
// caching means the body below only executes on the first import.
mermaid.registerLayoutLoaders(elkLayouts);

// Single source of truth for Mermaid config across the live canvas pane, the
// export preview, and the export render. Keeping one init avoids the panes
// drifting on theme/labels.
//
// `htmlLabels: false` makes Mermaid emit labels as native SVG <text> instead of
// HTML inside <foreignObject>. This is what lets the export be a pure SVG that
// the headless rasteriser (resvg, in the main process) can render — resvg, like
// most non-browser SVG renderers, ignores <foreignObject>. Using it here too
// keeps the on-screen diagram pixel-identical to the exported image.
//
// `fontFamily` pins a single concrete font name instead of Mermaid's default
// multi-name fallback stack (`"trebuchet ms", verdana, arial`). Chromium (canvas
// + export preview) and resvg's Rust font matcher (PNG export, main process)
// resolve a fallback *list* independently and can land on different actual
// fonts; a single name removes that ambiguity. Must stay in sync with the
// `sansSerifFamily`/`defaultFontFamily` resvg options in
// `electron/src/project/project.ts` `rasterizeSvgToPng`.
export const DIAGRAM_FONT_FAMILY = "Arial";

export function initMermaid(isDark: boolean): void {
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? "dark" : "default",
    securityLevel: "loose",
    htmlLabels: false,
    fontFamily: DIAGRAM_FONT_FAMILY,
    flowchart: { htmlLabels: false },
  });
}
