import { describe, expect, it } from "vitest";
import {
  autoLayoutTables,
  columnAnchorY,
  computeContentBounds,
  computeGroupBounds,
  contrastTextColor,
  placeUnpositionedTables,
  tableHeight,
  visibleColumns,
} from "./dbml-layout.core";
import type { DbmlSchema } from "./dbml-parser.core";

describe("tableHeight", () => {
  it("is header plus one row per column", () => {
    expect(
      tableHeight([
        { name: "id", type: "int" },
        { name: "name", type: "varchar" },
      ])
    ).toBe(32 + 2 * 24);
  });

  it("never goes below the header + one row, even with zero columns", () => {
    expect(tableHeight([])).toBe(32 + 24);
  });
});

describe("visibleColumns", () => {
  const table = {
    name: "public.posts",
    schemaName: "public",
    tableName: "posts",
    columns: [
      { name: "id", type: "int", pk: true },
      { name: "user_id", type: "int" },
      { name: "title", type: "varchar" },
    ],
  };

  it("returns every column when showOnlyPkFk is off", () => {
    expect(visibleColumns(table, new Set(["user_id"]), false)).toEqual(table.columns);
  });

  it("keeps only pk and fk columns when showOnlyPkFk is on", () => {
    expect(visibleColumns(table, new Set(["user_id"]), true)).toEqual([
      { name: "id", type: "int", pk: true },
      { name: "user_id", type: "int" },
    ]);
  });
});

describe("autoLayoutTables", () => {
  const schema: DbmlSchema = {
    tables: [
      { name: "public.users", schemaName: "public", tableName: "users", columns: [{ name: "id", type: "int" }] },
      { name: "public.posts", schemaName: "public", tableName: "posts", columns: [{ name: "id", type: "int" }] },
    ],
    refs: [
      {
        id: "r1",
        source: { table: "public.users", columns: ["id"], relation: "1" },
        target: { table: "public.posts", columns: ["user_id"], relation: "*" },
      },
    ],
    groups: [],
  };

  it("positions every table", () => {
    const positions = autoLayoutTables(schema);
    expect(Object.keys(positions).sort()).toEqual(["public.posts", "public.users"]);
    for (const pos of Object.values(positions)) {
      expect(Number.isFinite(pos.x)).toBe(true);
      expect(Number.isFinite(pos.y)).toBe(true);
    }
  });

  it("skips refs pointing at a table absent from the schema without throwing", () => {
    const withDangling: DbmlSchema = {
      ...schema,
      refs: [
        ...schema.refs,
        {
          id: "r2",
          source: { table: "public.users", columns: ["id"], relation: "1" },
          target: { table: "public.missing", columns: ["x"], relation: "*" },
        },
      ],
    };
    expect(() => autoLayoutTables(withDangling)).not.toThrow();
  });

  it("skips self-referencing refs without throwing", () => {
    const withSelfRef: DbmlSchema = {
      ...schema,
      refs: [
        {
          id: "r3",
          source: { table: "public.users", columns: ["manager_id"], relation: "*" },
          target: { table: "public.users", columns: ["id"], relation: "1" },
        },
      ],
    };
    expect(() => autoLayoutTables(withSelfRef)).not.toThrow();
  });
});

describe("placeUnpositionedTables", () => {
  const users = {
    name: "public.users",
    schemaName: "public",
    tableName: "users",
    columns: [{ name: "id", type: "int" }],
  };
  const tabulka1 = {
    name: "public.tabulka1",
    schemaName: "public",
    tableName: "tabulka1",
    columns: [
      { name: "a", type: "int" },
      { name: "b", type: "int" },
    ],
  };

  it("regression: a newly-added table never lands on top of an already-saved one", () => {
    // Reproduces the reported bug: `users` was saved back when it was the
    // only table (so it sits wherever its own solo auto-layout put it —
    // here, arbitrarily, far from the origin); `tabulka1` has just been
    // added and has no saved position yet.
    const schema = { tables: [tabulka1, users], refs: [], groups: [] };
    const existing = { "public.users": { x: 500, y: 500 } };

    const placed = placeUnpositionedTables(schema, existing);

    expect(placed["public.users"]).toEqual({ x: 500, y: 500 }); // untouched
    const newPos = placed["public.tabulka1"]!;
    // Must not overlap the users card (220 wide, ~80 tall for 1 column).
    const overlapsX = newPos.x < 500 + 220 && newPos.x + 220 > 500;
    const overlapsY = newPos.y < 500 + 56 && newPos.y + 56 > 500;
    expect(overlapsX && overlapsY).toBe(false);
  });

  it("keeps every already-positioned table exactly where it was", () => {
    const schema = { tables: [users, tabulka1], refs: [], groups: [] };
    const existing = { "public.users": { x: 10, y: 20 } };
    const placed = placeUnpositionedTables(schema, existing);
    expect(placed["public.users"]).toEqual({ x: 10, y: 20 });
  });

  it("stacks multiple new tables without overlapping each other", () => {
    const third = { ...tabulka1, name: "public.third", tableName: "third" };
    const schema = { tables: [tabulka1, third], refs: [], groups: [] };
    const placed = placeUnpositionedTables(schema, {});
    expect(placed["public.tabulka1"]!.y).toBeLessThan(placed["public.third"]!.y);
  });

  it("is a no-op (same object shape) when everything already has a position", () => {
    const schema = { tables: [users], refs: [], groups: [] };
    const existing = { "public.users": { x: 10, y: 20 } };
    expect(placeUnpositionedTables(schema, existing)).toEqual(existing);
  });
});

