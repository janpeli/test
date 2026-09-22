import { describe, expect, it } from "vitest";
import {
  DBML_DARK_PALETTE,
  DBML_LIGHT_PALETTE,
  renderDbmlDiagramSvg,
  stripDbmlExtension,
} from "./dbml-export.core";
import { autoLayoutTables, computeContentBounds, computeGroupBounds } from "./dbml-layout.core";
import { fkColumnsByTable, type DbmlSchema } from "./dbml-parser.core";

function schemaWithRef(): DbmlSchema {
  return {
    tables: [
      {
        name: "public.users",
        schemaName: "public",
        tableName: "users",
        columns: [
          { name: "id", type: "int", pk: true },
          { name: "name", type: "varchar" },
        ],
      },
      {
        name: "public.posts",
        schemaName: "public",
        tableName: "posts",
        columns: [
          { name: "id", type: "int", pk: true },
          { name: "user_id", type: "int" },
        ],
      },
    ],
    refs: [
      {
        id: "r1",
        source: { table: "public.posts", columns: ["user_id"], relation: "*" },
        target: { table: "public.users", columns: ["id"], relation: "1" },
      },
    ],
    groups: [{ name: "core", tables: ["public.users", "public.posts"] }],
  };
}

function render(schema: DbmlSchema, showOnlyPkFk = false) {
  const positions = autoLayoutTables(schema);
  const bounds = computeContentBounds(schema, positions);
  const groupBounds = computeGroupBounds(schema, positions);
  return renderDbmlDiagramSvg({
    schema,
    positions,
    groupBounds,
    collapsedGroupNames: new Set(),
    hiddenTableNames: new Set(),
    fkColumnsByTable: fkColumnsByTable(schema),
    showOnlyPkFk,
    bounds,
    palette: DBML_LIGHT_PALETTE,
  });
}

describe("renderDbmlDiagramSvg", () => {
  it("produces a self-contained SVG with an explicit size", () => {
    const svg = render(schemaWithRef());
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).toMatch(/width="[\d.]+" height="[\d.]+"/);
    expect(svg.endsWith("</svg>")).toBe(true);
  });

  it("renders every table name and column", () => {
    const svg = render(schemaWithRef());
    expect(svg).toContain(">users<");
    expect(svg).toContain(">posts<");
    expect(svg).toContain(">user_id<");
  });

  it("renders one ref path", () => {
    const svg = render(schemaWithRef());
    expect(svg.match(/<path d="M /g)?.length).toBe(1);
  });

  it("renders a group box for schema groups", () => {
    const svg = render(schemaWithRef());
    expect(svg).toContain(">CORE<");
  });

  it("hides non-key columns when showOnlyPkFk is set", () => {
    const svg = render(schemaWithRef(), true);
    expect(svg).not.toContain(">name<");
    expect(svg).toContain(">id<");
  });

  it("escapes XML-sensitive characters in identifiers", () => {
    const schema: DbmlSchema = {
      tables: [
        {
          name: "public.a&b",
          schemaName: "public",
          tableName: "a&b<c>",
          columns: [{ name: "x", type: "int" }],
        },
      ],
      refs: [],
      groups: [],
    };
    const svg = render(schema);
    expect(svg).toContain("a&amp;b&lt;c&gt;");
    expect(svg).not.toContain("a&b<c>");
  });

  it("omits tables hidden by a collapsed group", () => {
    const schema = schemaWithRef();
    const positions = autoLayoutTables(schema);
    const bounds = computeContentBounds(schema, positions);
    const groupBounds = computeGroupBounds(schema, positions);
    const svg = renderDbmlDiagramSvg({
      schema,
      positions,
      groupBounds,
      collapsedGroupNames: new Set(["core"]),
      hiddenTableNames: new Set(["public.users", "public.posts"]),
      fkColumnsByTable: fkColumnsByTable(schema),
      showOnlyPkFk: false,
      bounds,
      palette: DBML_DARK_PALETTE,
    });
    expect(svg).not.toContain(">users<");
    expect(svg).toContain("CORE (2)");
  });
});

describe("stripDbmlExtension", () => {
  it("strips a trailing .dbml", () => {
    expect(stripDbmlExtension("schema.dbml")).toBe("schema");
  });

  it("leaves other extensions untouched", () => {
    expect(stripDbmlExtension("schema.sql")).toBe("schema.sql");
  });
});
