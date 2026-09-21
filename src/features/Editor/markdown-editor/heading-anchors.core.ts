import type MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";

export interface HeadingEntry {
  level: number;
  text: string;
  slug: string;
}

/** Plain text of a heading's inline children — unlike markdown-it's own
 * `renderInlineAsText`, this also keeps `code_inline` content, since dropping
 * it would produce misleading slugs/TOC labels for a heading like `## \`foo\` bar`. */
function extractText(children: Token[] | null): string {
  if (!children) return "";
  let result = "";
  for (const t of children) {
    switch (t.type) {
      case "text":
      case "code_inline":
        result += t.content;
        break;
      case "image":
        result += extractText(t.children);
        break;
      case "softbreak":
      case "hardbreak":
        result += " ";
        break;
      default:
      // skip markup tokens (strong_open/close, em_open/close, link_open/close, …)
    }
  }
  return result;
}

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}_\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "section";
}

/** GitHub-style de-duplication: the first occurrence keeps the bare slug,
 * later ones get `-1`, `-2`, … suffixes. */
function uniqueSlug(base: string, seen: Map<string, number>): string {
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

/**
 * Gives every heading a stable `id` (for the copy-link anchor and TOC
 * navigation) and appends a hidden-until-hover `#` anchor link. Also collects
 * a flat heading outline into `env.headings` for `MarkdownToc`, so slug
 * generation stays single-sourced between the injected ids and the TOC's
 * scroll targets.
 */
export function headingAnchorsPlugin(md: MarkdownIt): void {
  md.core.ruler.push("heading_anchors", (state) => {
    const tokens = state.tokens;
    const seen = new Map<string, number>();
    const headings: HeadingEntry[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type !== "heading_open") continue;

      const inline = tokens[i + 1];
      if (!inline || inline.type !== "inline") continue;

      const text = extractText(inline.children);
      const slug = uniqueSlug(slugify(text), seen);
      const level = Number(token.tag.slice(1)) || 1;

      token.attrSet("id", slug);
      headings.push({ level, text, slug });

      const anchor = new state.Token("html_inline", "", 0);
      anchor.content = `<a href="#${slug}" class="md-heading-anchor" data-slug="${slug}" aria-label="Copy link to this section" title="Copy link">#</a>`;
      inline.children?.push(anchor);
    }

    (state.env ??= {}).headings = headings;
  });
}
