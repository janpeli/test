// Persisted pan/zoom per canvas file id. The CanvasEditor component stays
// mounted across tab switches (only the selected file changes), so storing the
// view here lets it survive switching away and back. Entries are cleared when
// the file's tab is closed (see `closeFile` in editor-api.ts).

export type CanvasView = { scale: number; x: number; y: number };

const store = new Map<string, CanvasView>();

export const getCanvasView = (fileId: string): CanvasView | undefined =>
  store.get(fileId);

export const setCanvasView = (fileId: string, view: CanvasView): void => {
  store.set(fileId, view);
};

export const clearCanvasView = (fileId: string): void => {
  store.delete(fileId);
};
