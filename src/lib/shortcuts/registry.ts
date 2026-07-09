import { store } from "@/app/store";
import type { RootState } from "@/app/store";
import { normalizeChord } from "./shortcuts.core";

import {
  saveEditedFile,
  requestCloseFile,
  setActiveFile,
  undoForm,
  redoForm,
} from "@/API/editor-api/editor-api";
import {
  selectCanUndoActiveForm,
  selectCanRedoActiveForm,
} from "@/API/editor-api/editor-api.selectors";
import { openProject, closeProject } from "@/API/project-api/project-api";
import { toggleStatusPanel } from "@/API/GUI-api/status-panel-api";
import { setActiveMenu } from "@/API/GUI-api/main-sidebar.slice";
import {
  openRenameModal,
  openDeleteModal,
  openCreateProjectModal,
} from "@/API/GUI-api/modal-api";
import { toggleCommandPalette } from "@/API/GUI-api/command-palette.slice";

export type ShortcutGroup = "File" | "View" | "Editor" | "Project";

export interface ShortcutDef {
  /** Stable id, e.g. "file.save". */
  id: string;
  /** Canonical chord ("mod+s"); `mod` is ⌘ on macOS, Ctrl elsewhere. */
  chord: string;
  /** Label shown in the command palette and menus. */
  label: string;
  group: ShortcutGroup;
  /** When present, the shortcut is only active if this returns true. */
  when?: (state: RootState) => boolean;
  /** The effect — calls the existing imperative api functions. */
  run: () => void;
  /**
   * When true, the chord is not registered inside Monaco, so the editor keeps its
   * native binding while focused (e.g. undo/redo: Monaco handles SOURCE text undo
   * natively; the window listener fires this elsewhere).
   */
  skipMonaco?: boolean;
}

/** Id of the file open in the currently-active editor pane, if any. */
function activeFileId(state: RootState): string | undefined {
  const idx = state.editorAPI.activeEditorIdx;
  return state.editorAPI.editors.find((e) => e.editorIdx === idx)?.openFileId;
}

/** Id of the file at tab position `n` (1-based) in the active editor. */
function fileIdAtTab(state: RootState, n: number): string | undefined {
  const idx = state.editorAPI.activeEditorIdx;
  const editor = state.editorAPI.editors.find((e) => e.editorIdx === idx);
  return editor?.editedFiles[n - 1]?.id;
}

const hasActiveFile = (s: RootState) => activeFileId(s) !== undefined;
const hasSelectedNode = (s: RootState) =>
  s.activeContext.idProjectNode !== undefined;

const baseShortcuts: ShortcutDef[] = [
  {
    id: "view.commandPalette",
    chord: "mod+k",
    label: "Command Palette",
    group: "View",
    run: () => store.dispatch(toggleCommandPalette()),
  },
  {
    id: "file.save",
    chord: "mod+s",
    label: "Save File",
    group: "File",
    when: hasActiveFile,
    run: () => {
      const id = activeFileId(store.getState());
      if (id) saveEditedFile(id);
    },
  },
  {
    id: "file.close",
    chord: "mod+w",
    label: "Close File",
    group: "File",
    when: hasActiveFile,
    run: () => {
      const id = activeFileId(store.getState());
      if (id) requestCloseFile(id);
    },
  },
  {
    id: "project.open",
    chord: "mod+o",
    label: "Open Project",
    group: "Project",
    when: (s) => !s.projectAPI.folderPath,
    run: () => openProject(),
  },
  {
    id: "project.new",
    chord: "mod+shift+n",
    label: "New Project",
    group: "Project",
    when: (s) => !s.projectAPI.folderPath,
    run: () => openCreateProjectModal(),
  },
  {
    id: "project.close",
    chord: "mod+shift+w",
    label: "Close Project",
    group: "Project",
    when: (s) => !!s.projectAPI.folderPath,
    run: () => closeProject(),
  },
  {
    id: "view.sidebar",
    chord: "mod+b",
    label: "Toggle Sidebar",
    group: "View",
    run: () => {
      const visible = store.getState().mainSidebar.activeMenu !== "off";
      store.dispatch(setActiveMenu(visible ? "off" : "Explorer"));
    },
  },
  {
    id: "view.statusPanel",
    chord: "mod+j",
    label: "Toggle Status Panel",
    group: "View",
    run: () => toggleStatusPanel(),
  },
  {
    id: "editor.undo",
    chord: "mod+z",
    label: "Undo (Form)",
    group: "Editor",
    skipMonaco: true,
    when: selectCanUndoActiveForm,
    run: () => {
      const id = activeFileId(store.getState());
      if (id) undoForm(id);
    },
  },
  {
    id: "editor.redo",
    chord: "mod+shift+z",
    label: "Redo (Form)",
    group: "Editor",
    skipMonaco: true,
    when: selectCanRedoActiveForm,
    run: () => {
      const id = activeFileId(store.getState());
      if (id) redoForm(id);
    },
  },
  {
    id: "file.rename",
    chord: "f2",
    label: "Rename",
    group: "File",
    when: hasSelectedNode,
    run: () => {
      const id = store.getState().activeContext.idProjectNode;
      if (id) openRenameModal(id);
    },
  },
  {
    id: "file.delete",
    chord: "delete",
    label: "Delete",
    group: "File",
    when: hasSelectedNode,
    run: () => {
      const id = store.getState().activeContext.idProjectNode;
      if (id) openDeleteModal(id);
    },
  },
];

// Tab switching: mod+1 … mod+9 select the Nth open file in the active editor.
const tabShortcuts: ShortcutDef[] = Array.from({ length: 9 }, (_, i) => {
  const n = i + 1;
  return {
    id: `editor.tab${n}`,
    chord: `mod+${n}`,
    label: `Go to Tab ${n}`,
    group: "Editor",
    when: (s) => fileIdAtTab(s, n) !== undefined,
    run: () => {
      const id = fileIdAtTab(store.getState(), n);
      if (id) setActiveFile(id);
    },
  };
});

/** All registered shortcuts. Chords are stored canonicalised. */
export const SHORTCUTS: ShortcutDef[] = [...baseShortcuts, ...tabShortcuts].map(
  (s) => ({ ...s, chord: normalizeChord(s.chord) })
);

const byId = new Map(SHORTCUTS.map((s) => [s.id, s]));

/** Look up a shortcut by id. */
export function getShortcut(id: string): ShortcutDef | undefined {
  return byId.get(id);
}

/** Run a shortcut by id, respecting its `when` guard. Used by Monaco too. */
export function runShortcutById(id: string): void {
  const def = byId.get(id);
  if (!def) return;
  if (def.when && !def.when(store.getState())) return;
  def.run();
}
