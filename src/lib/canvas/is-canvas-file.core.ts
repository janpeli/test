import { CANVAS_SUFFIX_OPTIONS } from "./canvas-suffix-options";

const SINGLE_EXTENSION_SUFFIXES = CANVAS_SUFFIX_OPTIONS.filter(
  (o) => o.kind !== "can.md"
).map((o) => o.extension.toLowerCase());

// Detects any canvas file: single-extension (.mmd/.mermaid, via sufix) or the
// legacy double-extension .can.md (via name, since its sufix is just "md").
// Matches both the truncated display name ("diagram.can") and the raw
// untruncated basename ("diagram.can.md") so every call site works
// regardless of which form of `name` it happens to pass in.
export function isCanvasFile(name: string, sufix: string): boolean {
  if (SINGLE_EXTENSION_SUFFIXES.includes(sufix.toLowerCase())) return true;
  const lower = name.toLowerCase();
  return lower.endsWith(".can") || lower.endsWith(".can.md");
}
