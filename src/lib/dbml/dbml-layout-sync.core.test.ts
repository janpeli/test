import { describe, expect, it } from "vitest";
import {
  deriveLayoutState,
  hasUnsavedTableGap,
  layoutOrEmpty,
  resolvePositions,
  type LoadedLayout,
} from "./dbml-layout-sync.core";
import type { DbmlSchema } from "./dbml-parser.core";
import type { DbmlLayoutFile } from "./dbml-layout-file.core";

const table = (name: string) => ({
  name,
  schemaName: "public",
  tableName: name.split(".").pop()!,
  columns: [{ name: "id", type: "int", pk: true }],
});

const schema = (names: string[]): DbmlSchema => ({
  tables: names.map(table),
  refs: [],
  groups: [],
});

describe("deriveLayoutState", () => {
  it("is not ready with no fileId", () => {
    expect(deriveLayoutState(undefined, null)).toEqual({ ready: false });
  });

  it("is not ready when nothing has loaded yet", () => {
    expect(deriveLayoutState("a.dbml", null)).toEqual({ ready: false });
  });

  it("is not ready when the loaded layout is stamped for a different file", () => {
    const loaded: LoadedLayout = { fileId: "b.dbml", layout: null };
    expect(deriveLayoutState("a.dbml", loaded)).toEqual({ ready: false });
  });

  it("is ready with the layout once stamped for the current file, even when null", () => {
    const loaded: LoadedLayout = { fileId: "a.dbml", layout: null };
    expect(deriveLayoutState("a.dbml", loaded)).toEqual({ ready: true, layout: null });
  });

  it("is ready with the real layout when it matches", () => {
    const layout: DbmlLayoutFile = { version: 1, tables: { x: { x: 1, y: 2 } } };
    const loaded: LoadedLayout = { fileId: "a.dbml", layout };
    expect(deriveLayoutState("a.dbml", loaded)).toEqual({ ready: true, layout });
  });
});

describe("layoutOrEmpty", () => {
  it("is empty when not ready", () => {
    expect(layoutOrEmpty({ ready: false })).toEqual({ version: 1, tables: {} });
  });

  it("is empty when ready but nothing was saved", () => {
    expect(layoutOrEmpty({ ready: true, layout: null })).toEqual({ version: 1, tables: {} });
  });

  it("is the saved layout when ready and present", () => {
    const layout: DbmlLayoutFile = { version: 1, tables: {}, viewSettings: { showOnlyPkFk: true } };
    expect(layoutOrEmpty({ ready: true, layout })).toBe(layout);
  });
});

describe("resolvePositions", () => {
  it("places nothing while not ready, even with a parsed schema", () => {
    expect(resolvePositions(schema(["public.a"]), { ready: false })).toEqual({});
  });

  it("auto-layouts every table when ready but nothing saved yet", () => {
    const positions = resolvePositions(schema(["public.a", "public.b"]), {
      ready: true,
      layout: null,
    });
    expect(Object.keys(positions).sort()).toEqual(["public.a", "public.b"]);
  });

  it("auto-layouts when ready and the saved layout has zero table positions", () => {
    const positions = resolvePositions(schema(["public.a"]), {
      ready: true,
      layout: { version: 1, tables: {} },
    });
    expect(Object.keys(positions)).toEqual(["public.a"]);
  });

  it("keeps saved positions and places only the missing table otherwise", () => {
    const positions = resolvePositions(schema(["public.a", "public.b"]), {
      ready: true,
      layout: { version: 1, tables: { "public.a": { x: 10, y: 20 } } },
    });
    expect(positions["public.a"]).toEqual({ x: 10, y: 20 });
    expect(positions["public.b"]).toBeDefined();
    expect(positions["public.b"]).not.toEqual({ x: 10, y: 20 });
  });
});

describe("hasUnsavedTableGap", () => {
  it("is false when every table already has a saved position", () => {
    expect(hasUnsavedTableGap(schema(["public.a"]), { "public.a": { x: 0, y: 0 } })).toBe(false);
  });

  it("is true when a table is missing from the saved positions", () => {
    expect(hasUnsavedTableGap(schema(["public.a", "public.b"]), { "public.a": { x: 0, y: 0 } })).toBe(
      true
    );
  });

  it("is false for an empty schema", () => {
    expect(hasUnsavedTableGap(schema([]), {})).toBe(false);
  });
});
