import { store } from "@/app/store";
import { setEditorFontSize as setEditorFontSizeReducer } from "./editor-font-size.slice";

const STORAGE_KEY = "vite-editor-font-size";

export const MIN_EDITOR_FONT_SIZE = 10;
export const MAX_EDITOR_FONT_SIZE = 24;
export const EDITOR_FONT_SIZE_STEP = 1;
const DEFAULT_EDITOR_FONT_SIZE = 14;

function clamp(size: number): number {
  return Math.min(MAX_EDITOR_FONT_SIZE, Math.max(MIN_EDITOR_FONT_SIZE, size));
}

export function getEditorFontSizeFromStorage(): number {
  const storage = Number(localStorage.getItem(STORAGE_KEY));
  return storage && !Number.isNaN(storage)
    ? clamp(storage)
    : DEFAULT_EDITOR_FONT_SIZE;
}

export function setEditorFontSize(size: number) {
  const clamped = clamp(size);
  localStorage.setItem(STORAGE_KEY, String(clamped));
  store.dispatch(setEditorFontSizeReducer(clamped));
}

export function increaseEditorFontSize() {
  const current = store.getState().editorFontSizeAPI.fontSize;
  setEditorFontSize(current + EDITOR_FONT_SIZE_STEP);
}

export function decreaseEditorFontSize() {
  const current = store.getState().editorFontSizeAPI.fontSize;
  setEditorFontSize(current - EDITOR_FONT_SIZE_STEP);
}

export function resetEditorFontSize() {
  setEditorFontSize(DEFAULT_EDITOR_FONT_SIZE);
}
