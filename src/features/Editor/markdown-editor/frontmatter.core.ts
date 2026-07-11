import { parse } from "yaml";

export type FrontmatterData = Record<string, unknown>;

export interface ParsedFrontmatter {
  /** Parsed frontmatter object, or null when there is no valid block. */
  data: FrontmatterData | null;
  /** Markdown body after the closing fence (or the whole input when no block). */
  body: string;
}

/**
 * A frontmatter block is recognised only when the content *begins* with a `---`
 * fence on line 1, terminated by a line that is exactly `---` or `...`.
 *
 * Anything else — no block, an empty block, malformed YAML, or a non-object
 * result — falls back to `{ data: null, body: <original content> }` so the
 * caller renders exactly as it would without frontmatter. This never throws.
 *
 * A `---` used as a horizontal rule mid-document is never matched, since only
 * line 1 is considered an opening fence.
 */
export function parseFrontmatter(content: string): ParsedFrontmatter {
  const noBlock: ParsedFrontmatter = { data: null, body: content };

  // Opening fence must be the very first line: `---` optionally followed by CR.
  const openMatch = /^---[ \t]*\r?\n/.exec(content);
  if (!openMatch) return noBlock;

  const afterOpen = openMatch[0].length;

  // Closing fence: a line that is exactly `---` or `...` (optional trailing ws).
  const closeRe = /\r?\n(---|\.\.\.)[ \t]*(?:\r?\n|$)/g;
  closeRe.lastIndex = afterOpen - 1; // start search at the newline before body
  const closeMatch = closeRe.exec(content);
  if (!closeMatch) return noBlock;

  const yamlText = content.slice(afterOpen, closeMatch.index);
  const body = content.slice(closeMatch.index + closeMatch[0].length);

  let parsed: unknown;
  try {
    parsed = parse(yamlText);
  } catch (err) {
    if (import.meta.env?.DEV) {
      console.warn("[frontmatter] failed to parse YAML frontmatter:", err);
    }
    return noBlock;
  }

  // Only plain objects are usable as a properties panel; a scalar or array
  // (e.g. an empty block parses to null) is treated as "no frontmatter".
  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    return noBlock;
  }

  return { data: parsed as FrontmatterData, body };
}
