import type { RootState } from "../../app/store";
import { ParameterizedSelector } from "@/hooks/hooks";
import { EditedFile, EditorModeType, ScrollPosition } from "./editor-api.slice";
import { Plugin, ProductDefinition } from "electron/src/project";
import yaml from "yaml";

// Other code such as selectors can use the imported `RootState` type
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
