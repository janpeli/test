import { Plugin, ProjectStructure } from "electron/src/project";
import {
  EditedFile,
  EditorModeType,
  addEditedFile,
  removeEditedFile,
  setOpenFileId,
  reorderEditedFile,
  reorderEditedFileThisLast,
  addEditedFileInOtherView,
  setEditorActive,
  toggleFileActiveView,
  ScrollPosition,
  updateFileScrollPositionForMode,
  setFilePaneSizes,
  setFileContent,
  setFileActiveProduct,
  markFormEdited,
  markFileSaved,
} from "./editor-api.slice";
import { store } from "@/app/store";
import { clearCanvasView } from "@/lib/canvas/canvas-view-store";
//import * as monaco from "monaco-editor";
import { IdefValues } from "@/features/Editor/utilities";
import { removeForm, updateFormData } from "./editor-forms.slice";
import { bumpFormSync, clearFormSync } from "./editor-form-sync.slice";
import {
  recordFormHistory,
  undoFormHistory,
  redoFormHistory,
  clearFormHistory,
} from "./editor-history.slice";
import { FieldValues } from "react-hook-form";
import { getObjVal } from "./utils";
import {
  findProjectStructureById,
  getPluginforFileID,
  getPluginRoot,
  isPluginFileId,
  normalizeFilename,
} from "../project-api/utils";
import yaml from "yaml";
import {
  addProjectStructure,
  removeProjectStructure,
  updatePlugin,
} from "../project-api/project-api.slice";
import { update_MAIN_SIDEBAR_TREES } from "../GUI-api/main-sidebar-api";
import { setIdProjectNode } from "../GUI-api/active-context.slice";
import { addErrorMessage } from "../GUI-api/status-panel-api";

/**
 * Creates an EditedFile object.
 *
 * @param {string} id - The unique identifier for the file.
 * @param {string} name - The name of the file.
 * @param {string} content - The content of the file.
 * @param {string} plugin_uuid - The UUID of the plugin associated with the file.
 * @param {string} sufix - The file extension/suffix.
 * @param {EditorMode} [defaultMode="YAML"] - The default editor mode for the file (YAML or TEXT). Defaults to YAML.
 * @returns {EditedFile} The created EditedFile object.
 */
/**
 * Returns true if the object type identified by plugin_uuid + sufix declares at
 * least one product template, so the PRODUCT mode should be offered.
 */
const objectTypeHasProducts = (plugin_uuid: string, sufix: string): boolean => {
  const plugin = store
    .getState()
    .projectAPI.plugins?.find((p) => p.uuid === plugin_uuid);
  const baseObject = plugin?.base_objects.find((o) => o.sufix === sufix);
  return !!baseObject?.products?.length;
};

export const createEditedFile = (
  id: string,
  name: string,
  content: string,
  plugin_uuid: string,
  sufix: string
): EditedFile => {
  // Files inside the project's plugins/ directory are plugin definition files
  // (schemas, templates, products, config). Always open them in SOURCE-only mode
  // since they are YAML/Nunjucks source, not model data objects.
  if (isPluginFileId(id)) {
    return { id, name, content, plugin_uuid, sufix, activeViews: ["SOURCE"], modes: ["SOURCE"] };
  }

  const isCanvas = name.toLowerCase().endsWith(".can");
  const isMarkdown = !isCanvas && ["md", "markdown"].includes(sufix.toLocaleLowerCase());
  // SQL files are plain text artifacts with no form/preview — SOURCE only.
  const isSql = !isCanvas && !isMarkdown && sufix.toLocaleLowerCase() === "sql";
  // Object files get a PRODUCT mode only when their type declares products.
  const isObject = !isCanvas && !isMarkdown && !isSql;
  const objectModes: EditorModeType[] = ["SOURCE", "FORM"];
  if (isObject && objectTypeHasProducts(plugin_uuid, sufix)) {
    objectModes.push("PRODUCT");
  }
  const modes: EditorModeType[] = isCanvas
    ? ["SOURCE", "CANVAS"]
    : isMarkdown
      ? ["SOURCE", "MARKDOWN"]
      : isSql
        ? ["SOURCE"]
        : objectModes;
  return {
    id,
    name,
    content,
    plugin_uuid,
    sufix,
    activeViews: isObject ? ["FORM"] : modes,
    modes,
  };
};

/**
 * Sets which product is shown in the PRODUCT pane for a file.
 */
export const setActiveProduct = (fileId: string, productName: string) => {
  store.dispatch(setFileActiveProduct({ fileId, productName }));
};

