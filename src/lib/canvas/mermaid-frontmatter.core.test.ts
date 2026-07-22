import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { applyMermaidConfig, parseMermaidSource } from "./mermaid-frontmatter.core";

describe("parseMermaidSource", () => {
  it("returns an empty config and the source unchanged when there is no frontmatter", () => {
    const source = "erDiagram\n  A ||--o{ B : has\n";
    expect(parseMermaidSource(source)).toEqual({ config: {}, body: source });
  });

  it("extracts the config block and strips it from the body", () => {
    const source = "---\nconfig:\n  layout: elk\n  theme: forest\n---\nerDiagram\n  A ||--o{ B : has\n";
    expect(parseMermaidSource(source)).toEqual({
      config: { layout: "elk", theme: "forest" },
      body: "erDiagram\n  A ||--o{ B : has\n",
    });
  });

  it("tolerates malformed frontmatter YAML by returning an empty config", () => {
    const source = "---\nconfig: [unterminated\n---\nerDiagram\n";
    expect(parseMermaidSource(source).config).toEqual({});
  });

  it("ignores a frontmatter-looking block that isn't at the very start", () => {
    const source = "erDiagram\n---\nconfig:\n  layout: elk\n---\n";
    expect(parseMermaidSource(source)).toEqual({ config: {}, body: source });
  });
});

describe("applyMermaidConfig", () => {
  it("inserts a new frontmatter block into a file with none", () => {
    const source = "erDiagram\n  A ||--o{ B : has\n";
    const out = applyMermaidConfig(source, { layout: "elk" });
    expect(out).toBe("---\nconfig:\n  layout: elk\n---\nerDiagram\n  A ||--o{ B : has\n");
    expect(parseMermaidSource(out).config).toEqual({ layout: "elk" });
  });

  it("merges into existing config without disturbing other config keys", () => {
    const source = "---\nconfig:\n  layout: elk\n---\nerDiagram\n";
    const out = applyMermaidConfig(source, { theme: "forest" });
    expect(parseMermaidSource(out).config).toEqual({ layout: "elk", theme: "forest" });
  });

  it("preserves top-level frontmatter keys outside config (e.g. title)", () => {
    const source = "---\ntitle: My Diagram\nconfig:\n  layout: elk\n---\nerDiagram\n";
    const out = applyMermaidConfig(source, { theme: "forest" });
    const { frontmatter } = parseFrontmatterForTest(out);
    expect(frontmatter.title).toBe("My Diagram");
    expect(frontmatter.config).toEqual({ layout: "elk", theme: "forest" });
  });

  it("deletes a key when the patch value is undefined", () => {
    const source = "---\nconfig:\n  layout: elk\n  theme: forest\n---\nerDiagram\n";
    const out = applyMermaidConfig(source, { layout: undefined });
    expect(parseMermaidSource(out).config).toEqual({ theme: "forest" });
  });

  it("strips the whole frontmatter block once the config empties out", () => {
    const source = "---\nconfig:\n  layout: elk\n---\nerDiagram\n  A ||--o{ B : has\n";
    const out = applyMermaidConfig(source, { layout: undefined });
    expect(out).toBe("erDiagram\n  A ||--o{ B : has\n");
  });

  it("is a no-op body-wise when clearing a key that was never set", () => {
    const source = "erDiagram\n  A ||--o{ B : has\n";
    const out = applyMermaidConfig(source, { layout: undefined });
    expect(out).toBe(source);
  });

  it("recovers from malformed existing frontmatter by replacing it wholesale", () => {
    const source = "---\nconfig: [unterminated\n---\nerDiagram\n";
    const out = applyMermaidConfig(source, { layout: "elk" });
    expect(parseMermaidSource(out).config).toEqual({ layout: "elk" });
  });
});

// Re-parses the full frontmatter object (not just `.config`) for the one test
// above that needs to assert on a sibling key like `title`.
function parseFrontmatterForTest(source: string): {
  frontmatter: Record<string, unknown>;
} {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { frontmatter: {} };
  return { frontmatter: parse(match[1]) };
}
