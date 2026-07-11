import { store } from "@/app/store";
import { closeModal, openModal } from "./modal.slice";
import {
  createCanvasFileInParent,
  createFolderInParent,
  createMarkdownFileInParent,
  createSqlFileInParent,
  createModelInParent,
  deleteProjectFile,
  deleteProjectFolder,
  getProjectStructurebyId,
  renameProjectNode,
} from "../project-api/project-api";
import { getFolderFromPath } from "../project-api/utils";
import { addErrorMessage } from "./status-panel-api";
import {
  advancePendingClose,
  clearPendingClose,
  closeFile,
  overwriteEditedFile,
  saveEditedFile,
} from "../editor-api/editor-api";

// Also clears any pending bulk-close queue: the dialog's generic dismiss
// paths (Escape, overlay click) land here rather than in cancelCloseFile, and
// dismissing the close-unsaved modal must abort the whole bulk operation.
// Harmless for every other modal type (the queue is empty outside bulk close).
export const closeModals = () => {
  clearPendingClose();
  store.dispatch(closeModal());
};

export const openModals = async (type: string, id: string) => {
  const projectStructure = getProjectStructurebyId(id);
  if (!projectStructure) return [];
  store.dispatch(openModal({ type, id }));
};

export const openCreateObjectModal = async (id: string) => {
  const projectStructure = getProjectStructurebyId(id);
  if (!projectStructure) return;
  const path = projectStructure.isFolder
    ? projectStructure.id
    : getFolderFromPath(projectStructure.id);
  store.dispatch(openModal({ type: "create-object", id: path }));
};

export const openCreateProjectModal = async () => {
  store.dispatch(openModal({ type: "create-project", id: "" }));
};

export const openCreateFolderModal = async (id: string) => {
  const projectStructure = getProjectStructurebyId(id);
  if (!projectStructure) return;
  const path = projectStructure.isFolder
    ? projectStructure.id
    : getFolderFromPath(projectStructure.id);
  store.dispatch(openModal({ type: "create-folder", id: path }));
};

export const openCreateModelModal = async (id: string) => {
  const projectStructure = getProjectStructurebyId(id);
  if (!projectStructure) return;
  if (projectStructure.plugin_uuid) {
    addErrorMessage("Cannot create a model inside another model.", "warning");
    return;
  }
  const path = projectStructure.isFolder
    ? projectStructure.id
    : getFolderFromPath(projectStructure.id);
  store.dispatch(openModal({ type: "create-model", id: path }));
};

export const openCreateMarkdownModal = async (id: string) => {
  const projectStructure = getProjectStructurebyId(id);
  if (!projectStructure) return;
  const path = projectStructure.isFolder
    ? projectStructure.id
    : getFolderFromPath(projectStructure.id);
  store.dispatch(openModal({ type: "create-markdown", id: path }));
};

export const createMarkdownFromModal = async (name: string) => {
  const { id } = store.getState().modalAPI;
  if (!id) return;
  createMarkdownFileInParent(name, id);
};

export const openCreateSqlModal = async (id: string) => {
  const projectStructure = getProjectStructurebyId(id);
  if (!projectStructure) return;
  const path = projectStructure.isFolder
    ? projectStructure.id
    : getFolderFromPath(projectStructure.id);
  store.dispatch(openModal({ type: "create-sql", id: path }));
};

export const createSqlFromModal = async (name: string) => {
  const { id } = store.getState().modalAPI;
  if (!id) return;
  createSqlFileInParent(name, id);
};

export const openCreateCanvasModal = async (id: string) => {
  const projectStructure = getProjectStructurebyId(id);
  if (!projectStructure) return;
  const path = projectStructure.isFolder
    ? projectStructure.id
    : getFolderFromPath(projectStructure.id);
  store.dispatch(openModal({ type: "create-canvas", id: path }));
};

export const createCanvasFromModal = async (name: string) => {
  const { id } = store.getState().modalAPI;
  if (!id) return;
  createCanvasFileInParent(name, id);
};

export const openAddPluginModal = async () => {
  store.dispatch(openModal({ type: "add-plugin", id: "" }));
};

