import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { applyFormToYaml } from "./apply-form-to-yaml.core";

/**
 * Applies the patch and asserts THE INVARIANT (parse(result) deep-equals
 * formData) before returning the raw text for comment/format assertions.
 */
function apply(source: string, formData: unknown): string {
  const result = applyFormToYaml(source, formData);
  expect(result).not.toBeNull();
  expect(parse(result as string)).toEqual(formData);
  return result as string;
}

describe("applyFormToYaml — comment preservation", () => {
  it("1. keeps comments on OTHER keys when a different key changes", () => {
    const source = [
      "# leading comment on name",
      "name: alice # inline on name",
      "age: 30",
      "",
    ].join("\n");
    const out = apply(source, { name: "alice", age: 31 });
    expect(out).toContain("# leading comment on name");
    expect(out).toContain("name: alice # inline on name");
    expect(out).toContain("age: 31");
  });

  it("2. keeps the comment ON the changed key itself across a scalar change", () => {
    // yaml's setIn mutates the existing Scalar in place for scalar→scalar, so
    // the node's inline comment survives even though its value changed.
    const source = "age: 30 # the age field\n";
    const out = apply(source, { age: 31 });
    expect(out).toContain("age: 31 # the age field");
  });

  it("3. preserves key order after a change", () => {
    const source = "zeta: 1\nalpha: 2\nmiddle: 3\n";
    const out = apply(source, { zeta: 1, alpha: 99, middle: 3 });
    expect(out.trim().split("\n")).toEqual(["zeta: 1", "alpha: 99", "middle: 3"]);
  });

  it("4. adds a new key while leaving existing comments untouched", () => {
    const source = "name: alice # keep me\n";
    const out = apply(source, { name: "alice", age: 42 });
    expect(out).toContain("name: alice # keep me");
    expect(out).toContain("age: 42");
  });

  it("5. deletes a key absent from formData, other comments untouched", () => {
    const source = "name: alice # keep me\nage: 30 # drop with age\n";
    const out = apply(source, { name: "alice" });
    expect(out).toContain("name: alice # keep me");
    expect(out).not.toContain("age");
  });

  it("6. preserves comments at every level of a nested map on a deep change", () => {
    // LIBRARY QUIRK (yaml 2.9.0, inherent to parse→stringify, not this patch):
    // an inline comment on a *collection-valued* key — `general: # x` — is
    // relocated to its own line above the first child on re-stringify. The
    // comment TEXT survives; only its position moves. Inline comments on
    // scalar-valued keys stay put.
    const source = [
      "general: # general section",
      "  name: widget # the name",
      "  meta: # meta section",
      "    author: bob # author comment",
      "    version: 1",
      "",
    ].join("\n");
    const out = apply(source, {
      general: {
        name: "widget",
        meta: { author: "bob", version: 2 },
      },
    });
    // Comment text on collection-valued keys survives (relocated to own line).
    expect(out).toContain("# general section");
    expect(out).toContain("# meta section");
    // Comments on scalar-valued keys stay inline.
    expect(out).toContain("name: widget # the name");
    expect(out).toContain("author: bob # author comment");
    expect(out).toContain("version: 2");
  });

  it("document header comment (before first key) survives a change", () => {
    const source = [
      "# ==============================",
      "# Model file header",
      "# ==============================",
      "name: model # inline",
      "value: 1",
      "",
    ].join("\n");
    const out = apply(source, { name: "model", value: 2 });
    expect(out).toContain("# Model file header");
    expect(out).toContain("name: model # inline");
    expect(out).toContain("value: 2");
  });
});

describe("applyFormToYaml — arrays", () => {
  it("7a. changing one item's field keeps comments on sibling items", () => {
    const source = [
      "columns:",
      "  - name: id # primary key",
      "    type: int",
      "  - name: label # human readable",
      "    type: text",
      "",
    ].join("\n");
    const out = apply(source, {
      columns: [
        { name: "id", type: "int" },
        { name: "label", type: "varchar" }, // changed type of item 1
      ],
    });
    expect(out).toContain("name: id # primary key");
    expect(out).toContain("name: label # human readable");
    expect(out).toContain("type: varchar");
  });

  it("7b. appends a new item, keeping existing item comments", () => {
    const source = ["items:", "  - one # first", "  - two # second", ""].join(
      "\n"
    );
    const out = apply(source, { items: ["one", "two", "three"] });
    expect(out).toContain("- one # first");
    expect(out).toContain("- two # second");
    expect(out).toContain("three");
  });

  it("7c. removes a trailing item, keeping surviving item comments", () => {
    const source = [
      "items:",
      "  - one # first",
      "  - two # second",
      "  - three # third",
      "",
    ].join("\n");
    const out = apply(source, { items: ["one", "two"] });
    expect(out).toContain("- one # first");
    expect(out).toContain("- two # second");
    expect(out).not.toContain("three");
  });
});

