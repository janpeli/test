import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  editorAPISlice,
  addEditedFile,
  addEditedFileInOtherView,
  removeEditedFile,
  setOpenFileId,
  initialState,
  type EditorApiState,
  type EditedFile,
} from "./editor-api.slice";

const reducer = editorAPISlice.reducer;

// Minimal EditedFile — only the fields the history/close reducers read matter.
function file(id: string): EditedFile {
  return {
    id,
    name: id,
    content: "",
    plugin_uuid: "p",
    sufix: "s",
    activeViews: ["SOURCE"],
  };
}

// Drive a sequence of actions from the initial state and return the single
// editor's state (these scenarios never split into a second editor).
function run(...actions: Parameters<typeof reducer>[1][]): EditorApiState {
  return actions.reduce((state, action) => reducer(state, action), initialState);
}

const activeEditor = (state: EditorApiState) => state.editors[0];

describe("editor-api open-file history", () => {
  it("falls back to the remaining tab after closing the active one", () => {
    const state = run(
      addEditedFile(file("A")),
      addEditedFile(file("B")),
      removeEditedFile("B")
    );
    expect(activeEditor(state).openFileId).toBe("A");
    expect(activeEditor(state).editedFiles.map((f) => f.id)).toEqual(["A"]);
  });

  // Regression: re-opening a tab after a previous close used to leave the fall
  // file absent from openFileHistory, so the *next* close blanked the editor
  // even though a tab remained. (openLastFromOpenFileHistory popped instead of
  // peeking.)
  it("still opens the remaining tab when a file is reopened between closes", () => {
    const state = run(
      addEditedFile(file("A")), //            tabs: A        active A
      addEditedFile(file("B")), //            tabs: A B      active B
      removeEditedFile("B"), //               tabs: A        active A
      addEditedFile(file("B")), //   reopen B tabs: A B      active B
      removeEditedFile("B") //                tabs: A        active A  (was blank)
    );
    expect(activeEditor(state).openFileId).toBe("A");
    expect(activeEditor(state).editedFiles.map((f) => f.id)).toEqual(["A"]);
  });

  it("clears the active file only when the last tab is closed", () => {
    const state = run(addEditedFile(file("A")), removeEditedFile("A"));
    expect(state.editors).toHaveLength(0);
  });

  // Regression: addOpenFileHistory had inverted branches, so re-activating the
  // already-active file kept pushing duplicates instead of deduping.
  it("does not push consecutive duplicates onto the history", () => {
    const state = run(
      addEditedFile(file("A")),
      addEditedFile(file("B")),
      setOpenFileId("B"),
      setOpenFileId("B")
    );
    expect(activeEditor(state).openFileHistory).toEqual(["A", "B"]);
  });
});

describe("editor-api open-editor (pane) history", () => {
  // Editor panes are keyed by `new Date().valueOf()`; force distinct, ordered
  // indices so a split pane isn't accidentally deduped with its sibling.
  beforeEach(() => {
    let clock = 1;
    vi.spyOn(Date.prototype, "valueOf").mockImplementation(() => clock++);
  });
  afterEach(() => vi.restoreAllMocks());

  // Regression (twin of the file-history bug): getValidIndex popped instead of
  // peeking, so the pane it fell back to was dropped from openEditorHistory. A
  // later pane close then had nothing to fall back to and activeEditorIdx went
  // undefined — a blank editor with a pane still open.
  it("still activates the remaining pane when one is reopened between closes", () => {
    let state = reducer(initialState, addEditedFile(file("A"))); // pane E1 [A]
    const e1 = state.editors[0].editorIdx;
    state = reducer(state, addEditedFileInOtherView(file("B"))); // pane E2 [B]
    state = reducer(state, removeEditedFile("B")); //              close B -> E1
    expect(state.activeEditorIdx).toBe(e1);

    state = reducer(state, addEditedFileInOtherView(file("B"))); // pane E3 [B]
    state = reducer(state, removeEditedFile("B")); //     close B -> E1 (blank?)
    expect(state.activeEditorIdx).toBe(e1);
    expect(state.editors.map((e) => e.editedFiles.map((f) => f.id))).toEqual([
      ["A"],
    ]);
  });
});
