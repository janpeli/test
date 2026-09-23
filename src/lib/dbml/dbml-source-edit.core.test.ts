import { describe, expect, it } from "vitest";
import { parseDbml } from "./dbml-parser.core";
import { setTableHeaderColor } from "./dbml-source-edit.core";

function schemaFor(source: string) {
  const { schema } = parseDbml(source);
  if (!schema) throw new Error("expected the fixture source to parse");
  return schema;
}

describe("setTableHeaderColor", () => {
  it("adds headercolor to a table with no existing bracket", () => {
    const src = "Table users {\n  id int [pk]\n}\n";
    const out = setTableHeaderColor(src, schemaFor(src), "public.users", "#3498DB");
    expect(out).toBe("Table users [headercolor: #3498DB] {\n  id int [pk]\n}\n");
  });

  it("appends headercolor alongside an existing unrelated setting", () => {
    const src = "Table users [note: 'x'] {\n  id int [pk]\n}\n";
    const out = setTableHeaderColor(src, schemaFor(src), "public.users", "#3498DB");
    expect(out).toBe("Table users [note: 'x', headercolor: #3498DB] {\n  id int [pk]\n}\n");
  });

  it("replaces an existing headercolor value", () => {
    const src = "Table users [headercolor: #111111] {\n  id int [pk]\n}\n";
    const out = setTableHeaderColor(src, schemaFor(src), "public.users", "#3498DB");
    expect(out).toBe("Table users [headercolor: #3498DB] {\n  id int [pk]\n}\n");
  });

  it("clears headercolor (color: null), dropping the bracket entirely when nothing else remains", () => {
    const src = "Table users [headercolor: #111111] {\n  id int [pk]\n}\n";
    const out = setTableHeaderColor(src, schemaFor(src), "public.users", null);
    expect(out).toBe("Table users {\n  id int [pk]\n}\n");
  });

  it("clears headercolor but keeps other settings on the line", () => {
    const src = "Table users [headercolor: #111111, note: 'x'] {\n  id int [pk]\n}\n";
    const out = setTableHeaderColor(src, schemaFor(src), "public.users", null);
    expect(out).toBe("Table users [note: 'x'] {\n  id int [pk]\n}\n");
  });

  it("matches a schema-qualified table", () => {
    const src = "Table auth.users {\n  id int [pk]\n}\n";
    const out = setTableHeaderColor(src, schemaFor(src), "auth.users", "#3498DB");
    expect(out).toBe("Table auth.users [headercolor: #3498DB] {\n  id int [pk]\n}\n");
  });

  it("matches a quoted table name with spaces", () => {
    const src = 'Table "Shipping Address" {\n  id int [pk]\n}\n';
    const out = setTableHeaderColor(src, schemaFor(src), 'public.Shipping Address', "#3498DB");
    expect(out).toBe('Table "Shipping Address" [headercolor: #3498DB] {\n  id int [pk]\n}\n');
  });

  it("inserts the bracket after an alias clause", () => {
    const src = "Table auth.sessions as S {\n  id int [pk]\n}\n";
    const out = setTableHeaderColor(src, schemaFor(src), "auth.sessions", "#3498DB");
    expect(out).toBe("Table auth.sessions as S [headercolor: #3498DB] {\n  id int [pk]\n}\n");
  });

  it("only touches the target table's line, leaving others untouched", () => {
    const src = "Table users {\n  id int [pk]\n}\nTable posts {\n  id int [pk]\n}\n";
    const out = setTableHeaderColor(src, schemaFor(src), "public.posts", "#3498DB");
    expect(out).toBe(
      "Table users {\n  id int [pk]\n}\nTable posts [headercolor: #3498DB] {\n  id int [pk]\n}\n"
    );
  });

  it("supports 3-digit hex", () => {
    const src = "Table users {\n  id int [pk]\n}\n";
    const out = setTableHeaderColor(src, schemaFor(src), "public.users", "#abc");
    expect(out).toContain("[headercolor: #abc]");
  });

  it("is a no-op for a table name that doesn't exist", () => {
    const src = "Table users {\n  id int [pk]\n}\n";
    const out = setTableHeaderColor(src, schemaFor(src), "public.does_not_exist", "#3498DB");
    expect(out).toBe(src);
  });

  it("is a no-op for an invalid color string (defends against malformed DBML)", () => {
    const src = "Table users {\n  id int [pk]\n}\n";
    const out = setTableHeaderColor(src, schemaFor(src), "public.users", "not-a-color");
    expect(out).toBe(src);
  });

  it("handles CRLF line endings (e.g. a file checked out with git's core.autocrlf)", () => {
    const src = "Table users {\r\n  id int [pk]\r\n}\r\n";
    const out = setTableHeaderColor(src, schemaFor(src), "public.users", "#3498DB");
    expect(out).toBe("Table users [headercolor: #3498DB] {\r\n  id int [pk]\r\n}\r\n");
  });
});
