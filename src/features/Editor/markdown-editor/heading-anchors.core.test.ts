import { describe, expect, it } from "vitest";
import MarkdownIt from "markdown-it";
import { headingAnchorsPlugin, type HeadingEntry } from "./heading-anchors.core";

function renderWithHeadings(src: string): { html: string; headings: HeadingEntry[] } {
  const md = new MarkdownIt();
  md.use(headingAnchorsPlugin);
  const env: { headings?: HeadingEntry[] } = {};
  const html = md.render(src, env);
  return { html, headings: env.headings ?? [] };
}

describe("headingAnchorsPlugin", () => {
  it("assigns a slug id and appends a copy-link anchor", () => {
    const { html, headings } = renderWithHeadings("## Hello World");
    expect(html).toContain('<h2 id="hello-world">');
    expect(html).toContain('<a href="#hello-world" class="md-heading-anchor" data-slug="hello-world"');
    expect(headings).toEqual([{ level: 2, text: "Hello World", slug: "hello-world" }]);
  });

  it("de-duplicates repeated headings GitHub-style", () => {
    const { headings } = renderWithHeadings("# Intro\n\n## Intro\n\n## Intro\n");
    expect(headings.map((h) => h.slug)).toEqual(["intro", "intro-1", "intro-2"]);
  });

  it("strips markup but keeps inline code and link text in the slug/label", () => {
    const { headings } = renderWithHeadings("## Setting `FOO_BAR` and [links](https://x)");
    expect(headings[0].text).toBe("Setting FOO_BAR and links");
    expect(headings[0].slug).toBe("setting-foo_bar-and-links");
  });

  it("falls back to a generic slug for a heading with no sluggable characters", () => {
    const { headings } = renderWithHeadings("## 🎉🎉🎉");
    expect(headings[0].slug).toBe("section");
  });

  it("records heading level and preserves document order", () => {
    const { headings } = renderWithHeadings("# One\n\n### Two\n\n## Three\n");
    expect(headings).toEqual([
      { level: 1, text: "One", slug: "one" },
      { level: 3, text: "Two", slug: "two" },
      { level: 2, text: "Three", slug: "three" },
    ]);
  });
});
