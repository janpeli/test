import { PayloadAction } from "@reduxjs/toolkit";
import {
  EditedFile,
  EditorApiState,
  EditorMode,
  EditorState,
  initialState,
  Reorder,
  ReorderLast,
  ScrollPosition,
} from "./editor-api.slice";

//HELPER FUNCTIONS
function createEditor(): EditorState {
  return {
    openFileId: undefined,
    editedFiles: [],
    openFileHistory: [],
    editorIdx: new Date().valueOf(),
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

function addOpenEditorHistory(state: EditorApiState, editorIdx: number) {
  if (state.openEditorHistory.length !== 0) {
    state.openEditorHistory.push(editorIdx);
    return;
  } else {
    const isLastFile =
      state.openEditorHistory[state.openEditorHistory.length - 1] === editorIdx;
    if (!isLastFile) state.openEditorHistory.push(editorIdx);
  }
}

function cleanOpenEditorHistory(state: EditorApiState): number[] {
  const validEditorIndices = new Set(
    state.editors.map((editor) => editor.editorIdx)
  );

  return state.openEditorHistory.filter((idx) => validEditorIndices.has(idx));
}

function getActiveEditor(state: EditorApiState) {
  state.activeEditorIdx = state.activeEditorIdx
    ? state.activeEditorIdx
    : state.editors[0].editorIdx;
  const editor = state.editors.find(
    (ed) => ed.editorIdx === state.activeEditorIdx
  );
  return editor as EditorState;
}

function getEditorForFile(editors: EditorState[], openFileId: string) {
  return editors.find((editor) => {
    return editor.editedFiles.some((file) => file.id === openFileId);
  });
}

function setFileActive(editor: EditorState, openFileId: string) {
  editor.openFileId = openFileId;
  addOpenFileHistory(editor.openFileHistory, openFileId);
}

function setEditorActive(state: EditorApiState, editorIdx: number) {
  if (state.activeEditorIdx !== editorIdx) state.activeEditorIdx = editorIdx;
  addOpenEditorHistory(state, editorIdx);
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

function getValidIndex(state: EditorApiState) {
  if (!state.activeEditorIdx && state.editors[0])
    return state.editors[0].editorIdx;
  if (!state.activeEditorIdx && !state.editors[0]) return undefined;
  if (state.editors.some((ed) => ed.editorIdx === state.activeEditorIdx))
    return state.activeEditorIdx;
  return state.openEditorHistory.pop();
}

// REDUCERS
const reducers = {
  setEditorActive: (state: EditorApiState, action: PayloadAction<number>) => {
    setEditorActive(state, action.payload);
  },
  setOpenFileId: (state: EditorApiState, action: PayloadAction<string>) => {
    let found = 0;
    for (const editor of state.editors) {
      if (editor.editedFiles.some((file) => file.id === action.payload)) {
        setFileActive(editor, action.payload);
        setEditorActive(state, editor.editorIdx);
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
      console.log(state.editors[0].editorIdx);
      setEditorActive(state, state.editors[0].editorIdx);
    }

    const existingEditor = getEditorForFile(state.editors, action.payload.id);
    if (existingEditor) {
      setFileActive(existingEditor, action.payload.id);
      setEditorActive(state, existingEditor.editorIdx);
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
      setEditorActive(state, existingEditor.editorIdx);
      return;
    } else {
      const editor = createEditor();
      state.editors.push(editor);

      editor.editedFiles.push(action.payload);
      setFileActive(editor, action.payload.id);
      setEditorActive(state, editor.editorIdx);
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
          setEditorActive(state, editor.editorIdx);
        }
      }
    }

    state.editors = clearEmptyEditors(state.editors);
    state.openEditorHistory = cleanOpenEditorHistory(state);
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

    state.activeEditorIdx = editorAnchor.editorIdx;

    if (editorMoved !== editorAnchor) {
      clearFromOpenFileHistory(editorMoved, movedID);
      if (editorMoved.openFileId === movedID) {
        openLastFromOpenFileHistory(editorMoved);
      }
      state.editors = clearEmptyEditors(state.editors);
      state.openEditorHistory = cleanOpenEditorHistory(state);
    }
  },
  reorderEditedFileThisLast: (
    state: EditorApiState,
    action: PayloadAction<ReorderLast>
  ) => {
    const { editorId, movedID } = action.payload;
    const editorMoved = getEditorForFile(state.editors, movedID);
    const editorAnchor = state.editors.find((ed) => ed.editorIdx === editorId);

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

    state.activeEditorIdx = editorId;

    if (editorMoved !== editorAnchor) {
      clearFromOpenFileHistory(editorMoved, movedID);
      if (editorMoved.openFileId === movedID) {
        openLastFromOpenFileHistory(editorMoved);
      }
      state.editors = clearEmptyEditors(state.editors);
      state.openEditorHistory = cleanOpenEditorHistory(state);
    }
  },
  closeEditor: (state: EditorApiState) => {
    Object.entries(initialState).forEach(([key, value]) => {
      state[key as keyof EditorApiState] = value;
    });
  },
  setFileEditorMode: (
    state: EditorApiState,
    action: PayloadAction<{ fileId: string; mode: EditorMode }>
  ) => {
    const { fileId, mode } = action.payload;

    // Find the file across all editors
    for (const editor of state.editors) {
      const file = editor.editedFiles.find((f) => f.id === fileId);
      if (file) {
        file.editorMode = mode;
        break;
      }
    }
  },
  updateFileScrollPosition: (
    state: EditorApiState,
    action: PayloadAction<{
      fileId: string;
      scrollPosition: ScrollPosition;
    }>
  ) => {
    const { fileId, scrollPosition } = action.payload;

    // Update in all editors
    state.editors.forEach((editor) => {
      const file = editor.editedFiles.find((f) => f.id === fileId);
      if (
        file &&
        (file.scrollPosition?.scrollLeft !== scrollPosition.scrollLeft ||
          file.scrollPosition?.scrollTop !== scrollPosition.scrollTop)
      ) {
        file.scrollPosition = scrollPosition;
      }
    });
  },
};

export default reducers;
