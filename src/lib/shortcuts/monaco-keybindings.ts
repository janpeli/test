import * as monaco from "monaco-editor";
import { parseChord } from "./shortcuts.core";
import { SHORTCUTS, runShortcutById } from "./registry";

const NAMED_KEYS: Record<string, number> = {
  enter: monaco.KeyCode.Enter,
  escape: monaco.KeyCode.Escape,
  space: monaco.KeyCode.Space,
  delete: monaco.KeyCode.Delete,
  backspace: monaco.KeyCode.Backspace,
  f1: monaco.KeyCode.F1,
  f2: monaco.KeyCode.F2,
  f3: monaco.KeyCode.F3,
  f4: monaco.KeyCode.F4,
};

function keyToKeyCode(key: string): number | null {
  if (key.length === 1) {
    if (key >= "a" && key <= "z")
      return monaco.KeyCode.KeyA + (key.charCodeAt(0) - "a".charCodeAt(0));
    if (key >= "0" && key <= "9")
      return monaco.KeyCode.Digit0 + (key.charCodeAt(0) - "0".charCodeAt(0));
  }
  return NAMED_KEYS[key] ?? null;
}

/** Translate a canonical chord to a Monaco keybinding number, or null. */
function chordToKeybinding(chord: string): number | null {
  const p = parseChord(chord);
  // Only register modifier chords inside Monaco — plain keys (Delete, F2, …)
  // must keep their normal editing behaviour while the editor has focus.
  if (!p.mod && !p.ctrl && !p.alt) return null;
  const code = keyToKeyCode(p.key);
  if (code == null) return null;
  let kb = 0;
  if (p.mod) kb |= monaco.KeyMod.CtrlCmd; // ⌘ on macOS, Ctrl elsewhere
  if (p.ctrl) kb |= monaco.KeyMod.WinCtrl;
  if (p.alt) kb |= monaco.KeyMod.Alt;
  if (p.shift) kb |= monaco.KeyMod.Shift;
  return kb | code;
}

/**
 * Register all modifier shortcuts inside a Monaco editor instance so they fire
 * even while the editor has focus (Monaco otherwise swallows them). The window
 * listener handles the same shortcuts everywhere else; it deliberately ignores
 * modifier chords originating inside Monaco to avoid double execution.
 */
export function registerMonacoShortcuts(
  editor: monaco.editor.IStandaloneCodeEditor
): void {
  for (const s of SHORTCUTS) {
    const kb = chordToKeybinding(s.chord);
    if (kb == null) continue;
    editor.addCommand(kb, () => runShortcutById(s.id));
  }
}
