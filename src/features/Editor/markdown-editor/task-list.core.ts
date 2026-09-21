import type MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";

const CHECKBOX_RE = /^\[([ xX])\]\s?/;

/**
 * Find the `inline` token carrying a `list_item_open`'s own leading text —
 * i.e. the first `inline` token inside the item, before its matching close.
 * A nested sub-list's paragraph only appears *after* the item's own paragraph
 * (an item can't open with a sub-list ahead of its own text), so this always
 * resolves to the item's own content, never a descendant's.
 */
function findOwnInlineToken(tokens: Token[], itemIdx: number): number {
  const itemLevel = tokens[itemIdx].level;
  for (let i = itemIdx + 1; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.level <= itemLevel) break;
    if (t.type === "inline") return i;
  }
  return -1;
}

/** Nearest enclosing `bullet_list_open`/`ordered_list_open` before `itemIdx`. */
function findEnclosingListOpen(tokens: Token[], itemIdx: number): number {
  const itemLevel = tokens[itemIdx].level;
  for (let i = itemIdx - 1; i >= 0; i--) {
    const t = tokens[i];
    if (
      t.level === itemLevel - 1 &&
      (t.type === "bullet_list_open" || t.type === "ordered_list_open")
    ) {
      return i;
    }
  }
  return -1;
}

function addClass(token: Token, cls: string): void {
  const existing = token.attrGet("class");
  if (existing?.split(" ").includes(cls)) return;
  token.attrSet("class", existing ? `${existing} ${cls}` : cls);
}

/**
 * GFM task-list support: rewrites `- [ ] foo` / `- [x] foo` list items into a
 * disabled checkbox + the remaining text, tagging the item and its enclosing
 * list with classes for CSS. markdown-it core has no task-list rule; this is
 * a minimal from-scratch implementation rather than pulling in a dependency.
 */
export function taskListsPlugin(md: MarkdownIt): void {
  md.core.ruler.push("task_lists", (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== "list_item_open") continue;

      const inlineIdx = findOwnInlineToken(tokens, i);
      if (inlineIdx === -1) continue;

      const inlineToken = tokens[inlineIdx];
      const first = inlineToken.children?.[0];
      if (!first || first.type !== "text") continue;

      const match = CHECKBOX_RE.exec(first.content);
      if (!match) continue;

      const checked = match[1].toLowerCase() === "x";
      first.content = first.content.slice(match[0].length);

      const checkbox = new state.Token("html_inline", "", 0);
      checkbox.content = `<input type="checkbox" class="task-checkbox" disabled${checked ? " checked" : ""} />`;
      inlineToken.children!.unshift(checkbox);

      addClass(tokens[i], "task-list-item");

      const listOpenIdx = findEnclosingListOpen(tokens, i);
      if (listOpenIdx !== -1) addClass(tokens[listOpenIdx], "contains-task-list");
    }
  });
}
