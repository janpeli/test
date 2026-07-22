// Pure Mermaid frontmatter helpers — no app/store/mermaid imports, so this is
// unit-testable in isolation (see CLAUDE.md "*.core.ts" convention). Used to
// persist per-file `config` (layout engine, theme) directly in the canvas
// file's own content as Mermaid's native YAML frontmatter block, rather than
// as separate app state — see `canvas-frontmatter.ts` for the store-bound
// wrapper and `export-image.ts` for the export-time theme merge.

import { parse, stringify } from "yaml";

/** A Mermaid frontmatter block must be the very first thing in the source. */
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Splits `source` into its parsed Mermaid frontmatter object (if any, e.g.
 * `{ title: "...", config: {...} }`) and the remaining diagram body.
 * Tolerant of malformed YAML (mid-typing in SOURCE mode) — falls back to an
 * empty frontmatter object rather than throwing, same posture as the
 * SOURCE→FORM sync's `applyContentToForm`.
 */
function parseFrontmatter(source: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = source.match(FRONTMATTER_RE);
  if (!match) return { frontmatter: {}, body: source };

  try {
    const parsed = parse(match[1]);
    return {
      frontmatter: isPlainObject(parsed) ? parsed : {},
      body: source.slice(match[0].length),
    };
  } catch {
    return { frontmatter: {}, body: source };
  }
}

/**
 * Reads `source`'s Mermaid frontmatter `config` object (if any) plus the
 * remaining diagram body. Drives selectors that only care about the current
 * layout/theme, not the rest of the frontmatter.
 */
export function parseMermaidSource(source: string): {
  config: Record<string, unknown>;
  body: string;
} {
  const { frontmatter, body } = parseFrontmatter(source);
  const config = frontmatter.config;
  return { config: isPlainObject(config) ? config : {}, body };
}

/**
 * Merges `patch` into `source`'s Mermaid frontmatter `config` (a key set to
 * `undefined` deletes it) and rebuilds the source, preserving any other
 * top-level frontmatter keys (e.g. `title`) untouched. When the merged
 * config ends up empty, `config` is dropped; if that empties the whole
 * frontmatter object, the block is stripped entirely — keeping all-defaults
 * files clean.
 */
export function applyMermaidConfig(
  source: string,
  patch: Record<string, string | undefined>
): string {
  const { frontmatter, body } = parseFrontmatter(source);
  const config: Record<string, unknown> = isPlainObject(frontmatter.config)
    ? { ...frontmatter.config }
    : {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete config[key];
    else config[key] = value;
  }

  const merged: Record<string, unknown> = { ...frontmatter };
  if (Object.keys(config).length === 0) delete merged.config;
  else merged.config = config;

  if (Object.keys(merged).length === 0) return body;

  const yaml = stringify(merged).trimEnd();
  return `---\n${yaml}\n---\n${body}`;
}
