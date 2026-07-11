import { describe, expect, it, vi } from "vitest";
import { parseFrontmatter } from "./frontmatter.core";

describe("parseFrontmatter", () => {
  it("extracts a valid frontmatter block and returns the body", () => {
    const content = "---\ntitle: My Document\ntags: [a, b]\n---\n# Heading\n\nBody.";
    const { data, body } = parseFrontmatter(content);
    expect(data).toEqual({ title: "My Document", tags: ["a", "b"] });
    expect(body).toBe("# Heading\n\nBody.");
  });

  it("returns null data and the whole content when there is no frontmatter", () => {
    const content = "# Just a heading\n\nSome text.";
    expect(parseFrontmatter(content)).toEqual({ data: null, body: content });
  });

  it("falls back to no frontmatter on malformed YAML", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const content = "---\ntitle: : bad: yaml:\n  - broken\n---\nBody.";
    const { data, body } = parseFrontmatter(content);
    expect(data).toBeNull();
    expect(body).toBe(content);
    warn.mockRestore();
  });

  it("handles CRLF line endings", () => {
    const content = "---\r\ntitle: Win\r\n---\r\nBody line.";
    const { data, body } = parseFrontmatter(content);
    expect(data).toEqual({ title: "Win" });
    expect(body).toBe("Body line.");
  });

  it("treats an empty block as no frontmatter", () => {
    const content = "---\n---\n# Heading";
    const { data, body } = parseFrontmatter(content);
    expect(data).toBeNull();
    expect(body).toBe(content);
  });

  it("does not treat a mid-document --- as frontmatter", () => {
    const content = "# Heading\n\n---\n\nSection two.";
    expect(parseFrontmatter(content)).toEqual({ data: null, body: content });
  });

  it("accepts `...` as a closing fence", () => {
    const content = "---\ntitle: Dots\n...\nBody after dots.";
    const { data, body } = parseFrontmatter(content);
    expect(data).toEqual({ title: "Dots" });
    expect(body).toBe("Body after dots.");
  });

  it("rejects a block whose YAML parses to a non-object (scalar)", () => {
    const content = "---\njust a string\n---\nBody.";
    const { data, body } = parseFrontmatter(content);
    expect(data).toBeNull();
    expect(body).toBe(content);
  });

  it("returns an empty body when the file is only a frontmatter block", () => {
    const content = "---\ntitle: Only\n---\n";
    const { data, body } = parseFrontmatter(content);
    expect(data).toEqual({ title: "Only" });
    expect(body).toBe("");
  });
});
