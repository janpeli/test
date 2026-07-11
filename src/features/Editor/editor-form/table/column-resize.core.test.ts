import { describe, expect, it } from "vitest";
import {
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  UTILITY_COL_WIDTH,
  clampColumnWidth,
  parseStoredWidths,
  resolveColumnWidths,
  serializeWidths,
  storageKey,
  totalTableWidth,
} from "./column-resize.core";

describe("storageKey", () => {
  it("prefixes the zodKey", () => {
    expect(storageKey("table.rows")).toBe(
      "editor-table-col-widths:table.rows"
    );
  });
});

describe("clampColumnWidth", () => {
  it("rounds to a whole pixel", () => {
    expect(clampColumnWidth(120.6)).toBe(121);
  });

  it("never returns below the minimum", () => {
    expect(clampColumnWidth(10)).toBe(MIN_COLUMN_WIDTH);
    expect(clampColumnWidth(-50)).toBe(MIN_COLUMN_WIDTH);
  });

  it("never returns above the maximum", () => {
    expect(clampColumnWidth(99999)).toBe(MAX_COLUMN_WIDTH);
  });
});

describe("parseStoredWidths", () => {
  it("returns {} for null/empty/invalid JSON", () => {
    expect(parseStoredWidths(null)).toEqual({});
    expect(parseStoredWidths("")).toEqual({});
    expect(parseStoredWidths("not json")).toEqual({});
  });

  it("returns {} for non-object JSON", () => {
    expect(parseStoredWidths("42")).toEqual({});
    expect(parseStoredWidths("[1,2]")).toEqual({});
    expect(parseStoredWidths("null")).toEqual({});
  });

  it("keeps only finite numeric values, clamped", () => {
    expect(
      parseStoredWidths(
        JSON.stringify({ a: 150, b: "200", c: 10, d: null, e: Infinity })
      )
    ).toEqual({ a: 150, c: MIN_COLUMN_WIDTH });
  });

  it("round-trips with serializeWidths", () => {
    const widths = { name: 200, active: 90 };
    expect(parseStoredWidths(serializeWidths(widths))).toEqual(widths);
  });
});

describe("resolveColumnWidths", () => {
  it("uses defaults when there are no overrides", () => {
    const columns: [string, string][] = [
      ["name", "300px"],
      ["active", "70px"],
    ];
    expect(resolveColumnWidths(columns, {})).toEqual([300, 70]);
  });

  it("lets an override win over the default", () => {
    const columns: [string, string][] = [
      ["name", "300px"],
      ["active", "70px"],
    ];
    expect(resolveColumnWidths(columns, { active: 150 })).toEqual([300, 150]);
  });

  it("falls back to the minimum for an unparseable default", () => {
    expect(resolveColumnWidths([["a", "oops"]], {})).toEqual([
      MIN_COLUMN_WIDTH,
    ]);
  });

  it("returns [] for no columns", () => {
    expect(resolveColumnWidths([], {})).toEqual([]);
  });
});

describe("totalTableWidth", () => {
  it("sums columns plus the delete utility column", () => {
    expect(totalTableWidth([300, 70], false)).toBe(
      300 + 70 + UTILITY_COL_WIDTH
    );
  });

  it("adds the expand column when nested fields exist", () => {
    expect(totalTableWidth([300, 70], true)).toBe(
      300 + 70 + 2 * UTILITY_COL_WIDTH
    );
  });

  it("is just the utility columns for an empty column list", () => {
    expect(totalTableWidth([], false)).toBe(UTILITY_COL_WIDTH);
  });
});
