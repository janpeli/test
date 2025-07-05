import { Plugin, ProjectStructure } from "electron/src/project";
import {
  EditedFile,
  EditorMode,
  addEditedFile,
  removeEditedFile,
  setOpenFileId,
  reorderEditedFile,
  reorderEditedFileThisLast,
  addEditedFileInOtherView,
  setEditorActive,
  setFileEditorMode,
  ScrollPosition,
  updateFileScrollPosition,
  setFileContent,
} from "./editor-api.slice";
import { store } from "@/app/store";
import * as monaco from "monaco-editor";
import { IdefValues } from "@/features/Editor/utilities";
import { removeForm, updateFormData } from "./editor-forms.slice";
import { FieldValues } from "react-hook-form";
import { getObjVal } from "./utils";
import {
  findProjectStructureById,
  getPluginforFileID,
  normalizeFilename,
} from "../project-api/utils";
import yaml from "yaml";
import { addProjectStructure } from "../project-api/project-api.slice";
import { update_MAIN_SIDEBAR_EXPLORER_TREE } from "../GUI-api/main-sidebar-api";
import { setIdProjectNode } from "../GUI-api/active-context.slice";

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
export const createEditedFile = (
  id: string,
  name: string,
  content: string,
  plugin_uuid: string,
  sufix: string,
  defaultMode: EditorMode = "YAML"
): EditedFile => {
  console.log(`file:///${id}`);
  console.log(monaco.Uri.parse(`file:///${id}`));

  return {
    id,
    name,
    content,
    plugin_uuid,
    sufix,
    editorMode: defaultMode,
  };
};

/**
 * Sets the editor mode for a specific file.
 *
 * @param {string} fileId - The ID of the file to set the mode for.
 * @param {EditorMode} mode - The editor mode to set (YAML or TEXT).
 */
export const setFileMode = (fileId: string, mode: EditorMode) => {
  store.dispatch(setFileEditorMode({ fileId, mode }));
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
    sufix,
    "YAML"
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
  const content = await window.project.getFileContent({
    filePath: id,
    folderPath: projectFolder,
  });
  // get file info from project structure
  const { plugin_uuid, sufix, name } = findProjectStructureById(
    projectStructure,
    id
  ) as ProjectStructure;
  const editedFile = createEditedFile(
    id,
    name,
    content,
    plugin_uuid as string,
    sufix,
    "YAML"
  );
  store.dispatch(addEditedFile(editedFile));
};

/**
 * Saves the content of an edited file.  The content is serialized from the editor form.
 *
 * @param {string} id - The ID of the file to save.
 * @returns {Promise<boolean>} A promise that resolves to true if the file was saved successfully, false otherwise.
 */
export const saveEditedFile = async (id: string) => {
  const projectFolder = store.getState().projectAPI.folderPath as string;

  if (!(id in store.getState().editorForms)) return false;
  const content = yaml.stringify(store.getState().editorForms[id]);

  const saved = await window.project.saveFileContent({
    filePath: id,
    folderPath: projectFolder,
    content: content,
  });

  if (saved) store.dispatch(setFileContent({ fileId: id, content }));

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
    sufix,
    "YAML"
  );
  store.dispatch(addEditedFileInOtherView(editedFile));
};

/**
 * Closes a file in the editor.
 *
 * @param {string} id - The ID of the file to close.
 */
export const closeFile = (id: string) => {
  store.dispatch(removeEditedFile(id));
  store.dispatch(removeForm(id));
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
  store.dispatch(updateFormData({ [formID]: data }));
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
  console.log(store.getState().editorForms);
  console.log(formID);
  if (!(formID in store.getState().editorForms)) return;
  const oldData = store.getState().editorForms[formID];

  const oldValue = getObjVal(oldData, path);
  const newValue = getObjVal(data, path);

  console.log(`oldValue: ${oldValue} newValue: ${newValue}`);

  if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
    return; // Values are the same, no need to dispatch
  }

  store.dispatch(updateFormData({ [formID]: data }));
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
  const newId = `${id}\\${normalizedFileName}${
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
    extension,
    "YAML"
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
  store.dispatch(addEditedFile(editedFile));
  store.dispatch(updateFormData({ [newId]: data }));
  update_MAIN_SIDEBAR_EXPLORER_TREE();
};

/**
 * Updates the scroll position of a file in the editor.
 *
 * @param {string} fileId - The ID of the file to update the scroll position for.
 * @param {ScrollPosition} scrollPosition - The new scroll position.
 */
export const updateFileScrollPos = (
  fileId: string,
  scrollPosition: ScrollPosition
) => {
  store.dispatch(updateFileScrollPosition({ fileId, scrollPosition }));
};