export const toggleFileView = (fileId: string, view: EditorModeType) => {
  store.dispatch(toggleFileActiveView({ fileId, view }));
};

export const setPaneSizes = (
  fileId: string,
  sizes: Partial<Record<EditorModeType, number>>
) => {
  store.dispatch(setFilePaneSizes({ fileId, sizes }));
};

/**
 * Opens a file based on its ProjectStructure data. Reads the file content and adds it to the editor.
 *
 * @param {ProjectStructure} data - The ProjectStructure object containing file information.
 */
export const openFile = async (data: ProjectStructure) => {
  const projectFolder = store.getState().projectAPI.folderPath as string;
  const content = await window.project.getFileContent({
    filePath: data.id,
    folderPath: projectFolder,
  });
  const { plugin_uuid, sufix } = findProjectStructureById(
    store.getState().projectAPI.projectStructure as ProjectStructure,
    data.id
  ) as ProjectStructure;
  const editedFile = createEditedFile(
    data.id,
    data.name,
    content,
    plugin_uuid as string,
    sufix
  );
  store.dispatch(addEditedFile(editedFile));
};

/**
 * Retrieves the content of a file by its ID.
 *
 * @param {string} id - The ID of the file to retrieve content from.
 * @returns {Promise<string | undefined>} A promise that resolves to the file content or undefined if the project folder is not set.
 */
export const getFileContentById = async (id: string) => {
  const projectFolder = store.getState().projectAPI.folderPath;
  if (!projectFolder) return;
  const content = await window.project.getFileContent({
    filePath: id,
    folderPath: projectFolder,
  });
  return content;
};

/**
 * Opens a file in the editor by its ID. Reads the file content and adds it to the editor.
 *
 * @param {string} id - The ID of the file to open.
 */
export const openFileById = async (id: string) => {
  // get folder path
  const projectFolder = store.getState().projectAPI.folderPath;
  if (!projectFolder) return;
  // get project structure
  const projectStructure = store.getState().projectAPI.projectStructure;
  if (!projectStructure) return;
  // Look the file up before reading it: ids can go stale (file created or
  // deleted on disk after project open — e.g. a search result), and a miss
  // must not crash the caller.
  const structureNode = findProjectStructureById(projectStructure, id);
  if (!structureNode) {
    addErrorMessage(`File is not in the loaded project structure: ${id}`, "error");
    return;
  }
  const { plugin_uuid, sufix, name } = structureNode;
  const content = await window.project.getFileContent({
    filePath: id,
    folderPath: projectFolder,
  });
  const editedFile = createEditedFile(
    id,
    name,
    content,
    plugin_uuid as string,
    sufix
  );
  store.dispatch(addEditedFile(editedFile));
};

/**
 * If the file is a plugin file, validates its content against the meta schema
 * and surfaces any issues in the status panel. Returns false when validation
 * produced errors so the caller can abort the save; warnings do not block.
 */
const validateAndReportPluginFile = async (
  fileId: string,
  content: string
): Promise<boolean> => {
  const result = await window.project.validatePluginFile({ filePath: fileId, content });
  result.errors.forEach((msg) => addErrorMessage(`Plugin [${fileId}]: ${msg}`, "error"));
  result.warnings.forEach((msg) => addErrorMessage(`Plugin [${fileId}]: ${msg}`, "warning"));
  return result.errors.length === 0;
};

/**
 * After a successful save of a plugin file, reloads the owning plugin from
 * disk into Redux so form schemas and products stay in sync with the edited files.
 */
const reloadPluginAfterSave = async (
  fileId: string,
  projectFolder: string
): Promise<void> => {
  const pluginDir = getPluginRoot(fileId);
  if (!pluginDir) return;
  const updated = await window.project.reloadPlugin({ pluginDir, folderPath: projectFolder });
  if (updated) store.dispatch(updatePlugin(updated));
};

/** Finds an EditedFile by id across all editors. */
const getEditedFileById = (id: string): EditedFile | undefined => {
  for (const ed of store.getState().editorAPI.editors) {
    const file = ed.editedFiles.find((f) => f.id === id);
    if (file) return file;
  }
  return undefined;
};

/**
 * Parses content into the form store and bumps form-sync so an open
 * react-hook-form resets. Returns false (form untouched) on invalid YAML —
 * expected mid-typing; live-sync ignores it, the save path warns instead.
 */