describe("computeContentBounds", () => {
  it("wraps every positioned table", () => {
    const oneTable: DbmlSchema = {
      tables: [
        {
          name: "public.users",
          schemaName: "public",
          tableName: "users",
          columns: [{ name: "id", type: "int" }],
        },
      ],
      refs: [],
      groups: [],
    };
    const bounds = computeContentBounds(oneTable, { "public.users": { x: 10, y: 20 } });
    expect(bounds).toEqual({ minX: 10, minY: 20, width: 220, height: 32 + 24 });
  });

  it("returns a zero-size box when nothing is positioned", () => {
    expect(computeContentBounds({ tables: [], refs: [], groups: [] }, {})).toEqual({
      minX: 0,
      minY: 0,
      width: 0,
      height: 0,
    });
  });
});

describe("computeGroupBounds", () => {
  const users = { name: "public.users", schemaName: "public", tableName: "users", columns: [{ name: "id", type: "int" }] };
  const posts = { name: "public.posts", schemaName: "public", tableName: "posts", columns: [{ name: "id", type: "int" }] };

  it("wraps a group's member tables with padding and a header", () => {
    const schema: DbmlSchema = {
      tables: [users, posts],
      refs: [],
      groups: [{ name: "content", tables: ["public.users", "public.posts"] }],
    };
    const positions = {
      "public.users": { x: 0, y: 0 },
      "public.posts": { x: 300, y: 0 },
    };
    const bounds = computeGroupBounds(schema, positions);
    expect(bounds.content).toEqual({
      minX: -16,
      minY: -16 - 22,
      width: 300 + 220 + 32,
      height: (32 + 24) + 32 + 22,
    });
  });

  it("omits a group whose members have no position", () => {
    const schema: DbmlSchema = {
      tables: [users],
      refs: [],
      groups: [{ name: "empty_group", tables: ["public.does_not_exist"] }],
    };
    expect(computeGroupBounds(schema, {})).toEqual({});
  });
});

describe("contrastTextColor", () => {
  it("picks white text on a dark background", () => {
    expect(contrastTextColor("#111111")).toBe("#ffffff");
  });

  it("picks black text on a light background", () => {
    expect(contrastTextColor("#f5f5f5")).toBe("#000000");
  });

  it("expands and handles 3-digit hex", () => {
    expect(contrastTextColor("#fff")).toBe("#000000");
    expect(contrastTextColor("#000")).toBe("#ffffff");
  });

  it("works without a leading #", () => {
    expect(contrastTextColor("111111")).toBe("#ffffff");
  });

  it("returns null for a malformed color", () => {
    expect(contrastTextColor("not-a-color")).toBeNull();
    expect(contrastTextColor("#12")).toBeNull();
  });
});

describe("columnAnchorY", () => {
  const columns = [
    { name: "id", type: "int" },
    { name: "email", type: "varchar" },
  ];

  it("centers on the header for the first column", () => {
    expect(columnAnchorY(columns, "id")).toBe(32 + 12);
  });

  it("centers on the correct row for a later column", () => {
    expect(columnAnchorY(columns, "email")).toBe(32 + 24 + 12);
  });

  it("falls back to the first row for an unknown column", () => {
    expect(columnAnchorY(columns, "does_not_exist")).toBe(32 + 12);
  });
});
