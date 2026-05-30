// Pure SVG helpers for the canvas diagram export — no app/store/Electron/mermaid
// imports, so this can be transpiled and unit-tested in isolation (see CLAUDE.md
// "*.core.ts" convention). The mermaid-bound render wrapper lives in
// `export-image.ts`; PNG rasterisation lives in the MAIN process via resvg.

export type ExportFormat = "png" | "svg";
export type ExportBackground = "transparent" | "white";

export const WHITE = "#ffffff";

/**
 * Reads the intrinsic pixel size of a rendered Mermaid SVG. Prefers the
 * `viewBox` (Mermaid always emits one) and falls back to width/height
 * attributes, then to a sane default.
 */
export function getDiagramSize(svg: string): { width: number; height: number } {
  const viewBox = svg.match(/viewBox="([^"]+)"/);
  if (viewBox) {
    const parts = viewBox[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }
  const widthAttr = svg.match(/width="([\d.]+)"/);
  const heightAttr = svg.match(/height="([\d.]+)"/);
  return {
    width: widthAttr ? Number(widthAttr[1]) : 800,
    height: heightAttr ? Number(heightAttr[1]) : 600,
  };
}

/**
 * Pins explicit pixel width/height on the root `<svg>` element, replacing any
 * existing ones. Mermaid emits a percentage/`max-width` style that makes the
 * file render tiny in some viewers and leaves the intrinsic size ambiguous for
 * rasterisers; an explicit size makes both deterministic.
 */
export function pinSvgSize(svg: string, width: number, height: number): string {
  let out = svg.replace(/(<svg\b[^>]*?)\s+width="[^"]*"/, "$1");
  out = out.replace(/(<svg\b[^>]*?)\s+height="[^"]*"/, "$1");
  out = out.replace(/<svg\b/, `<svg width="${width}" height="${height}"`);
  return out;
}

/** Paints a solid background by inserting a full-bleed `<rect>` after `<svg>`. */
export function injectBackground(svg: string, color: string): string {
  return svg.replace(
    /(<svg\b[^>]*>)/,
    `$1<rect width="100%" height="100%" fill="${color}"/>`
  );
}

/**
 * Builds the SVG string written for an *.svg export: pins the intrinsic size and
 * optionally bakes in a solid background. The PNG path doesn't use this — resvg
 * sizes (via `fitTo` zoom) and backs the diagram itself when rasterising.
 */
export function prepareSvgString(
  svg: string,
  background: ExportBackground
): string {
  const { width, height } = getDiagramSize(svg);
  let out = pinSvgSize(svg, width, height);
  if (background === "white") out = injectBackground(out, WHITE);
  return out;
}

/** Strips the canvas extension(s) so the default export name is clean. */
export function stripCanvasExtension(fileName: string): string {
  return fileName.replace(/\.can\.md$/i, "").replace(/\.(md|markdown)$/i, "");
}
