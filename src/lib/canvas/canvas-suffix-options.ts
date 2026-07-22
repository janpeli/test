// Single source of truth for the file-suffix choices offered when creating a
// new canvas file. `.mmd`/`.mermaid` are plain single-extension files; `.can.md`
// is kept for backward compatibility with the original double-extension
// convention (see is-canvas-file.core.ts for why that needs special-casing).

export type CanvasSuffixKind = "mmd" | "mermaid" | "can.md";

export interface CanvasSuffixOption {
  kind: CanvasSuffixKind;
  label: string;
  extension: string;
  fileName: (stem: string) => string;
  displayName: (stem: string) => string;
}

export const CANVAS_SUFFIX_OPTIONS: CanvasSuffixOption[] = [
  {
    kind: "mmd",
    label: ".mmd",
    extension: "mmd",
    fileName: (s) => `${s}.mmd`,
    displayName: (s) => s,
  },
  {
    kind: "mermaid",
    label: ".mermaid",
    extension: "mermaid",
    fileName: (s) => `${s}.mermaid`,
    displayName: (s) => s,
  },
  {
    kind: "can.md",
    label: ".can.md",
    extension: "md",
    fileName: (s) => `${s}.can.md`,
    displayName: (s) => `${s}.can`,
  },
];

export const DEFAULT_CANVAS_SUFFIX_KIND: CanvasSuffixKind = "mmd";

export function getCanvasSuffixOption(kind: CanvasSuffixKind): CanvasSuffixOption {
  const option = CANVAS_SUFFIX_OPTIONS.find((o) => o.kind === kind);
  if (!option) {
    throw new Error(`Unknown canvas suffix kind: ${kind}`);
  }
  return option;
}
