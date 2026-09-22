import { describe, expect, it } from "vitest";
import {
  emptyDbmlLayoutFile,
  parseDbmlLayoutFile,
  serializeDbmlLayoutFile,
  sidecarPathFor,
} from "./dbml-layout-file.core";

describe("sidecarPathFor", () => {
  it("appends .layout.json to the file id", () => {
    expect(sidecarPathFor("models/billing/schema.dbml")).toBe(
      "models/billing/schema.dbml.layout.json"
    );
  });
});

describe("parseDbmlLayoutFile", () => {
  it("round-trips a valid layout", () => {
    const layout = { version: 1 as const, tables: { "public.users": { x: 10, y: 20 } } };
    expect(parseDbmlLayoutFile(serializeDbmlLayoutFile(layout))).toEqual(layout);
  });

  it("falls back to empty on invalid JSON", () => {
    expect(parseDbmlLayoutFile("not json")).toEqual(emptyDbmlLayoutFile());
  });

  it("falls back to empty on a JSON array (not an object)", () => {
    expect(parseDbmlLayoutFile("[]")).toEqual(emptyDbmlLayoutFile());
  });

  it("drops table entries missing x or y, keeps valid ones", () => {
    const parsed = parseDbmlLayoutFile(
      JSON.stringify({
        version: 1,
        tables: {
          "public.users": { x: 10, y: 20 },
          "public.broken": { x: 10 },
          "public.also_broken": "not an object",
        },
      })
    );
    expect(parsed).toEqual({ version: 1, tables: { "public.users": { x: 10, y: 20 } } });
  });

  it("rounds fractional coordinates", () => {
    const parsed = parseDbmlLayoutFile(
      JSON.stringify({ version: 1, tables: { "public.users": { x: 10.6, y: 19.4 } } })
    );
    expect(parsed.tables["public.users"]).toEqual({ x: 11, y: 19 });
  });

  it("round-trips a collapsed group and showOnlyPkFk", () => {
    const layout = {
      version: 1 as const,
      tables: { "public.users": { x: 0, y: 0 } },
      groups: { auth_core: { collapsed: true } },
      viewSettings: { showOnlyPkFk: true },
    };
    expect(parseDbmlLayoutFile(serializeDbmlLayoutFile(layout))).toEqual(layout);
  });

  it("omits groups/viewSettings entirely when nothing is set (no false/absent noise)", () => {
    const parsed = parseDbmlLayoutFile(
      JSON.stringify({
        version: 1,
        tables: {},
        groups: { auth_core: { collapsed: false } },
        viewSettings: { showOnlyPkFk: false },
      })
    );
    expect(parsed).toEqual(emptyDbmlLayoutFile());
  });
});

describe("serializeDbmlLayoutFile", () => {
  it("sorts table keys alphabetically", () => {
    const text = serializeDbmlLayoutFile({
      version: 1,
      tables: {
        "public.zebra": { x: 1, y: 1 },
        "public.apple": { x: 2, y: 2 },
      },
    });
    expect(text.indexOf("public.apple")).toBeLessThan(text.indexOf("public.zebra"));
  });

  it("ends with a trailing newline", () => {
    expect(serializeDbmlLayoutFile(emptyDbmlLayoutFile()).endsWith("\n")).toBe(true);
  });

  it("emits only the tables block when there are no groups/viewSettings", () => {
    const text = serializeDbmlLayoutFile({ version: 1, tables: { "public.users": { x: 1, y: 2 } } });
    expect(text).not.toContain("groups");
    expect(text).not.toContain("viewSettings");
  });

  it("sorts group keys alphabetically", () => {
    const text = serializeDbmlLayoutFile({
      version: 1,
      tables: {},
      groups: { zebra_group: { collapsed: true }, apple_group: { collapsed: true } },
    });
    expect(text.indexOf("apple_group")).toBeLessThan(text.indexOf("zebra_group"));
  });

  it("drops a group entry whose collapsed is false, instead of writing it as true", () => {
    // Regression: an expanded group (collapsed: false) stays in memory as an
    // explicit entry (see dbml-editor.tsx's handleToggleGroupCollapse, which
    // toggles the boolean rather than deleting the key) — the serializer must
    // filter by the actual value, not just by "is this key present".
    const text = serializeDbmlLayoutFile({
      version: 1,
      tables: {},
      groups: { auth_core: { collapsed: false } },
    });
    expect(text).not.toContain("groups");
    expect(text).not.toContain("auth_core");
    expect(parseDbmlLayoutFile(text)).toEqual(emptyDbmlLayoutFile());
  });

  it("keeps only the truly-collapsed groups when some are collapsed and some aren't", () => {
    const text = serializeDbmlLayoutFile({
      version: 1,
      tables: {},
      groups: { auth_core: { collapsed: true }, billing_core: { collapsed: false } },
    });
    expect(parseDbmlLayoutFile(text)).toEqual({
      version: 1,
      tables: {},
      groups: { auth_core: { collapsed: true } },
    });
  });
});
