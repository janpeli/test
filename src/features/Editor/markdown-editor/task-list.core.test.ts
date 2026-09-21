import { describe, expect, it } from "vitest";
import MarkdownIt from "markdown-it";
import { taskListsPlugin } from "./task-list.core";

function render(src: string): string {
  const md = new MarkdownIt();
  md.use(taskListsPlugin);
  return md.render(src);
}

describe("taskListsPlugin", () => {
  it("renders an unchecked item as a disabled unchecked checkbox", () => {
    const html = render("- [ ] todo item");
    expect(html).toContain('<input type="checkbox" class="task-checkbox" disabled />');
    expect(html).toContain("todo item");
    expect(html).not.toContain("[ ]");
  });

  it("renders a checked item (lower and upper case x) as checked", () => {
    const lower = render("- [x] done item");
    const upper = render("- [X] done item");
    expect(lower).toContain(
      '<input type="checkbox" class="task-checkbox" disabled checked />'
    );
    expect(upper).toContain(
      '<input type="checkbox" class="task-checkbox" disabled checked />'
    );
  });

  it("tags the item and the enclosing list with CSS classes", () => {
    const html = render("- [ ] a\n- [x] b\n");
    expect(html).toContain('class="contains-task-list"');
    expect((html.match(/task-list-item/g) ?? []).length).toBe(2);
  });

  it("leaves ordinary list items untouched", () => {
    const html = render("- just a regular item\n- [nope not a checkbox\n");
    expect(html).not.toContain("task-checkbox");
    expect(html).not.toContain("contains-task-list");
  });

  it("preserves inline formatting after the checkbox marker", () => {
    const html = render("- [ ] **bold** and a [link](https://example.com)");
    expect(html).toContain("task-checkbox");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain('<a href="https://example.com">link</a>');
  });

  it("does not confuse a nested sub-list item for the parent's own text", () => {
    const html = render("- parent item\n  - [ ] nested task\n");
    // Only the nested item is a task; the parent must not gain the class.
    expect((html.match(/task-list-item/g) ?? []).length).toBe(1);
  });
});