const applyContentToForm = (id: string, content: string): boolean => {
  try {
    const parsed = yaml.parse(content);
    store.dispatch(updateFormData({ [id]: (parsed ?? {}) as IdefValues }));
    store.dispatch(bumpFormSync(id));
    return true;
  } catch {
    return false;
  }
};

// --- Live SOURCE <-> FORM sync -------------------------------------------------
// Keeps Monaco `content` and parsed `editorForms[id]` in step. Loop-safe:
//  - SOURCE->FORM (applyContentToForm) uses raw updateFormData, never the
//    FORM->SOURCE path (which hangs off the form-commit wrappers only).
//  - FORM->SOURCE (setFileContent without `fromSource`) is applied by Monaco via
//    bracketed pushEditOperations, suppressing its change event.

// Debounced SOURCE->FORM: coalesce per-keystroke Monaco changes, re-parse once
// typing pauses. Keyed per file.
const formSyncTimers = new Map<string, ReturnType<typeof setTimeout>>();
const FORM_SYNC_DEBOUNCE_MS = 250;

/** Cancels a pending SOURCE->FORM sync (e.g. a form edit has superseded it). */
const cancelFormSyncFromContent = (id: string) => {
  const t = formSyncTimers.get(id);
  if (t) {
    clearTimeout(t);
    formSyncTimers.delete(id);
  }
};

/**
 * Schedules a debounced SOURCE->FORM sync after a Monaco edit. No-op for files
 * with no form; invalid YAML mid-typing is ignored until the source parses again.
 */
export const scheduleFormSyncFromContent = (id: string) => {
  if (!(id in store.getState().editorForms)) return;
  cancelFormSyncFromContent(id);
  formSyncTimers.set(
    id,
    setTimeout(() => {
      formSyncTimers.delete(id);
      if (!(id in store.getState().editorForms)) return;
      const file = getEditedFileById(id);
      if (file) applyContentToForm(id, file.content);
    }, FORM_SYNC_DEBOUNCE_MS)
  );
};

/**
 * FORM->SOURCE: serializes the form into the file content so the Monaco pane
 * reflects a form edit immediately. Cancels any pending SOURCE->FORM sync so the
 * edit isn't overwritten by stale source. Re-serializing drops YAML
 * comments/formatting — the accepted tradeoff (same loss as on save).
 */
const syncSourceFromForm = (id: string) => {
  cancelFormSyncFromContent(id);
  const data = store.getState().editorForms[id];
  if (data === undefined) return;
  store.dispatch(setFileContent({ fileId: id, content: yaml.stringify(data) }));
};

/**
 * Saves an edited file. The form (`editorForms[id]`) is normally the source of
 * truth, but when SOURCE is ahead (`contentDirty`) its content is persisted and
 * reconciled back into the form instead. Files with no form save raw content.
 *
 * @param {string} id - The ID of the file to save.
 * @returns {Promise<boolean>} True if the file was saved successfully.
 */
export const saveEditedFile = async (id: string) => {
  const projectFolder = store.getState().projectAPI.folderPath as string;
  const isPluginFile = isPluginFileId(id);

  const formExists = id in store.getState().editorForms;
  const file = getEditedFileById(id);
  const useSourceContent = !formExists || !!file?.contentDirty;

  const content = useSourceContent
    ? file?.content
    : yaml.stringify(store.getState().editorForms[id]);
  if (content === undefined) return false;

  if (isPluginFile && !(await validateAndReportPluginFile(id, content))) return false;

  const saved = await window.project.saveFileContent({
    filePath: id,
    folderPath: projectFolder,
    content,
  });
  if (saved) {
    store.dispatch(setFileContent({ fileId: id, content }));
    // Keep the form representation in step with content written from SOURCE.
    if (useSourceContent && formExists && !applyContentToForm(id, content)) {
      addErrorMessage(
        `Saved [${id}] but its content is not valid YAML, so the form view was not updated.`,
        "warning"
      );
    }
    store.dispatch(markFileSaved({ fileId: id }));
    if (isPluginFile) await reloadPluginAfterSave(id, projectFolder);
  }
  return saved;
};

/**
 * Opens a file in another editor view by its ID.
 *
 * @param {string} id - The ID of the file to open in another view.
 */
