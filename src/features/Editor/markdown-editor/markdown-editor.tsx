import { selectOpenFileContent } from "@/API/editor-api/editor-api.selectors";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import "./markdown-preview.css";

const md: MarkdownIt = new MarkdownIt({
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
      } catch {
        // fall through to plain
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  },
  html: false,
  linkify: true,
  typographer: true,
});

type MarkdownEditorProps = {
  editorIdx: number;
};

function MarkdownEditor({ editorIdx }: MarkdownEditorProps) {
  const content = useAppSelectorWithParams(selectOpenFileContent, { editorIdx });
  const html = md.render(content ?? "");

  return (
    <div className="flex-1 overflow-auto px-8 py-5">
      <div
        className="markdown-preview"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

export default MarkdownEditor;
