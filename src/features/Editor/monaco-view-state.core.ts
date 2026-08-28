import type * as monaco from "monaco-editor";

/**
 * Shared per-key Monaco view-state persistence (scroll, cursor, folding,
 * find-widget state) used by monaco-editor.tsx and product-editor.tsx.
 *
 * Why it exists: ContentEditor keeps hidden panes mounted at width 0
 * (content-editor.tsx) and Monaco's automaticLayout re-wraps at zero size,
 * mangling the scroll state. By the time a React effect runs after a tab
 * switch, the pane may already be collapsed — too late to save. So the
 * manager snapshots eagerly (debounced) while the pane is visible, never
 * lets a hidden-editor snapshot overwrite a good one, and re-restores when
 * the pane comes back from hidden (0×0 → real size).
 *
 * Dependency-free (`monaco-editor` is a type-only import) so it can be unit
 * tested with a stub editor — see monaco-view-state.core.test.ts.
 */

type Disposable = { dispose(): void };

/**
 * Minimal structural surface of IStandaloneCodeEditor used by the manager,
 * so tests can stub it without the monaco runtime. A real editor instance
 * satisfies it as-is.
 */
export interface ViewStateEditor {
  getLayoutInfo(): { width: number; height: number };
  saveViewState(): monaco.editor.ICodeEditorViewState | null;
  restoreViewState(state: monaco.editor.ICodeEditorViewState): void;
  onDidScrollChange(listener: () => void): Disposable;
  onDidChangeCursorPosition(listener: () => void): Disposable;
  onDidChangeHiddenAreas(listener: () => void): Disposable;
  onDidLayoutChange(
    listener: (layout: { width: number; height: number }) => void
  ): Disposable;
}

/** Settle window after a restore during which eager saves are suppressed. */
export const RESTORE_SETTLE_MS = 100;
/**
 * Trailing debounce for eager saves. Serializing the full view state
 * (folding regions, find widget, …) on every scroll frame would be needless
 * churn; a snapshot at most this stale is fine for the hide/show case.
 */
export const SAVE_DEBOUNCE_MS = 100;

export class MonacoViewStateManager {
  private viewStates = new Map<
    string,
    monaco.editor.ICodeEditorViewState | null
  >();
  private editor: ViewStateEditor | null = null;
  private getCurrentId: () => string | undefined = () => undefined;
  private isRestoring = false;
  private lastLayout = { width: 0, height: 0 };
  private disposables: Disposable[] = [];
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private restoreTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Install eager listeners on a freshly created editor. `getCurrentId`
   * returns the key the visible content belongs to (file id, product key…);
   * `undefined` means nothing is shown and disables snapshotting.
   */
  attach(editor: ViewStateEditor, getCurrentId: () => string | undefined) {
    this.editor = editor;
    this.getCurrentId = getCurrentId;
    const { width, height } = editor.getLayoutInfo();
    this.lastLayout = { width, height };

    // Snapshot eagerly (debounced) while the pane is visible: hidden-areas
    // covers folding, which changes without a scroll/cursor event.
    const scheduleSave = () => {
      const id = this.getCurrentId();
      if (id) this.scheduleSave(id);
    };
    this.disposables = [
      editor.onDidScrollChange(scheduleSave),
      editor.onDidChangeCursorPosition(scheduleSave),
      editor.onDidChangeHiddenAreas(scheduleSave),
      // Re-restore when the pane comes back from hidden (0×0 → real size),
      // which also covers hide/show of the same key where no switch fires.
      editor.onDidLayoutChange((layout) => {
        const wasHidden =
          this.lastLayout.width === 0 || this.lastLayout.height === 0;
        this.lastLayout = { width: layout.width, height: layout.height };
        const id = this.getCurrentId();
        if (wasHidden && layout.width > 0 && layout.height > 0 && id) {
          this.restore(id);
        }
      }),
    ];
  }

  /**
   * Final immediate save (skipped if hidden — the eager snapshot stands),
   * then remove listeners and timers. Call before disposing the editor.
   */
  detach() {
    const id = this.getCurrentId();
    if (id) this.save(id);
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    if (this.restoreTimer !== null) clearTimeout(this.restoreTimer);
    this.restoreTimer = null;
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.editor = null;
  }

  /** Immediately snapshot the current view state under `id`. */
  save(id: string) {
    const editor = this.editor;
    if (!editor || this.isRestoring) return;
    // Never let a hidden-editor (zero-size, re-wrapped) snapshot overwrite
    // a good one.
    const { width, height } = editor.getLayoutInfo();
    if (width === 0 || height === 0) return;
    this.viewStates.set(id, editor.saveViewState());
  }

  /** Restore the snapshot for `id`, if one exists and the pane has size. */
  restore(id: string) {
    const editor = this.editor;
    const viewState = this.viewStates.get(id);
    if (!editor || !viewState) return;
    // Restoring into a zero-size editor clamps the scroll away; the layout
    // listener re-restores once the pane has real size.
    const { width, height } = editor.getLayoutInfo();
    if (width === 0 || height === 0) return;
    // A pending eager save predates the restore — drop it so it can't
    // overwrite the snapshot we are about to apply.
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    this.isRestoring = true;
    editor.restoreViewState(viewState);
    // Suppress the scroll/cursor events the restore itself fires; reset
    // after a short settle window.
    if (this.restoreTimer !== null) clearTimeout(this.restoreTimer);
    this.restoreTimer = setTimeout(() => {
      this.isRestoring = false;
      this.restoreTimer = null;
    }, RESTORE_SETTLE_MS);
  }

  private scheduleSave(id: string) {
    // Events fired inside the restore settle window are the restore's own
    // echoes — recording them would be redundant at best.
    if (this.isRestoring) return;
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      // The shown content may have switched since this was scheduled —
      // never save the new content's state under the old key.
      if (this.getCurrentId() === id) this.save(id);
    }, SAVE_DEBOUNCE_MS);
  }
}
