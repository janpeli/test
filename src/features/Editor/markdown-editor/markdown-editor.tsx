import React, { useCallback, useMemo, useRef } from "react";
import { selectOpenFileContent } from "@/API/editor-api/editor-api.selectors";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import { parseFrontmatter } from "./frontmatter.core";
import { FrontmatterPanel } from "./frontmatter-panel";
import { taskListsPlugin } from "./task-list.core";
import { headingAnchorsPlugin, type HeadingEntry } from "./heading-anchors.core";
import { MarkdownToc } from "./markdown-toc";
import "./markdown-preview.css";

// Lucide "copy" / "check" glyphs, inlined as raw markup: this HTML is built
// outside React (inside markdown-it's highlight callback, or as a string
// template for heading anchors), so it can't render actual lucide-react
// components — these mirror their paths/attrs exactly.
const COPY_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
const CHECK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

// Per-element pending "revert to original" timers, keyed by the element being
// fed back on (a code-block copy button or a heading anchor). A WeakMap keeps
// two rapid clicks on different elements from clobbering each other's timer,
// which a single shared ref would.
const copyResetTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

function copyWithFeedback(el: HTMLElement, text: string): void {
  navigator.clipboard.writeText(text).then(() => {
    const pending = copyResetTimers.get(el);
    if (pending) clearTimeout(pending);
    const original = el.innerHTML;
    el.innerHTML = CHECK_ICON;
    el.classList.add("copied");
    copyResetTimers.set(
      el,
      setTimeout(() => {
        el.innerHTML = original;
        el.classList.remove("copied");
        copyResetTimers.delete(el);
      }, 1500)
    );
  });
}

function highlightCode(str: string, lang: string): string {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
    } catch {
      // fall through to plain
    }
  }
  return md.utils.escapeHtml(str);
}

const md: MarkdownIt = new MarkdownIt({
  highlight: (str, lang) => {
    const code = highlightCode(str, lang);
    return `<div class="md-code-block"><button type="button" class="md-copy-btn" aria-label="Copy code" title="Copy code">${COPY_ICON}</button><pre class="hljs"><code>${code}</code></pre></div>`;
  },
  html: false,
  linkify: true,
  typographer: true,
});
md.use(taskListsPlugin);
md.use(headingAnchorsPlugin);

type MarkdownEditorProps = {
  editorIdx: number;
};

function MarkdownEditor({ editorIdx }: MarkdownEditorProps) {
  const content = useAppSelectorWithParams(selectOpenFileContent, { editorIdx });
  const { data, body } = parseFrontmatter(content ?? "");

  const scrollRef = useRef<HTMLDivElement>(null);

  // `env` is populated by headingAnchorsPlugin as a side effect of render();
  // recomputed together with `html` whenever the body text changes.
  const { html, headings } = useMemo(() => {
    const env: { headings?: HeadingEntry[] } = {};
    const renderedHtml = md.render(body, env);
    return { html: renderedHtml, headings: env.headings ?? [] };
  }, [body]);

  // Code-block copy buttons and heading anchor links are raw HTML (injected
  // via the highlight callback / headingAnchorsPlugin above, not React
  // elements), so handling their clicks via delegation here is simpler than
  // parsing the rendered markdown into a React tree just to attach handlers.
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    const copyBtn = target.closest<HTMLButtonElement>(".md-copy-btn");
    if (copyBtn) {
      const code = copyBtn.parentElement?.querySelector("pre")?.textContent ?? "";
      copyWithFeedback(copyBtn, code);
      return;
    }

    const anchor = target.closest<HTMLAnchorElement>(".md-heading-anchor");
    if (anchor) {
      // Prevent the browser's native hash-jump: this is a single-page app,
      // and mutating window.location.hash isn't something we want touching.
      e.preventDefault();
      copyWithFeedback(anchor, `#${anchor.dataset.slug ?? ""}`);
    }
  }, []);

  const scrollToHeading = useCallback((slug: string) => {
    scrollRef.current
      ?.querySelector(`#${CSS.escape(slug)}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden flex flex-col">
      <MarkdownToc headings={headings} onSelect={scrollToHeading} />
      <div ref={scrollRef} className="flex-1 overflow-auto" onClick={handleClick}>
        <div className="mx-auto max-w-[80ch] px-8 py-6">
          {data && <FrontmatterPanel data={data} />}
          <div
            className="markdown-preview"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}

export default MarkdownEditor;
