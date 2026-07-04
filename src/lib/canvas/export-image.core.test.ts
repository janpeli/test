import { describe, expect, it } from "vitest";
import {
  getDiagramSize,
  injectBackground,
  pinSvgSize,
  prepareSvgString,
  stripCanvasExtension,
  WHITE,
} from "./export-image.core";

describe("getDiagramSize", () => {
  it("reads width/height from the viewBox", () => {
    const svg = `<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg"></svg>`;
    expect(getDiagramSize(svg)).toEqual({ width: 300, height: 150 });
  });

  it("accepts comma-separated viewBox values", () => {
    const svg = `<svg viewBox="0,0,120,80"></svg>`;
    expect(getDiagramSize(svg)).toEqual({ width: 120, height: 80 });
  });

  it("falls back to width/height attributes when there is no viewBox", () => {
    const svg = `<svg width="640" height="480"></svg>`;
    expect(getDiagramSize(svg)).toEqual({ width: 640, height: 480 });
  });

  it("falls back to width/height attributes when the viewBox is degenerate", () => {
    const svg = `<svg viewBox="0 0 0 0" width="640" height="480"></svg>`;
    expect(getDiagramSize(svg)).toEqual({ width: 640, height: 480 });
  });

  it("falls back to the 800x600 default when nothing is present", () => {
    const svg = `<svg></svg>`;
    expect(getDiagramSize(svg)).toEqual({ width: 800, height: 600 });
  });
});

describe("pinSvgSize", () => {
  it("replaces existing width/height attributes", () => {
    const svg = `<svg width="10" height="20" viewBox="0 0 10 20"><g/></svg>`;
    const out = pinSvgSize(svg, 300, 150);
    expect(out).toContain('width="300"');
    expect(out).toContain('height="150"');
    expect(out).not.toContain('width="10"');
    expect(out).not.toContain('height="20"');
  });

  it("adds width/height when the svg has none", () => {
    const svg = `<svg viewBox="0 0 10 20"><g/></svg>`;
    const out = pinSvgSize(svg, 300, 150);
    expect(out).toContain('<svg width="300" height="150"');
  });
});

describe("injectBackground", () => {
  it("inserts a full-bleed rect right after the opening svg tag", () => {
    const svg = `<svg width="10" height="20"><g/></svg>`;
    const out = injectBackground(svg, WHITE);
    expect(out).toBe(
      `<svg width="10" height="20"><rect width="100%" height="100%" fill="#ffffff"/><g/></svg>`
    );
  });
});

describe("prepareSvgString", () => {
  it("pins the intrinsic size but adds no background for transparent exports", () => {
    const svg = `<svg viewBox="0 0 100 50"><g/></svg>`;
    const out = prepareSvgString(svg, "transparent");
    expect(out).toContain('width="100"');
    expect(out).toContain('height="50"');
    expect(out).not.toContain("<rect");
  });

  it("pins the size and bakes in a white rect for white-background exports", () => {
    const svg = `<svg viewBox="0 0 100 50"><g/></svg>`;
    const out = prepareSvgString(svg, "white");
    expect(out).toContain('width="100"');
    expect(out).toContain('height="50"');
    expect(out).toContain(`fill="${WHITE}"`);
  });
});

describe("stripCanvasExtension", () => {
  it("strips the .can.md double extension", () => {
    expect(stripCanvasExtension("diagram.can.md")).toBe("diagram");
  });

  it("strips a plain .md/.markdown extension", () => {
    expect(stripCanvasExtension("notes.md")).toBe("notes");
    expect(stripCanvasExtension("notes.markdown")).toBe("notes");
  });

  it("leaves a name with no matching extension unchanged", () => {
    expect(stripCanvasExtension("diagram.txt")).toBe("diagram.txt");
  });

  it("is case-insensitive", () => {
    expect(stripCanvasExtension("Diagram.CAN.MD")).toBe("Diagram");
  });
});
