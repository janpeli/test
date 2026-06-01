import { useEffect } from "react";
import { store } from "@/app/store";
import { eventToChord, parseChord } from "./shortcuts.core";
import { SHORTCUTS } from "./registry";

export { runShortcutById } from "./registry";

/** True on macOS — decides whether `mod` maps to ⌘ or Ctrl, and label glyphs. */
export const isMac =
  typeof navigator !== "undefined" &&
  /mac/i.test(navigator.platform || navigator.userAgent || "");

/** Whether keystrokes typed here should be left alone (text entry). */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return isMonacoTarget(target);
}

/** Whether the event originates inside a Monaco editor instance. */
function isMonacoTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement && target.closest(".monaco-editor") !== null
  );
}

/**
 * Mounts a single window-level keydown listener that dispatches registered
 * shortcuts to their `run` handlers. Editor-focused (Monaco) shortcuts with a
 * modifier are also registered inside Monaco; this handler covers everywhere
 * else. Read store state fresh on each event, so no React deps are needed.
 */
export function useGlobalShortcuts(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const chord = eventToChord(e, isMac);
      const parts = parseChord(chord);
      const hasModifier = parts.mod || parts.ctrl || parts.alt;

      // Don't hijack plain keystrokes (no modifier) while the user is typing.
      if (!hasModifier && isEditableTarget(e.target)) return;
      // Modifier chords inside Monaco are handled by Monaco's own keybindings
      // (registered via registerMonacoShortcuts) — skip here to avoid firing twice.
      if (hasModifier && isMonacoTarget(e.target)) return;

      const match = SHORTCUTS.find((s) => s.chord === chord);
      if (!match) return;
      if (match.when && !match.when(store.getState())) return;

      e.preventDefault();
      e.stopPropagation();
      match.run();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
