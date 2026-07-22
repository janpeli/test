import type { RootState } from "../../app/store";
import { ParameterizedSelector } from "@/hooks/hooks";
import { EditedFile, EditorModeType, ScrollPosition } from "./editor-api.slice";
import { Plugin, ProductDefinition } from "electron/src/project";
import yaml from "yaml";
import { parseMermaidSource } from "@/lib/canvas/mermaid-frontmatter.core";

// Other code such as selectors can use the imported `RootState` type

/** Finds an open file by id across every editor pane (not scoped to one pane). */
export const selectAnyEditedFileById = (
  state: RootState,
  id: string
): EditedFile | undefined =>
  state.editorAPI.editors
    .flatMap((ed) => ed.editedFiles)
    .find((file) => file.id === id);

export const selectEditedFiles: ParameterizedSelector<
  EditedFile[] | undefined,
  { editorIdx: number }
> = (state: RootState, params: { editorIdx: number }) => {
  return state.editorAPI.editors.find((ed) => ed.editorIdx === params.editorIdx)
    ?.editedFiles;
};

export const selectOpenFileId: ParameterizedSelector<
  string | undefined,
  { editorIdx: number }
> = (state: RootState, params) => {
  return state.editorAPI.editors.find((ed) => ed.editorIdx === params.editorIdx)
    ?.openFileId;
};

export const selectOpenFile: ParameterizedSelector<
  EditedFile | undefined,
  { editorIdx: number }
> = (state: RootState, params) => {
  const editor = state.editorAPI.editors.find(
    (ed) => ed.editorIdx === params.editorIdx
  );
  if (!editor) return;
  return editor.editedFiles.find((file) => file.id === editor.openFileId);
};

export const selectFile: ParameterizedSelector<
  EditedFile | undefined,
  { editorIdx: number; fileId: string }
> = (state: RootState, params) => {
  const editor = state.editorAPI.editors.find(
    (ed) => ed.editorIdx === params.editorIdx
  );
  if (!editor) return;
  return editor.editedFiles.find((file) => file.id === params.fileId);
};

export const selectFileContent: ParameterizedSelector<
  string | undefined,
  { editorIdx: number; fileId: string }
> = (state: RootState, params) => {
  const editor = state.editorAPI.editors.find(
    (ed) => ed.editorIdx === params.editorIdx
  );
  if (!editor) return;
  return editor.editedFiles.find((file) => file.id === params.fileId)?.content;
};

export const selectOpenFileContent: ParameterizedSelector<
  string | undefined,
  { editorIdx: number }
> = (state: RootState, params) => {
  const editor = state.editorAPI.editors.find(
    (ed) => ed.editorIdx === params.editorIdx
  );
  if (!editor) return;
  return editor.editedFiles.find((file) => file.id === editor.openFileId)
    ?.content;
};

export const selectEditorActiveIdx = (state: RootState) => {
  return state.editorAPI.activeEditorIdx;
};

/** Id of the file open in the currently-active editor pane, if any. */
export const selectActiveOpenFileId = (
  state: RootState
): string | undefined => {
  const idx = state.editorAPI.activeEditorIdx;
  return state.editorAPI.editors.find((ed) => ed.editorIdx === idx)?.openFileId;
};

/** Whether the active file has a FORM edit to undo / redo. */
export const selectCanUndoActiveForm = (state: RootState): boolean => {
  const id = selectActiveOpenFileId(state);
  const h = id ? state.editorHistory[id] : undefined;
  return !!h && h.past.length > 0;
};
export const selectCanRedoActiveForm = (state: RootState): boolean => {
  const id = selectActiveOpenFileId(state);
  const h = id ? state.editorHistory[id] : undefined;
  return !!h && h.future.length > 0;
};

/** Name of the file open in the active editor (for the title bar). */
export const selectActiveOpenFileName = (
  state: RootState
): string | undefined => {
  const idx = state.editorAPI.activeEditorIdx;
  if (idx === undefined) return undefined;
  const editor = state.editorAPI.editors.find((ed) => ed.editorIdx === idx);
  if (!editor) return undefined;
  return editor.editedFiles.find((file) => file.id === editor.openFileId)?.name;
};

export const selectEditorOpenHistory = (state: RootState) => {
  return state.editorAPI.openEditorHistory;
};

export const selectEditors = (state: RootState) => {
  return state.editorAPI.editors;
};

export const selectEditorsLength = (state: RootState) => {
  return state.editorAPI.editors.length;
};

export const selectEditedFilesIds: ParameterizedSelector<
  string[] | undefined,
  { editorIdx: number }
> = (state: RootState, params: { editorIdx: number }) => {
  return state.editorAPI.editors
    .find((ed) => ed.editorIdx === params.editorIdx)
    ?.editedFiles.map((file) => file.id);
};

export const selectFileActiveViews = (
  state: RootState,
  params: { fileId: string }
): EditorModeType[] | undefined => {
  for (const editor of state.editorAPI.editors) {
    const file = editor.editedFiles.find((f) => f.id === params.fileId);
    if (file) return file.activeViews;
  }
  return undefined;
};

export const selectOpenFileActiveViews = (
  state: RootState,
  params: { editorIdx: number }
): EditorModeType[] | undefined => {
  const editor = state.editorAPI.editors.find(
    (ed) => ed.editorIdx === params.editorIdx
  );
  if (!editor?.openFileId) return undefined;
  return editor.editedFiles.find((f) => f.id === editor.openFileId)
    ?.activeViews;
};