describe("applyFormToYaml — type changes", () => {
  it("8a. scalar → map parses back equal", () => {
    const source = "field: plain # was scalar\n";
    apply(source, { field: { nested: true, count: 3 } });
  });

  it("8b. map → scalar parses back equal", () => {
    const source = "field:\n  nested: true # comment lost with the map\n";
    apply(source, { field: "now a scalar" });
  });

  it("8c. scalar → array parses back equal", () => {
    apply("field: single\n", { field: [1, 2, 3] });
  });
});

describe("applyFormToYaml — null / empty fields", () => {
  it("renders a null form field as `key: null` (matching yaml.stringify)", () => {
    const out = apply("name: alice\ndesc: something # note\n", {
      name: "alice",
      desc: null,
    });
    expect(out).toContain("desc: null");
  });

  it("leaves an already-blank (null) field untouched when unchanged", () => {
    const source = "name: alice\ndesc: # empty on purpose\n";
    const out = apply(source, { name: "alice", desc: null });
    expect(out).toContain("desc: # empty on purpose");
  });

  it("drops an undefined form field (matching yaml.stringify)", () => {
    const out = apply("name: alice\nstale: 1\n", {
      name: "alice",
      stale: undefined,
    });
    expect(out).not.toContain("stale");
  });
});

describe("applyFormToYaml — null return / fallback cases", () => {
  it("9a. returns null for empty source", () => {
    expect(applyFormToYaml("", { a: 1 })).toBeNull();
  });

  it("9b. returns null for blank/whitespace source", () => {
    expect(applyFormToYaml("   \n\n  ", { a: 1 })).toBeNull();
  });

  it("9c. returns null for invalid YAML", () => {
    expect(applyFormToYaml("key: [unterminated", { a: 1 })).toBeNull();
  });

  it("9d. returns null when formData is not a plain object", () => {
    expect(applyFormToYaml("a: 1\n", null)).toBeNull();
    expect(applyFormToYaml("a: 1\n", 42)).toBeNull();
    expect(applyFormToYaml("a: 1\n", "str")).toBeNull();
    expect(applyFormToYaml("a: 1\n", [1, 2, 3])).toBeNull();
  });

  it("returns null when the document top level is not a map", () => {
    // Valid YAML, but a top-level sequence has no map to patch onto.
    expect(applyFormToYaml("- 1\n- 2\n", { a: 1 })).toBeNull();
  });
});

describe("applyFormToYaml — realistic model fixture", () => {
  const fixture = [
    "# ---------------------------------------------",
    "# Customer table model",
    "# ---------------------------------------------",
    "general:",
    "  name: CUSTOMER # physical table name",
    "  description: Master customer records",
    "  owner: sales # owning domain",
    "properties:",
    "  columns:",
    "    - name: CUSTOMER_ID # surrogate key",
    "      type: NUMBER",
    "      nullable: false",
    "    - name: EMAIL # unique",
    "      type: VARCHAR",
    "      nullable: true",
    "  indexes:",
    "    - name: PK_CUSTOMER # primary key index",
    "      unique: true",
    "",
  ].join("\n");

  it("edits one deep field and preserves the scattered comments", () => {
    const parsed = parse(fixture) as {
      general: Record<string, unknown>;
      properties: {
        columns: Record<string, unknown>[];
        indexes: Record<string, unknown>[];
      };
    };
    // Simulate a form edit: change one column's type + the table description.
    parsed.general.description = "Master customer records (v2)";
    parsed.properties.columns[1].type = "VARCHAR2";

    const out = apply(fixture, parsed);

    // Scattered comments across sections and array items survive.
    expect(out).toContain("# Customer table model");
    expect(out).toContain("name: CUSTOMER # physical table name");
    expect(out).toContain("owner: sales # owning domain");
    expect(out).toContain("name: CUSTOMER_ID # surrogate key");
    expect(out).toContain("name: EMAIL # unique");
    expect(out).toContain("name: PK_CUSTOMER # primary key index");
    // The two edits landed.
    expect(out).toContain("Master customer records (v2)");
    expect(out).toContain("type: VARCHAR2");
  });
});
