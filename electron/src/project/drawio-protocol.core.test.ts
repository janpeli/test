import { describe, it, expect } from "vitest";
import path from "node:path";
import {
  getDrawioMimeType,
  resolveDrawioPath,
} from "./drawio-protocol.core";

const ROOT = path.resolve("/srv/drawio-webapp");
const inRoot = (...parts: string[]) => path.join(ROOT, ...parts);

describe("resolveDrawioPath", () => {
  it("maps a plain pathname into the root", () => {
    expect(resolveDrawioPath("/js/app.min.js", ROOT)).toBe(
      inRoot("js", "app.min.js")
    );
  });

  it("serves index.html for an empty pathname", () => {
    expect(resolveDrawioPath("", ROOT)).toBe(inRoot("index.html"));
    expect(resolveDrawioPath("/", ROOT)).toBe(inRoot("index.html"));
  });

  it("decodes percent-encoded segments", () => {
    expect(resolveDrawioPath("/img/my%20icon.png", ROOT)).toBe(
      inRoot("img", "my icon.png")
    );
  });

  it("rejects traversal outside the root", () => {
    expect(resolveDrawioPath("/../secret.txt", ROOT)).toBeNull();
    expect(resolveDrawioPath("/js/../../secret.txt", ROOT)).toBeNull();
    expect(resolveDrawioPath("/%2e%2e/secret.txt", ROOT)).toBeNull();
  });

  it("rejects malformed encoding and null bytes", () => {
    expect(resolveDrawioPath("/%zz", ROOT)).toBeNull();
    expect(resolveDrawioPath("/a%00.html", ROOT)).toBeNull();
  });

  it("allows dot segments that stay inside the root", () => {
    expect(resolveDrawioPath("/js/../styles/grapheditor.css", ROOT)).toBe(
      inRoot("styles", "grapheditor.css")
    );
  });
});

describe("getDrawioMimeType", () => {
  it("maps known extensions", () => {
    expect(getDrawioMimeType("index.html")).toBe("text/html");
    expect(getDrawioMimeType("js/app.min.js")).toBe("text/javascript");
    expect(getDrawioMimeType("styles/a.CSS")).toBe("text/css");
    expect(getDrawioMimeType("resources/dia.txt")).toBe("text/plain");
    expect(getDrawioMimeType("stencils/basic.xml")).toBe("application/xml");
  });

  it("falls back to octet-stream", () => {
    expect(getDrawioMimeType("favicon.weird")).toBe(
      "application/octet-stream"
    );
  });
});
