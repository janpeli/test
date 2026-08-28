import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as monaco from "monaco-editor";
import {
  MonacoViewStateManager,
  RESTORE_SETTLE_MS,
  SAVE_DEBOUNCE_MS,
  type ViewStateEditor,
} from "./monaco-view-state.core";

type Listener = () => void;
type LayoutListener = (layout: { width: number; height: number }) => void;

/** Stub editor: controllable size, recorded save/restore calls, manual event firing. */
function makeStubEditor() {
  const scroll: Listener[] = [];
  const cursor: Listener[] = [];
  const hidden: Listener[] = [];
  const layout: LayoutListener[] = [];
  let disposed = 0;
  const state = {
    width: 800,
    height: 600,
    // Identity of the snapshot saveViewState() returns next.
    nextViewState: { tag: "s1" } as unknown as monaco.editor.ICodeEditorViewState,
    saveCalls: 0,
    restored: [] as monaco.editor.ICodeEditorViewState[],
  };
  const sub = (arr: unknown[]) => (l: unknown) => {
    arr.push(l);
    return {
      dispose: () => {
        disposed += 1;
      },
    };
  };
  const editor: ViewStateEditor = {
    getLayoutInfo: () => ({ width: state.width, height: state.height }),
    saveViewState: () => {
      state.saveCalls += 1;
      return state.nextViewState;
    },
    restoreViewState: (s) => {
      state.restored.push(s);
    },
    onDidScrollChange: sub(scroll),
    onDidChangeCursorPosition: sub(cursor),
    onDidChangeHiddenAreas: sub(hidden),
    onDidLayoutChange: sub(layout),
  };
  return {
    editor,
    state,
    fireScroll: () => scroll.forEach((l) => l()),
    fireCursor: () => cursor.forEach((l) => l()),
    fireHiddenAreas: () => hidden.forEach((l) => l()),
    fireLayout: (width: number, height: number) => {
      state.width = width;
      state.height = height;
      layout.forEach((l) => l({ width, height }));
    },
    get disposedCount() {
      return disposed;
    },
  };
}

describe("MonacoViewStateManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(currentId: string | undefined = "a") {
    const stub = makeStubEditor();
    const manager = new MonacoViewStateManager();
    const idRef = { current: currentId };
    manager.attach(stub.editor, () => idRef.current);
    return { stub, manager, idRef };
  }

  it("saves and restores a snapshot for a key", () => {
    const { stub, manager } = setup();
    manager.save("a");
    expect(stub.state.saveCalls).toBe(1);
    manager.restore("a");
    expect(stub.state.restored).toEqual([stub.state.nextViewState]);
  });

  it("never saves while the editor is zero-size", () => {
    const { stub, manager } = setup();
    stub.state.width = 0;
    manager.save("a");
    expect(stub.state.saveCalls).toBe(0);
    stub.state.width = 800;
    stub.state.height = 0;
    manager.save("a");
    expect(stub.state.saveCalls).toBe(0);
  });

  it("does not restore into a zero-size editor and does not restore without a snapshot", () => {
    const { stub, manager } = setup();
    manager.restore("a"); // no snapshot yet
    expect(stub.state.restored).toEqual([]);
    manager.save("a");
    stub.state.width = 0;
    manager.restore("a");
    expect(stub.state.restored).toEqual([]);
  });

  it("debounces eager scroll/cursor/hidden-area events into one trailing save", () => {
    const { stub, manager } = setup();
    stub.fireScroll();
    stub.fireCursor();
    stub.fireHiddenAreas();
    expect(stub.state.saveCalls).toBe(0);
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS);
    expect(stub.state.saveCalls).toBe(1);
    manager.restore("a");
    expect(stub.state.restored).toEqual([stub.state.nextViewState]);
  });

  it("drops a pending eager save when the current key changes before it fires", () => {
    const { stub, idRef } = setup("a");
    stub.fireScroll();
    idRef.current = "b"; // switched before the debounce elapsed
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS);
    expect(stub.state.saveCalls).toBe(0);
  });

  it("skips the eager save while hidden so a good snapshot survives", () => {
    const { stub, manager } = setup();
    manager.save("a");
    const good = stub.state.nextViewState;
    // Pane collapses; automaticLayout still fires events at zero size.
    stub.state.nextViewState = {
      tag: "mangled",
    } as unknown as monaco.editor.ICodeEditorViewState;
    stub.fireLayout(0, 600);
    stub.fireScroll();
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS);
    stub.fireLayout(800, 600);
    expect(stub.state.restored).toEqual([good]);
  });

  it("restores the current key when the pane comes back from hidden", () => {
    const { stub, manager } = setup();
    manager.save("a");
    stub.fireLayout(0, 600);
    expect(stub.state.restored).toEqual([]);
    stub.fireLayout(800, 600);
    expect(stub.state.restored).toEqual([stub.state.nextViewState]);
  });

  it("does not restore on a sized-to-sized layout change", () => {
    const { stub, manager } = setup();
    manager.save("a");
    stub.fireLayout(640, 600);
    expect(stub.state.restored).toEqual([]);
  });

  it("suppresses eager saves during the restore settle window, then allows them", () => {
    const { stub, manager } = setup();
    manager.save("a");
    manager.restore("a");
    // Events fired by the restore itself must not overwrite the snapshot.
    stub.fireScroll();
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS);
    expect(stub.state.saveCalls).toBe(1); // only the explicit save above
    vi.advanceTimersByTime(RESTORE_SETTLE_MS);
    stub.fireScroll();
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS);
    expect(stub.state.saveCalls).toBe(2);
  });

  it("cancels a pending pre-restore eager save so it cannot clobber the restored state", () => {
    const { stub, manager } = setup();
    manager.save("a");
    stub.fireScroll(); // pending save scheduled…
    manager.restore("a"); // …restore lands first
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS + RESTORE_SETTLE_MS);
    expect(stub.state.saveCalls).toBe(1); // pending save was dropped
  });

  it("detach performs a final save, clears timers, and disposes listeners", () => {
    const { stub, manager } = setup();
    stub.fireScroll();
    manager.detach();
    expect(stub.state.saveCalls).toBe(1); // immediate final save
    expect(stub.disposedCount).toBe(4);
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS + RESTORE_SETTLE_MS);
    expect(stub.state.saveCalls).toBe(1); // pending debounce was cancelled
  });

  it("detach skips the final save while hidden, keeping the eager snapshot", () => {
    const { stub, manager } = setup();
    stub.fireScroll();
    vi.advanceTimersByTime(SAVE_DEBOUNCE_MS);
    expect(stub.state.saveCalls).toBe(1);
    stub.state.width = 0;
    manager.detach();
    expect(stub.state.saveCalls).toBe(1); // zero-size final save skipped
  });
});
