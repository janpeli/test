// Pure keyboard-shortcut helpers — no app/store/Electron/Monaco imports so this
// module can be unit-tested in isolation (see CLAUDE.md "*.core.ts" convention).
//
// A "chord" is a canonical string like "mod+shift+z" where:
//   mod   = the platform command key (⌘ on macOS, Ctrl elsewhere)
//   ctrl  = an explicit Control key (rare; only when distinct from mod)
//   alt   = Alt / Option
//   shift = Shift
//   key   = a normalized, lower-cased key name ("s", "1", "f2", "delete", …)
//
// The token order in the canonical form is always: mod, ctrl, alt, shift, key.

export interface ChordParts {
  mod: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  key: string;
}

/** Lower-case a KeyboardEvent.key and fold a few aliases to stable names. */
export function normalizeKey(key: string): string {
  const k = key.toLowerCase();
  switch (k) {
    case " ":
    case "spacebar":
      return "space";
    case "esc":
      return "escape";
    case "del":
      return "delete";
    default:
      return k;
  }
}

/** Parse a chord string (canonical or loosely written) into its parts. */
export function parseChord(chord: string): ChordParts {
  const parts: ChordParts = {
    mod: false,
    ctrl: false,
    alt: false,
    shift: false,
    key: "",
  };
  for (const rawToken of chord.split("+")) {
    const token = rawToken.trim().toLowerCase();
    if (!token) continue;
    switch (token) {
      case "mod":
      case "cmd":
      case "meta":
        parts.mod = true;
        break;
      case "ctrl":
      case "control":
        parts.ctrl = true;
        break;
      case "alt":
      case "option":
      case "opt":
        parts.alt = true;
        break;
      case "shift":
        parts.shift = true;
        break;
      default:
        parts.key = normalizeKey(token);
    }
  }
  return parts;
}

/** Build the canonical chord string from parts. */
export function partsToChord(parts: ChordParts): string {
  const tokens: string[] = [];
  if (parts.mod) tokens.push("mod");
  if (parts.ctrl) tokens.push("ctrl");
  if (parts.alt) tokens.push("alt");
  if (parts.shift) tokens.push("shift");
  if (parts.key) tokens.push(parts.key);
  return tokens.join("+");
}

/** Canonicalise a loosely-written chord ("Cmd+S" → "mod+s"). */
export function normalizeChord(chord: string): string {
  return partsToChord(parseChord(chord));
}

/** Minimal subset of KeyboardEvent this module reads. */
export interface KeyboardEventLike {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

/** Build the canonical chord for a keyboard event on a given platform. */
export function eventToChord(e: KeyboardEventLike, isMac: boolean): string {
  return partsToChord({
    // On macOS the command key is ⌘ (meta); elsewhere it is Ctrl.
    mod: isMac ? e.metaKey : e.ctrlKey,
    // A distinct Control press only matters on macOS (Ctrl ≠ ⌘ there).
    ctrl: isMac ? e.ctrlKey : false,
    alt: e.altKey,
    shift: e.shiftKey,
    key: normalizeKey(e.key),
  });
}

/** Whether two chords are the same, regardless of how each was written. */
export function chordsMatch(a: string, b: string): boolean {
  return normalizeChord(a) === normalizeChord(b);
}

const KEY_LABELS: Record<string, string> = {
  delete: "Del",
  escape: "Esc",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
  space: "Space",
  enter: "Enter",
  backspace: "⌫",
};

function formatKey(key: string): string {
  if (!key) return "";
  if (KEY_LABELS[key]) return KEY_LABELS[key];
  if (key.length === 1) return key.toUpperCase();
  // f2 → F2, pageup → Pageup, etc.
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** Human-readable label for a chord (⌘⇧Z on mac, "Ctrl+Shift+Z" elsewhere). */
export function formatChord(chord: string, isMac: boolean): string {
  const parts = parseChord(chord);
  if (isMac) {
    let out = "";
    if (parts.ctrl) out += "⌃";
    if (parts.alt) out += "⌥";
    if (parts.shift) out += "⇧";
    if (parts.mod) out += "⌘";
    return out + formatKey(parts.key);
  }
  const segs: string[] = [];
  if (parts.mod) segs.push("Ctrl");
  if (parts.ctrl) segs.push("Ctrl");
  if (parts.alt) segs.push("Alt");
  if (parts.shift) segs.push("Shift");
  if (parts.key) segs.push(formatKey(parts.key));
  return segs.join("+");
}