// Static, read-only help modal for the Search panel. No target node, so id "".
export const openSearchHelpModal = async () => {
  store.dispatch(openModal({ type: "search-help", id: "" }));
};

export const createFolderFromModal = async (name: string) => {
  const { id } = store.getState().modalAPI;
  if (!id) return;
  createFolderInParent(name, id);
};

export const createModelFromModal = async (name: string, uuid: string) => {
  const { id } = store.getState().modalAPI;
  if (!id) return;
  createModelInParent(name, uuid, id);
};

export const openRenameModal = async (id: string) => {
  const projectStructure = getProjectStructurebyId(id);
  if (!projectStructure) return;
  if (projectStructure.sufix === "mdl") {
    addErrorMessage("Config files cannot be renamed.", "error");
    return;
  }
  if (id === "models") {
    addErrorMessage("The models folder cannot be renamed.", "error");
    return;
  }
  store.dispatch(openModal({ type: "rename", id }));
};

export const renameFromModal = async (newStem: string) => {
  const { id } = store.getState().modalAPI;
  if (!id) return;
  renameProjectNode(id, newStem);
};

export const openDeleteModal = async (id: string) => {
  const projectStructure = getProjectStructurebyId(id);
  if (!projectStructure) return;
  if (id === "models") {
    addErrorMessage("The models folder cannot be deleted.", "error");
    return;
  }
  store.dispatch(openModal({ type: "delete-confirm", id }));
};

export const deleteFromModal = async () => {
  const { id } = store.getState().modalAPI;
  if (!id) return;
  const node = getProjectStructurebyId(id);
  if (!node) return;
  if (node.isFolder) {
    await deleteProjectFolder(id);
  } else {
    await deleteProjectFile(id);
  }
};

// One-shot bypass for the beforeunload guard: set right before the retried
// window.close() so it isn't blocked again by its own unsaved-changes check.
let allowWindowClose = false;

export const canCloseWindow = () => allowWindowClose;

export const openUnsavedChangesModal = async () => {
  store.dispatch(openModal({ type: "unsaved-changes", id: "" }));
};

export const closeWithoutSaving = () => {
  allowWindowClose = true;
  closeModals();
  window.close();
};

// Shown by saveEditedFile when the target file changed on disk since it was
// opened. The modal id is the file id to overwrite.
export const openFileConflictModal = (fileId: string) => {
  store.dispatch(openModal({ type: "file-conflict", id: fileId }));
};

export const overwriteFromConflictModal = async () => {
  const { id } = store.getState().modalAPI;
  closeModals();
  if (id) await overwriteEditedFile(id);
};

// Shown by requestCloseFile when closing a file with unsaved edits. The modal
// id is the file id being closed.
export const openCloseUnsavedModal = (fileId: string) => {
  store.dispatch(openModal({ type: "close-unsaved", id: fileId }));
};

// Close-first ordering (vs. closing the modal first): when a bulk close has
// more dirty files queued, advancePendingClose reopens the modal for the next
// one; both dispatches batch in one handler so the dialog stays open and just
// shows the next file name instead of flapping closed and open.
export const discardAndCloseFile = () => {
  const { id } = store.getState().modalAPI;
  if (id) closeFile(id);
  if (!advancePendingClose()) closeModals();
};

export const saveAndCloseFile = async () => {
  const { id } = store.getState().modalAPI;
  if (!id) {
    closeModals();
    return;
  }
  const ok = await saveEditedFile(id);
  if (ok) {
    closeFile(id);
    if (!advancePendingClose()) closeModals();
  } else {
    // The save failed (e.g. the file changed on disk) and saveEditedFile has
    // already opened the file-conflict modal, replacing this one. Leave the
    // file open and abandon the rest of any bulk close so the user can
    // resolve the conflict first.
    clearPendingClose();
  }
};

/**
 * Cancel button of the close-unsaved modal. Aborts the whole bulk close (if
 * any): "Cancel" means "stop, let me look", so the remaining dirty files are
 * not prompted for.
 */
export const cancelCloseFile = () => {
  clearPendingClose();
  closeModals();
};
