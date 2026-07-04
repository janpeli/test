import { describe, expect, it } from "vitest";
import {
  chordsMatch,
  eventToChord,
  formatChord,
  normalizeChord,
  normalizeKey,
  parseChord,
} from "./shortcuts.core";

describe("normalizeKey", () => {
  it("lower-cases and folds known aliases to stable names", () => {
    expect(normalizeKey(" ")).toBe("space");
    expect(normalizeKey("Spacebar")).toBe("space");
    expect(normalizeKey("Esc")).toBe("escape");
    expect(normalizeKey("Del")).toBe("delete");
    expect(normalizeKey("Z")).toBe("z");
  });
});

describe("parseChord / normalizeChord", () => {
  it("parses modifier aliases and orders tokens mod, ctrl, alt, shift, key", () => {
    expect(normalizeChord("Shift+Cmd+Z")).toBe("mod+shift+z");
    expect(normalizeChord("Control+Alt+Delete")).toBe("ctrl+alt+delete");
    expect(normalizeChord("option+s")).toBe("alt+s");
  });

  it("is idempotent on an already-canonical chord", () => {
    expect(normalizeChord("mod+shift+z")).toBe("mod+shift+z");
  });
});

describe("eventToChord", () => {
  it("maps metaKey to mod on macOS", () => {
    const chord = eventToChord(
      { key: "s", metaKey: true, ctrlKey: false, altKey: false, shiftKey: false },
      true
    );
    expect(chord).toBe("mod+s");
  });

  it("maps ctrlKey to mod off macOS", () => {
    const chord = eventToChord(
      { key: "s", metaKey: false, ctrlKey: true, altKey: false, shiftKey: false },
      false
    );
    expect(chord).toBe("mod+s");
  });

  it("keeps a distinct Control on macOS separate from mod", () => {
    const chord = eventToChord(
      { key: "s", metaKey: true, ctrlKey: true, altKey: false, shiftKey: false },
      true
    );
    expect(chord).toBe("mod+ctrl+s");
  });
});

describe("chordsMatch", () => {
  it("treats differently-written equivalent chords as matching", () => {
    expect(chordsMatch("Cmd+Shift+Z", "mod+shift+z")).toBe(true);
    expect(chordsMatch("mod+z", "mod+shift+z")).toBe(false);
  });
});

describe("formatChord", () => {
  it("renders mac-style symbol labels", () => {
    expect(formatChord("mod+shift+z", true)).toBe("⇧⌘Z");
  });

  it("renders Windows/Linux-style text labels", () => {
    expect(formatChord("mod+shift+z", false)).toBe("Ctrl+Shift+Z");
  });

  it("uses named labels for special keys", () => {
    expect(formatChord("delete", false)).toBe("Del");
    expect(formatChord("mod+arrowup", false)).toBe("Ctrl+↑");
  });

  it("still parses a chord with an unrecognized/garbage token", () => {
    expect(parseChord("mod+bogus+z").key).toBe("z");
  });
});