export const selectOpenFilePaneSizes = (
  state: RootState,
  params: { editorIdx: number }
): Partial<Record<EditorModeType, number>> | undefined => {
  const editor = state.editorAPI.editors.find(
    (ed) => ed.editorIdx === params.editorIdx
  );
  if (!editor?.openFileId) return undefined;
  return editor.editedFiles.find((f) => f.id === editor.openFileId)?.paneSizes;
};

/**
 * Returns the products declared for the open file's object type, resolved via
 * the file's plugin_uuid + sufix. Empty array if the type declares none.
 */
// Stable reference for the "no products" case so the selector doesn't return a
// fresh [] each call (which React-Redux flags as an unstable selector result).
const EMPTY_PRODUCTS: ProductDefinition[] = [];

export const selectOpenFileProducts: ParameterizedSelector<
  ProductDefinition[],
  { editorIdx: number }
> = (state: RootState, params) => {
  const editor = state.editorAPI.editors.find(
    (ed) => ed.editorIdx === params.editorIdx
  );
  const file = editor?.editedFiles.find((f) => f.id === editor.openFileId);
  if (!file) return EMPTY_PRODUCTS;
  const plugin = (state.projectAPI.plugins as Plugin[] | null)?.find(
    (p) => p.uuid === file.plugin_uuid
  );
  const baseObject = plugin?.base_objects.find((o) => o.sufix === file.sufix);
  return baseObject?.products ?? EMPTY_PRODUCTS;
};

/**
 * The product currently selected for the PRODUCT pane. Falls back to the first
 * declared product when the file has no explicit selection yet.
 */
export const selectOpenFileActiveProduct: ParameterizedSelector<
  ProductDefinition | undefined,
  { editorIdx: number }
> = (state: RootState, params) => {
  const products = selectOpenFileProducts(state, params);
  if (products.length === 0) return undefined;
  const editor = state.editorAPI.editors.find(
    (ed) => ed.editorIdx === params.editorIdx
  );
  const file = editor?.editedFiles.find((f) => f.id === editor.openFileId);
  const selected = products.find((p) => p.name === file?.activeProductName);
  return selected ?? products[0];
};

/**
 * The data context fed to a product template. Prefers live form data
 * (editorForms) so the PRODUCT view updates as the form is edited; falls back
 * to parsing the persisted YAML content.
 */
// Stable reference for the "no data" case, plus a single-slot cache for the
// YAML-parse fallback so repeated calls with unchanged content return the same
// object (React-Redux compares selector results by reference).
const EMPTY_DATA: object = {};
let parsedContentCache: { content: string; parsed: object } | null = null;

export const selectOpenFileData: ParameterizedSelector<
  object,
  { editorIdx: number }
> = (state: RootState, params) => {
  const editor = state.editorAPI.editors.find(
    (ed) => ed.editorIdx === params.editorIdx
  );
  const file = editor?.editedFiles.find((f) => f.id === editor.openFileId);
  if (!file) return EMPTY_DATA;
  const formData = state.editorForms[file.id];
  if (formData) return formData;
  if (parsedContentCache?.content === file.content) {
    return parsedContentCache.parsed;
  }
  let parsed: object;
  try {
    parsed = (yaml.parse(file.content) as object) ?? EMPTY_DATA;
  } catch {
    parsed = EMPTY_DATA;
  }
  parsedContentCache = { content: file.content, parsed };
  return parsed;
};

/**
 * The current canvas layout/theme, read from the open file's own Mermaid
 * frontmatter (see mermaid-frontmatter.core.ts) — there's no separate Redux
 * state for this, the file content is the source of truth. Drives the
 * layout/theme dropdowns' checked state in the canvas menubar.
 */
export interface CanvasConfig {
  layout?: string;
  theme?: string;
}
const EMPTY_CANVAS_CONFIG: CanvasConfig = {};
let parsedCanvasConfigCache: {
  content: string;
  config: CanvasConfig;
} | null = null;

export const selectOpenFileCanvasConfig: ParameterizedSelector<
  CanvasConfig,
  { editorIdx: number }
> = (state: RootState, params) => {
  const content = selectOpenFileContent(state, params);
  if (!content) return EMPTY_CANVAS_CONFIG;
  if (parsedCanvasConfigCache?.content === content) {
    return parsedCanvasConfigCache.config;
  }
  const { config } = parseMermaidSource(content);
  const canvasConfig: CanvasConfig = {
    layout: typeof config.layout === "string" ? config.layout : undefined,
    theme: typeof config.theme === "string" ? config.theme : undefined,
  };
  parsedCanvasConfigCache = { content, config: canvasConfig };
  return canvasConfig;
};

export const selectFileScrollPositions: ParameterizedSelector<
  Partial<Record<EditorModeType, ScrollPosition>> | undefined,
  { editorIdx: number }
> = (state: RootState, params) => {
  const editor = state.editorAPI.editors.find(
    (ed) => ed.editorIdx === params.editorIdx
  );
  if (!editor?.openFileId) return undefined;
  return (
    editor.editedFiles.find((f) => f.id === editor.openFileId)
      ?.scrollPositions ?? undefined
  );
};
