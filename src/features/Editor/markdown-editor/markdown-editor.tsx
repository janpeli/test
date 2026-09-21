import React, { useCallback, useRef } from "react";
import { selectOpenFileContent } from "@/API/editor-api/editor-api.selectors";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import { parseFrontmatter } from "./frontmatter.core";
import { FrontmatterPanel } from "./frontmatter-panel";
import { taskListsPlugin } from "./task-list.core";
import "./markdown-preview.css";

// Lucide "copy" / "check" glyphs, inlined as raw markup: this HTML is built
// outside React (inside markdown-it's highlight callback), so it can't render
// actual lucide-react components — these mirror their paths/attrs exactly.
const COPY_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
const CHECK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

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

type MarkdownEditorProps = {
  editorIdx: number;
};

function MarkdownEditor({ editorIdx }: MarkdownEditorProps) {
  const content = useAppSelectorWithParams(selectOpenFileContent, { editorIdx });
  const { data, body } = parseFrontmatter(content ?? "");
  const html = md.render(body);

  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Code-block copy buttons are raw HTML (injected via the highlight callback
  // above, not React elements), so handling their clicks via delegation here
  // — and toggling the icon imperatively — is simpler than parsing the
  // rendered markdown into a React tree just to attach per-block handlers.
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>(
      ".md-copy-btn"
    );
    if (!button) return;
    const code = button.parentElement?.querySelector("pre")?.textContent ?? "";
    navigator.clipboard.writeText(code).then(() => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      button.innerHTML = CHECK_ICON;
      button.classList.add("copied");
      resetTimerRef.current = setTimeout(() => {
        button.innerHTML = COPY_ICON;
        button.classList.remove("copied");
      }, 1500);
    });
  }, []);

  return (
    <div className="flex-1 overflow-auto" onClick={handleClick}>
      <div className="mx-auto max-w-[80ch] px-8 py-6">
        {data && <FrontmatterPanel data={data} />}
        <div
          className="markdown-preview"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

export default MarkdownEditor;