export const openFileByIdInOtherView = async (id: string) => {
  const projectFolder = store.getState().projectAPI.folderPath;
  if (!projectFolder) return;
  const projectStructure = store.getState().projectAPI.projectStructure;
  if (!projectStructure) return;
  const content = await window.project.getFileContent({
    filePath: id,
    folderPath: projectFolder,
  });
  const { plugin_uuid, sufix, name } = findProjectStructureById(
    projectStructure,
    id
  ) as ProjectStructure;
  const editedFile: EditedFile = createEditedFile(
    id,
    name,
    content,
    plugin_uuid as string,
    sufix
  );
  store.dispatch(addEditedFileInOtherView(editedFile));
};

/**
 * Closes a file in the editor.
 *
 * @param {string} id - The ID of the file to close.
 */
export const closeFile = (id: string) => {
  // A file created this session but never saved has no on-disk counterpart, so
  // closing it discards it entirely rather than leaving a phantom tree node.
  const isNew = store
    .getState()
    .editorAPI.editors.some((ed) =>
      ed.editedFiles.some((file) => file.id === id && file.isNew)
    );

  cancelFormSyncFromContent(id);
  store.dispatch(removeEditedFile(id));
  store.dispatch(removeForm(id));
  store.dispatch(clearFormSync(id));
  store.dispatch(clearFormHistory(id));

  if (isNew) {
    store.dispatch(removeProjectStructure(id));
    update_MAIN_SIDEBAR_TREES();
  }

  // Only drop the persisted canvas view once no editor pane still has the file
  // open (checked against the post-dispatch state).
  const stillOpen = store
    .getState()
    .editorAPI.editors.some((ed) =>
      ed.editedFiles.some((file) => file.id === id)
    );
  if (!stillOpen) clearCanvasView(id);
};

/**
 * Sets the active file in the editor.
 *
 * @param {string} id - The ID of the file to set as active.
 */
export const setActiveFile = (id: string) => {
  store.dispatch(setOpenFileId(id));
  store.dispatch(setIdProjectNode(id));
};

/**
 * Reorders files in the editor.
 *
 * @param {string} anchorID - The ID of the file to use as an anchor.
 * @param {string} movedID - The ID of the file to move.
 */
export const reorderFiles = (anchorID: string, movedID: string) => {
  store.dispatch(reorderEditedFile({ anchorID: anchorID, movedID: movedID }));
};

/**
 * Reorders a file to be last in a specific editor.
 *
 * @param {string} movedID - The ID of the file to move to the end.
 * @param {number} targetEditorIdx - The index of the editor to move the file within.
 */
export const reorderFilesThisLast = (
  movedID: string,
  targetEditorIdx: number
) => {
  store.dispatch(
    reorderEditedFileThisLast({ editorId: targetEditorIdx, movedID: movedID })
  );
};

/**
 * Sets the active editor by index.
 *
 * @param {number} editorIdx - The index of the editor to set as active.
 */
export const setActiveEditor = (editorIdx: number) => {
  if (store.getState().editorAPI.activeEditorIdx === editorIdx) return;
  store.dispatch(setEditorActive(editorIdx));
};

/**
 * Creates a new editor form data entry.
 *
 * @param {string} formID - The ID of the form to create data for.
 * @param {IdefValues} data - The initial data for the form.
 */
export const createEditorFormData = (formID: string, data: IdefValues) => {
  if (formID in store.getState().editorForms) return;
  store.dispatch(updateFormData({ [formID]: data }));
};

/**
 * Updates the editor form data for a specific form.
 *
 * @param {string} formID - The ID of the form to update.
 * @param {IdefValues} data - The new data for the form.
 */
export const updateEditorFormData = (formID: string, data: IdefValues) => {
  const prev = store.getState().editorForms[formID];
  if (prev !== undefined)
    store.dispatch(recordFormHistory({ fileId: formID, snapshot: prev }));
  store.dispatch(updateFormData({ [formID]: data }));
  store.dispatch(markFormEdited({ fileId: formID }));
  syncSourceFromForm(formID);
};

/**
 * Updates a specific value within an editor form data object based on a path.  Prevents dispatching if the value hasn't changed.
 *
 * @param {string} formID - The ID of the form to update.
 * @param {FieldValues} data - The complete form data containing the updated value.
 * @param {string} path - The path to the specific value within the form data object to update (e.g., "general.name").
 */
export const updateEditorFormDatabyPath = (
  formID: string,
  data: FieldValues,
  path: string
) => {
  if (!(formID in store.getState().editorForms)) return;
  const oldData = store.getState().editorForms[formID];

  const oldValue = getObjVal(oldData, path);
  const newValue = getObjVal(data, path);

  if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
    return; // Values are the same, no need to dispatch
  }

  // Record the pre-edit form as an undo step (fires on field blur, so each
  // changed field is one undo boundary).
  store.dispatch(recordFormHistory({ fileId: formID, snapshot: oldData }));
  store.dispatch(updateFormData({ [formID]: data }));
  store.dispatch(markFormEdited({ fileId: formID }));
  syncSourceFromForm(formID);
};

