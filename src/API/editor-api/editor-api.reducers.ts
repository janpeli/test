import { PayloadAction } from "@reduxjs/toolkit";
import {
  EditedFile,
  EditorApiState,
  EditorState,
  initialState,
  Reorder,
  ReorderLast,
} from "./editor-api.slice";

//HELPER FUNCTIONS
function createEditor(): EditorState {
  return {
    openFileId: undefined,
    editedFiles: [],
    openFileHistory: [],
  };
}

function addOpenFileHistory(openFileHistory: string[], openFileId: string) {
  if (openFileHistory.length !== 0) {
    openFileHistory.push(openFileId);
    return;
  } else {
    const isLastFile =
      openFileHistory[openFileHistory.length - 1] === openFileId;
    if (!isLastFile) openFileHistory.push(openFileId);
  }
}

function getActiveEditor(state: EditorApiState) {
  state.activeEditorIdx = state.activeEditorIdx ? state.activeEditorIdx : 0;
  return state.editors[state.activeEditorIdx];
}

function getEditorForFile(editors: EditorState[], openFileId: string) {
  return editors.find((editor) => {
    return editor.editedFiles.some((file) => file.id === openFileId);
  });
  /*.filter((editor) => {
    return editor.editedFiles.some((file) => file.id === openFileId);
  })[0];*/
}

function setFileActive(editor: EditorState, openFileId: string) {
  editor.openFileId = openFileId;
  addOpenFileHistory(editor.openFileHistory, openFileId);
}

function clearFromOpenFileHistory(editor: EditorState, fileId: string) {
  editor.openFileHistory = editor.openFileHistory.filter((id) => id !== fileId);
}

function openLastFromOpenFileHistory(editor: EditorState) {
  const newOpenFile = editor.openFileHistory.pop();
  editor.openFileId = newOpenFile;
}

function clearEmptyEditors(editors: EditorState[]): EditorState[] {
  return editors.filter((editor) => {
    return !(editor.editedFiles.length === 0);
  });
}

function setThisEditorAsActive(state: EditorApiState, editor: EditorState) {
  state.activeEditorIdx = state.editors.findIndex((ed) => ed === editor);
}

function getValidIndex(state: EditorApiState) {
  if (!state.activeEditorIdx) return 0;
  if (state.editors.length - 1 < state.activeEditorIdx)
    return state.editors.length - 1;
  return state.activeEditorIdx;
}

