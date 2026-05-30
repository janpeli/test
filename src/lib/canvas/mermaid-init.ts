import mermaid from "mermaid";

// Single source of truth for Mermaid config across the live canvas pane, the
// export preview, and the export render. Keeping one init avoids the panes
// drifting on theme/labels.
//
// `htmlLabels: false` makes Mermaid emit labels as native SVG <text> instead of
// HTML inside <foreignObject>. This is what lets the export be a pure SVG that
// the headless rasteriser (resvg, in the main process) can render — resvg, like
// most non-browser SVG renderers, ignores <foreignObject>. Using it here too
// keeps the on-screen diagram pixel-identical to the exported image.
export function initMermaid(isDark: boolean): void {
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? "dark" : "default",
    securityLevel: "loose",
    htmlLabels: false,
    flowchart: { htmlLabels: false },
  });
}
