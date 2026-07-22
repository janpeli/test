import { describe, expect, it } from "vitest";
import { isCanvasFile } from "./is-canvas-file.core";

describe("isCanvasFile", () => {
  it("detects .mmd by sufix", () => {
    expect(isCanvasFile("diagram", "mmd")).toBe(true);
  });

  it("detects .mermaid by sufix", () => {
    expect(isCanvasFile("diagram", "mermaid")).toBe(true);
  });

  it("is case-insensitive on sufix", () => {
    expect(isCanvasFile("diagram", "MMD")).toBe(true);
  });

  it("detects .can.md via the truncated display name", () => {
    expect(isCanvasFile("diagram.can", "md")).toBe(true);
  });

  it("detects .can.md via the untruncated basename", () => {
    expect(isCanvasFile("diagram.can.md", "md")).toBe(true);
  });

  it("is case-insensitive on name", () => {
    expect(isCanvasFile("Diagram.CAN.MD", "md")).toBe(true);
    expect(isCanvasFile("Diagram.CAN", "md")).toBe(true);
  });

  it("returns false for a plain markdown file", () => {
    expect(isCanvasFile("notes", "md")).toBe(false);
    expect(isCanvasFile("notes.md", "md")).toBe(false);
  });

  it("returns false for an unrelated file", () => {
    expect(isCanvasFile("table", "sql")).toBe(false);
  });
});
