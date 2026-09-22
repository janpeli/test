import { describe, expect, it } from "vitest";
import {
  buildLineTableMap,
  findSymbolAtPosition,
  formatColumnFlags,
  formatHoverMarkdown,
  getCompletionContext,
  resolveTable,
} from "./dbml-source-info.core";
import type { DbmlSchema } from "./dbml-parser.core";

const SOURCE = `Table users {
  id int [pk, increment]
  name varchar(100) [not null]

  indexes {
    (id, name) [unique]
  }
}

Table posts {
  id int [pk]
  user_id int [ref: > users.id]
}
`;

describe("buildLineTableMap", () => {
  const map = buildLineTableMap(SOURCE);

  it("maps the header line itself", () => {
    expect(map.get(1)).toBe("users");
  });

  it("maps column lines inside the body", () => {
    expect(map.get(2)).toBe("users"); // id int [pk, increment]
    expect(map.get(3)).toBe("users"); // name varchar(100) [not null]
  });

  it("stays inside the table across a nested block (indexes { ... })", () => {
    expect(map.get(5)).toBe("users"); // indexes {
    expect(map.get(6)).toBe("users"); // (id, name) [unique]
    expect(map.get(7)).toBe("users"); // } closing indexes
  });

  it("does not map the blank line or closing brace's line as still-inside once the table ends", () => {
    expect(map.has(9)).toBe(false); // blank line between tables
  });

  it("maps the second table separately", () => {
    expect(map.get(10)).toBe("posts");
    expect(map.get(11)).toBe("posts");
    expect(map.get(12)).toBe("posts");
  });
});

describe("resolveTable", () => {
  const schema: DbmlSchema = {
    tables: [
      { name: "public.users", schemaName: "public", tableName: "users", columns: [] },
      { name: "auth.roles", schemaName: "auth", tableName: "roles", columns: [] },
    ],
    refs: [],
    groups: [],
  };

  it("resolves an unqualified name to the matching table", () => {
    expect(resolveTable(schema, "users")?.name).toBe("public.users");
  });

  it("resolves a qualified name exactly", () => {
    expect(resolveTable(schema, "auth.roles")?.name).toBe("auth.roles");
  });

  it("strips quotes", () => {
    expect(resolveTable(schema, '"users"')?.name).toBe("public.users");
  });

  it("returns undefined for an unknown name", () => {
    expect(resolveTable(schema, "does_not_exist")).toBeUndefined();
  });
});

describe("findSymbolAtPosition", () => {
  const schema: DbmlSchema = {
    tables: [
      {
        name: "public.users",
        schemaName: "public",
        tableName: "users",
        columns: [{ name: "id", type: "int", pk: true }],
      },
      {
        name: "public.posts",
        schemaName: "public",
        tableName: "posts",
        columns: [{ name: "user_id", type: "int" }],
      },
    ],
    refs: [],
    groups: [],
  };
  const lineTableMap = new Map([
    [1, "users"],
    [2, "users"],
    [10, "posts"],
    [11, "posts"],
  ]);

  it("resolves a column inside its enclosing table", () => {
    expect(findSymbolAtPosition(schema, lineTableMap, 2, "id")).toEqual({
      kind: "column",
      table: schema.tables[0],
      column: schema.tables[0]!.columns[0],
    });
  });

  it("resolves a table name even outside any enclosing table's own lines", () => {
    // e.g. hovering "users" inside posts' `ref: > users.id`
    expect(findSymbolAtPosition(schema, lineTableMap, 11, "users")).toEqual({
      kind: "table",
      table: schema.tables[0],
    });
  });

  it("returns null for a word that matches neither a table nor a column", () => {
    expect(findSymbolAtPosition(schema, lineTableMap, 2, "nope")).toBeNull();
  });

  it("prefers the enclosing table's column over a same-named table lookup", () => {
    // "user_id" is a column on posts, not a table name anywhere.
    expect(findSymbolAtPosition(schema, lineTableMap, 11, "user_id")).toEqual({
      kind: "column",
      table: schema.tables[1],
      column: schema.tables[1]!.columns[0],
    });
  });
});

describe("formatColumnFlags", () => {
  it("lists every set flag", () => {
    expect(formatColumnFlags({ name: "id", type: "int", pk: true, increment: true })).toBe(
      "PK, AUTO INCREMENT"
    );
  });

  it("is empty when nothing is set", () => {
    expect(formatColumnFlags({ name: "note", type: "text" })).toBe("");
  });
});

describe("formatHoverMarkdown", () => {
  it("renders a table symbol", () => {
    const md = formatHoverMarkdown({
      kind: "table",
      table: {
        name: "public.users",
        schemaName: "public",
        tableName: "users",
        columns: [{ name: "id", type: "int" }],
      },
    });
    expect(md).toContain("**users**");
    expect(md).toContain("public");
    expect(md).toContain("1 column");
  });

  it("renders a column symbol with flags and default", () => {
    const md = formatHoverMarkdown({
      kind: "column",
      table: { name: "public.users", schemaName: "public", tableName: "users", columns: [] },
      column: { name: "id", type: "int", pk: true, notNull: true, default: "0" },
    });
    expect(md).toContain("**id**");
    expect(md).toContain("`int`");
    expect(md).toContain("PK, NOT NULL");
    expect(md).toContain("`0`");
  });
});

describe("getCompletionContext", () => {
  it("suggests keywords at the very start of a top-level line", () => {
    expect(getCompletionContext("", false)).toEqual({ kind: "line-start" });
  });

  it("keeps suggesting keywords while a keyword is partially typed", () => {
    expect(getCompletionContext("Tab", false)).toEqual({ kind: "line-start" });
  });

  it("suggests nothing on an empty line inside a table body (not typing a column yet)", () => {
    expect(getCompletionContext("  ", true)).toEqual({ kind: "none" });
  });

  it("suggests column types right after the column name", () => {
    expect(getCompletionContext("  id ", true)).toEqual({ kind: "column-type" });
  });

  it("keeps suggesting column types while the type is partially typed", () => {
    expect(getCompletionContext("  id in", true)).toEqual({ kind: "column-type" });
  });

  it("suggests settings inside an open [ ... ]", () => {
    expect(getCompletionContext("  id int [pk, ", true)).toEqual({ kind: "column-settings" });
  });

  it("suggests ref targets after > inside a settings bracket", () => {
    expect(getCompletionContext("  user_id int [ref: > ", true)).toEqual({
      kind: "ref-target",
      prefix: "",
    });
  });

  it("suggests ref targets with a partial table name typed", () => {
    expect(getCompletionContext("  user_id int [ref: > use", true)).toEqual({
      kind: "ref-target",
      prefix: "use",
    });
  });

  it("suggests a table's columns right after 'tablename.' inside a ref", () => {
    expect(getCompletionContext("  user_id int [ref: > users.", true)).toEqual({
      kind: "table-dot",
      tableRawName: "users",
    });
  });

  it("suggests ref targets on a standalone top-level Ref: line", () => {
    expect(getCompletionContext("Ref: posts.user_id > ", false)).toEqual({
      kind: "ref-target",
      prefix: "",
    });
  });

  it("suggests a table's columns on a standalone Ref: line's dotted endpoint", () => {
    expect(getCompletionContext("Ref: posts.", false)).toEqual({
      kind: "table-dot",
      tableRawName: "posts",
    });
  });

  it("is inert once settings/type have clearly moved past a single token", () => {
    expect(getCompletionContext("  id int not_a_bracket_context", true)).toEqual({
      kind: "none",
    });
  });
});
