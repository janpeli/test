// Registers a "dbml" Monaco language: Monarch syntax highlighting, hover,
// completion, and diagnostics for .dbml files in the SOURCE pane. All the
// non-trivial logic (finding what's under the cursor, classifying completion
// context) lives in the pure, unit-tested dbml-source-info.core.ts — this
// file is the thin Monaco-API glue, verified by running the app (per
// CLAUDE.md: "there is no headless harness" for Monaco/GUI behaviour).
//
// Runs its registration once at module load — imported (for its side effect)
// once from monaco-editor.tsx, and ES module caching means the body only
// executes on the first import, same pattern as mermaid-init.ts's ELK
// layout registration.

import * as monaco from "monaco-editor";
import { parseDbml, type DbmlParseError } from "./dbml-parser.core";
import {
  DBML_COLUMN_SETTINGS,
  DBML_COLUMN_TYPES,
  DBML_KEYWORDS,
  buildLineTableMap,
  findSymbolAtPosition,
  formatHoverMarkdown,
  getCompletionContext,
  resolveTable,
} from "./dbml-source-info.core";

export const DBML_LANGUAGE_ID = "dbml";

const DIAGNOSTICS_DEBOUNCE_MS = 300;

const dbmlMonarchLanguage: monaco.languages.IMonarchLanguage = {
  defaultToken: "",
  tokenPostfix: ".dbml",
  keywords: ["Table", "Ref", "Enum", "TableGroup", "Project", "Note", "indexes", "as"],
  typeKeywords: [...DBML_COLUMN_TYPES],
  symbols: /[<>-]+/,
  tokenizer: {
    root: [
      [/\/\/.*$/, "comment"],
      [
        /[A-Za-z_][\w]*/,
        {
          cases: {
            "@keywords": "keyword",
            "@typeKeywords": "type",
            "@default": "identifier",
          },
        },
      ],
      { include: "@whitespace" },
      [/[{}()[\]]/, "@brackets"],
      [/@symbols/, "operator"],
      [/\d+/, "number"],
      [/"([^"\\]|\\.)*"/, "string"],
      [/'([^'\\]|\\.)*'/, "string"],
      [/`([^`\\]|\\.)*`/, "string"],
    ],
    whitespace: [[/[ \t\r\n]+/, "white"]],
  },
};

const dbmlLanguageConfiguration: monaco.languages.LanguageConfiguration = {
  comments: { lineComment: "//" },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
};

function errorToMarker(error: DbmlParseError): monaco.editor.IMarkerData {
  const line = error.line ?? 1;
  const column = error.column ?? 1;
  return {
    severity: monaco.MarkerSeverity.Error,
    message: error.message,
    startLineNumber: line,
    startColumn: column,
    endLineNumber: line,
    endColumn: column + 1,
  };
}

function attachDiagnostics(model: monaco.editor.ITextModel): void {
  if (model.getLanguageId() !== DBML_LANGUAGE_ID) return;

  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = () => {
    if (model.isDisposed()) return;
    const { error } = parseDbml(model.getValue());
    monaco.editor.setModelMarkers(model, DBML_LANGUAGE_ID, error ? [errorToMarker(error)] : []);
  };
  run();

  const changeSub = model.onDidChangeContent(() => {
    clearTimeout(timer);
    timer = setTimeout(run, DIAGNOSTICS_DEBOUNCE_MS);
  });
  model.onWillDispose(() => {
    clearTimeout(timer);
    changeSub.dispose();
  });
}

type SuggestionSpec = {
  label: string;
  kind: monaco.languages.CompletionItemKind;
  insertText?: string;
  detail?: string;
};

let registered = false;

export function registerDbmlLanguage(): void {
  if (registered) return;
  registered = true;

  monaco.languages.register({ id: DBML_LANGUAGE_ID, extensions: [".dbml"] });
  monaco.languages.setMonarchTokensProvider(DBML_LANGUAGE_ID, dbmlMonarchLanguage);
  monaco.languages.setLanguageConfiguration(DBML_LANGUAGE_ID, dbmlLanguageConfiguration);

  monaco.languages.registerHoverProvider(DBML_LANGUAGE_ID, {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;
      const source = model.getValue();
      const { schema } = parseDbml(source);
      if (!schema) return null;
      const lineTableMap = buildLineTableMap(source);
      const symbol = findSymbolAtPosition(schema, lineTableMap, position.lineNumber, word.word);
      if (!symbol) return null;
      return {
        range: new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        ),
        contents: [{ value: formatHoverMarkdown(symbol) }],
      };
    },
  });

  monaco.languages.registerCompletionItemProvider(DBML_LANGUAGE_ID, {
    triggerCharacters: [" ", ".", "[", ":", ">", "<", "-"],
    provideCompletionItems(model, position) {
      const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
      const source = model.getValue();
      const { schema } = parseDbml(source);
      const lineTableMap = buildLineTableMap(source);
      const insideTableBody = lineTableMap.has(position.lineNumber);
      const ctx = getCompletionContext(linePrefix, insideTableBody);

      const word = model.getWordUntilPosition(position);
      const range = new monaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn
      );
      const toList = (items: SuggestionSpec[]): monaco.languages.CompletionList => ({
        suggestions: items.map((item) => ({
          label: item.label,
          kind: item.kind,
          insertText: item.insertText ?? item.label,
          detail: item.detail,
          range,
        })),
      });

      switch (ctx.kind) {
        case "line-start":
          return toList(
            DBML_KEYWORDS.map((k) => ({ label: k, kind: monaco.languages.CompletionItemKind.Keyword }))
          );
        case "column-type":
          return toList(
            DBML_COLUMN_TYPES.map((t) => ({
              label: t,
              kind: monaco.languages.CompletionItemKind.TypeParameter,
            }))
          );
        case "column-settings":
          return toList(
            DBML_COLUMN_SETTINGS.map((s) => ({
              label: s,
              kind: monaco.languages.CompletionItemKind.Property,
            }))
          );
        case "ref-target": {
          if (!schema) return { suggestions: [] };
          const prefixLower = ctx.prefix.toLowerCase();
          return toList(
            schema.tables
              .filter(
                (t) =>
                  t.name.toLowerCase().includes(prefixLower) ||
                  t.tableName.toLowerCase().includes(prefixLower)
              )
              .map((t) => ({
                label: t.name,
                insertText: `${t.name}.`,
                kind: monaco.languages.CompletionItemKind.Class,
                detail: "table",
              }))
          );
        }
        case "table-dot": {
          if (!schema) return { suggestions: [] };
          const table = resolveTable(schema, ctx.tableRawName);
          if (!table) return { suggestions: [] };
          return toList(
            table.columns.map((c) => ({
              label: c.name,
              kind: monaco.languages.CompletionItemKind.Field,
              detail: c.type,
            }))
          );
        }
        default:
          return { suggestions: [] };
      }
    },
  });

  monaco.editor.getModels().forEach(attachDiagnostics);
  monaco.editor.onDidCreateModel(attachDiagnostics);
}
