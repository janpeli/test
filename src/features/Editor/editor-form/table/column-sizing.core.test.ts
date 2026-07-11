import { describe, expect, it } from "vitest";
import {
  getColumnSizing,
  getTableColumns,
  isTableColumn,
  type ColumnSchema,
} from "./column-sizing.core";

describe("getColumnSizing", () => {
  it("gives booleans a narrow fixed width", () => {
    expect(getColumnSizing({ type: "boolean" })).toEqual({ width: "70px" });
  });

  it("gives numbers a fixed width", () => {
    expect(getColumnSizing({ type: "number" })).toEqual({ width: "100px" });
  });

  it("gives integers a fixed width", () => {
    expect(getColumnSizing({ type: "integer" })).toEqual({ width: "100px" });
  });

  it("gives enum strings (combobox) a fixed width", () => {
    expect(
      getColumnSizing({ type: "string", enum: ["a", "b"] })
    ).toEqual({ width: "160px" });
  });

  it("gives short-maxLength strings a modest fixed width", () => {
    expect(getColumnSizing({ type: "string", maxLength: 10 })).toEqual({
      width: "130px",
    });
    expect(getColumnSizing({ type: "string", maxLength: 20 })).toEqual({
      width: "130px",
    });
  });

  it("gives plain unbounded strings a wide fixed width", () => {
    expect(getColumnSizing({ type: "string" })).toEqual({ width: "300px" });
  });

  it("gives long-maxLength strings the same wide fixed width", () => {
    expect(getColumnSizing({ type: "string", maxLength: 255 })).toEqual({
      width: "300px",
    });
  });

  it("gives reference/sub-reference object columns a fixed width", () => {
    expect(
      getColumnSizing({ type: "object", format: "reference" })
    ).toEqual({ width: "180px" });
    expect(
      getColumnSizing({ type: "object", format: "sub-reference" })
    ).toEqual({ width: "180px" });
  });

  it("gives array-of-string (tag) columns a fixed width", () => {
    expect(
      getColumnSizing({ type: "array", items: { type: "string" } })
    ).toEqual({ width: "200px" });
  });

  it("gives plain array columns (tag field fallback) a fixed width", () => {
    expect(getColumnSizing({ type: "array" })).toEqual({ width: "200px" });
  });

  it("falls back to a fixed width for unrecognized types", () => {
    expect(getColumnSizing({} as ColumnSchema)).toEqual({ width: "140px" });
  });
});

describe("isTableColumn", () => {
  it("accepts scalar types", () => {
    expect(isTableColumn({ type: "string" })).toBe(true);
    expect(isTableColumn({ type: "number" })).toBe(true);
    expect(isTableColumn({ type: "boolean" })).toBe(true);
  });

  it("accepts array-of-string (tags)", () => {
    expect(isTableColumn({ type: "array", items: { type: "string" } })).toBe(
      true
    );
  });

  it("accepts reference/sub-reference objects", () => {
    expect(isTableColumn({ type: "object", format: "reference" })).toBe(
      true
    );
    expect(isTableColumn({ type: "object", format: "sub-reference" })).toBe(
      true
    );
  });

  it("rejects plain objects and arrays of non-strings (nested fields)", () => {
    expect(isTableColumn({ type: "object" })).toBe(false);
    expect(
      isTableColumn({ type: "array", items: { type: "object" } })
    ).toBe(false);
  });
});

describe("getTableColumns", () => {
  it("returns [] for missing/array/property-less items schemas", () => {
    expect(getTableColumns(undefined)).toEqual([]);
    expect(getTableColumns([{ type: "string" }])).toEqual([]);
    expect(getTableColumns({ type: "object" })).toEqual([]);
  });

  it("filters to table columns, preserving declaration order", () => {
    const items = {
      type: "object" as const,
      properties: {
        name: { type: "string" },
        nested: { type: "object", properties: { x: { type: "string" } } },
        active: { type: "boolean" },
        ref: { type: "object", format: "reference" as const },
      },
    };

    expect(getTableColumns(items).map(([name]) => name)).toEqual([
      "name",
      "active",
      "ref",
    ]);
  });
});
