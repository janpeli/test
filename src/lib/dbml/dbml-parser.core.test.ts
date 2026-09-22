import { describe, expect, it } from "vitest";
import { fkColumnsByTable, parseDbml } from "./dbml-parser.core";

describe("parseDbml", () => {
  it("parses tables, columns, and a ref", () => {
    const { schema, error } = parseDbml(`
Table users {
  id int [pk, increment]
  name varchar(100) [not null]
  email varchar(255) [unique]
}

Table posts {
  id int [pk]
  user_id int [ref: > users.id]
  title varchar(200)
}
`);

    expect(error).toBeNull();
    expect(schema?.tables.map((t) => t.name)).toEqual(["public.posts", "public.users"]);

    const users = schema?.tables.find((t) => t.tableName === "users");
    expect(users?.schemaName).toBe("public");
    expect(users?.columns).toEqual([
      { name: "id", type: "int", pk: true, increment: true, note: null, default: null },
      { name: "name", type: "varchar(100)", notNull: true, note: null, default: null },
      { name: "email", type: "varchar(255)", unique: true, note: null, default: null },
    ]);

    expect(schema?.refs).toHaveLength(1);
    expect(schema?.refs[0]).toMatchObject({
      source: { table: "public.users", columns: ["id"], relation: "1" },
      target: { table: "public.posts", columns: ["user_id"], relation: "*" },
    });
  });

  it("captures headerColor from a table's [headercolor: ...] setting", () => {
    const { schema } = parseDbml(`
Table users [headercolor: #3498DB] {
  id int [pk]
}
Table posts {
  id int [pk]
}
`);
    expect(schema?.tables.find((t) => t.tableName === "users")?.headerColor).toBe("#3498DB");
    expect(schema?.tables.find((t) => t.tableName === "posts")?.headerColor).toBeNull();
  });

  it("assigns groupName from TableGroup", () => {
    const { schema } = parseDbml(`
Table users { id int [pk] }
Table posts { id int [pk] }

TableGroup content {
  posts
}
`);

    expect(schema?.groups).toEqual([{ name: "content", tables: ["public.posts"], note: null }]);
    expect(schema?.tables.find((t) => t.tableName === "posts")?.groupName).toBe("content");
    expect(schema?.tables.find((t) => t.tableName === "users")?.groupName).toBeNull();
  });

  it("qualifies tables by explicit schema", () => {
    const { schema } = parseDbml(`
Table billing.invoices {
  id int [pk]
}
`);

    expect(schema?.tables[0]).toMatchObject({
      name: "billing.invoices",
      schemaName: "billing",
      tableName: "invoices",
    });
  });

  it("returns a ParseError with a location for invalid syntax", () => {
    const { schema, error } = parseDbml(`Table users { id int [pk`);

    expect(schema).toBeNull();
    expect(error?.message).toBeTruthy();
  });

  it("fkColumnsByTable puts the FK on the many (\"*\") side, not the \"1\" side", () => {
    const { schema } = parseDbml(`
Table users {
  id int [pk]
}
Table posts {
  id int [pk]
  user_id int [ref: > users.id]
}
`);
    const fkByTable = fkColumnsByTable(schema!);
    expect(fkByTable.get("public.posts")).toEqual(new Set(["user_id"]));
    expect(fkByTable.has("public.users")).toBe(false);
  });

  it("produces a stable ref id regardless of endpoint order", () => {
    const a = parseDbml(`
Table users { id int [pk] }
Table posts { user_id int [ref: > users.id] }
`);
    const b = parseDbml(`
Table posts { user_id int [pk] }
Table users { id int [ref: < posts.user_id] }
`);

    expect(a.schema?.refs[0]?.id).toBe(b.schema?.refs[0]?.id);
  });
});