/**
 * Undo the last FORM edit: restores the previous snapshot and bumps formSync so
 * the open react-hook-form resets. No-op when nothing to undo. SOURCE text edits
 * are undone by Monaco's own native stack, not here.
 */
export const undoForm = (fileId: string) => {
  const state = store.getState();
  const history = state.editorHistory[fileId];
  if (!history || history.past.length === 0) return;
  const present = state.editorForms[fileId];
  const previous = history.past[history.past.length - 1];
  store.dispatch(undoFormHistory({ fileId, present }));
  store.dispatch(updateFormData({ [fileId]: previous }));
  store.dispatch(markFormEdited({ fileId }));
  store.dispatch(bumpFormSync(fileId));
  syncSourceFromForm(fileId);
};

/** Redo the last undone FORM edit for a file. Mirror of {@link undoForm}. */
export const redoForm = (fileId: string) => {
  const state = store.getState();
  const history = state.editorHistory[fileId];
  if (!history || history.future.length === 0) return;
  const present = state.editorForms[fileId];
  const next = history.future[history.future.length - 1];
  store.dispatch(redoFormHistory({ fileId, present }));
  store.dispatch(updateFormData({ [fileId]: next }));
  store.dispatch(markFormEdited({ fileId }));
  store.dispatch(bumpFormSync(fileId));
  syncSourceFromForm(fileId);
};

/**
 * Gets the current state of a form.
 *
 * @param {string} formId - The ID of the form to retrieve the state for.
 * @returns {IdefValues | undefined} The form's state, or undefined if the form doesn't exist.
 */
export const getFormState = (formId: string) => {
  const state = store.getState().editorForms;
  if (formId in state) return state[formId];
  return undefined;
};

/**
 * Creates a new file from the modal form data.
 */
export const createFileFromModal = () => {
  const { id } = store.getState().modalAPI;
  const { file_name, base_object_type, template } =
    store.getState().editorForms["create-object"];
  const normalizedFileName = normalizeFilename(file_name as string, {
    replacement: "_",
  });
  const projectStructure = store.getState().projectAPI.projectStructure;
  const plugin = getPluginforFileID(
    id as string,
    projectStructure as ProjectStructure,
    store.getState().projectAPI.plugins as Plugin[]
  );
  const extension =
    plugin && base_object_type
      ? (plugin.base_objects.find((obj) => obj.name === base_object_type)
          ?.sufix as string)
      : "";
  const newId = `${id}/${normalizedFileName}${
    extension ? "." + extension : ""
  }.yaml`;
  const name = `${normalizedFileName}${extension ? "." + extension : ""}`;
  const data: IdefValues = { general: { name: file_name, template: template } };
  const initialContent = yaml.stringify(data);
  const uuid = plugin?.uuid as string;

  // Check if the file already exists
  const existingProjectStructure = findProjectStructureById(
    projectStructure as ProjectStructure,
    newId
  );

  const fileAlreadyOpen = newId in store.getState().editorForms;

  if (existingProjectStructure || fileAlreadyOpen) {
    console.warn(`File with ID "${newId}" already exists.  Creation aborted.`);
    // Optionally, dispatch an action to show an error message to the user
    // store.dispatch(showErrorMessage("File already exists!"));
    return; // Do not proceed with file creation
  }

  const editedFile = createEditedFile(
    newId,
    name,
    initialContent,
    uuid,
    extension
  );

  const fileProjectStructure: ProjectStructure = {
    id: newId,
    isOpen: false,
    name,
    isFolder: false,
    isLeaf: true,
    sufix: extension,
    plugin_uuid: uuid,
  };

  store.dispatch(
    addProjectStructure({
      path: id as string,
      projectStructure: fileProjectStructure,
    })
  );
  store.dispatch(addEditedFile({ ...editedFile, isDirty: true, isNew: true }));
  store.dispatch(updateFormData({ [newId]: data }));
  update_MAIN_SIDEBAR_TREES();
};

export const updateFileScrollPos = (
  fileId: string,
  mode: EditorModeType,
  scrollPosition: ScrollPosition
) => {
  store.dispatch(updateFileScrollPositionForMode({ fileId, mode, scrollPosition }));
};