// REDUCERS
const reducers = {
  setOpenFileId: (state: EditorApiState, action: PayloadAction<string>) => {
    let found = 0;
    for (const editor of state.editors) {
      if (editor.editedFiles.some((file) => file.id === action.payload)) {
        setFileActive(editor, action.payload);
        state.activeEditorIdx = state.editors.findIndex((ed) => ed === editor);
        found += 1;
      }
    }
    if (!found) {
      throw new Error(`File ${action.payload} can not be opened`);
    }
  },
  addEditedFile: (state: EditorApiState, action: PayloadAction<EditedFile>) => {
    if (!state.editors.length) {
      state.editors.push(createEditor());
    }

    const existingEditor = getEditorForFile(state.editors, action.payload.id);
    if (existingEditor) {
      setFileActive(existingEditor, action.payload.id);
    } else {
      const editor = getActiveEditor(state);
      editor.editedFiles.push(action.payload);
      setFileActive(editor, action.payload.id);
    }
  },
  // toto musime zmenit neskor
  addEditedFileInOtherView: (
    state: EditorApiState,
    action: PayloadAction<EditedFile>
  ) => {
    const existingEditor = getEditorForFile(state.editors, action.payload.id);
    if (existingEditor) {
      setFileActive(existingEditor, action.payload.id);
      state.activeEditorIdx = state.editors.findIndex(
        (ed) => ed === existingEditor
      );
      return;
    } else {
      const editorIdx = state.editors.push(createEditor()) - 1;
      const editor = state.editors[editorIdx];

      editor.editedFiles.push(action.payload);
      setFileActive(editor, action.payload.id);

      state.activeEditorIdx = editorIdx;
    }
  },
  removeEditedFile: (state: EditorApiState, action: PayloadAction<string>) => {
    for (const editor of state.editors) {
      if (editor.editedFiles.some((file) => file.id === action.payload)) {
        // filter out the file from editor
        editor.editedFiles = editor.editedFiles.filter(
          (file) => file.id !== action.payload
        );
        clearFromOpenFileHistory(editor, action.payload);
        if (editor.openFileId == action.payload) {
          openLastFromOpenFileHistory(editor);
        }
        if (!editor.editedFiles.length) {
          setThisEditorAsActive(state, editor);
        }
      }
    }

    state.editors = clearEmptyEditors(state.editors);
    state.activeEditorIdx = getValidIndex(state);
  },
  reorderEditedFile: (
    state: EditorApiState,
    action: PayloadAction<Reorder>
  ) => {
    const { anchorID, movedID } = action.payload;
    const editorMoved = getEditorForFile(state.editors, movedID);
    const editorAnchor = getEditorForFile(state.editors, anchorID);

    if (!editorMoved || !editorAnchor) return;

    // Find indices of both files
    const movedIndex = editorMoved.editedFiles.findIndex(
      (file) => file.id === movedID
    );
    const anchorIndex = editorAnchor.editedFiles.findIndex(
      (file) => file.id === anchorID
    );

    // Return original state if either file is not found
    if (movedIndex === -1 || anchorIndex === -1) {
      return;
    }

    // Remove the moved file from its current position
    const [movedFile] = editorMoved.editedFiles.splice(movedIndex, 1);

    // Calculate the new insertion index
    // If the moved file was before the anchor, we need to adjust the anchor index
    const adjustedAnchorIndex = editorAnchor.editedFiles.findIndex(
      (file) => file.id === anchorID
    );

    // Insert the moved file before the anchor
    editorAnchor.editedFiles.splice(adjustedAnchorIndex, 0, movedFile);

    state.activeEditorIdx = state.editors.findIndex(
      (ed) => ed === editorAnchor
    );

    if (editorMoved !== editorAnchor) {
      clearFromOpenFileHistory(editorMoved, movedID);
      if (editorMoved.openFileId === movedID) {
        openLastFromOpenFileHistory(editorMoved);
      }
      state.editors = clearEmptyEditors(state.editors);
    }
  },
  reorderEditedFileThisLast: (
    state: EditorApiState,
    action: PayloadAction<ReorderLast>
  ) => {
    const { editorId, movedID } = action.payload;
    const editorMoved = getEditorForFile(state.editors, movedID);
    const editorAnchor = state.editors[editorId];

    if (!editorAnchor || !editorMoved) return;

    // Find indices of both files
    const movedIndex = editorMoved.editedFiles.findIndex(
      (file) => file.id === movedID
    );

    // Return original state if  file is not found
    if (movedIndex === -1) return;

    // Remove the moved file from its current position
    const [movedFile] = editorMoved.editedFiles.splice(movedIndex, 1);

    // Insert the moved file before the anchor
    editorAnchor.editedFiles.push(movedFile);

    state.activeEditorIdx = state.editors.findIndex(
      (ed) => ed === editorAnchor
    );

    if (editorMoved !== editorAnchor) {
      clearFromOpenFileHistory(editorMoved, movedID);
      if (editorMoved.openFileId === movedID) {
        openLastFromOpenFileHistory(editorMoved);
      }
      state.editors = clearEmptyEditors(state.editors);
    }
  },
  closeEditor: (state: EditorApiState) => {
    Object.entries(initialState).forEach(([key, value]) => {
      state[key as keyof EditorApiState] = value;
    });
  },
};

export default reducers;
