import { describe, expect, it } from "vitest";
import {
  groupResultsByFolder,
  resultDir,
  resultName,
} from "./search-grouping.core";
import type { SearchResult } from "electron/src/project";

const r = (id: string, matchCount = 1): SearchResult => ({ id, matchCount });

describe("resultName / resultDir", () => {
  it("splits a nested path at the last slash", () => {
    expect(resultName("models/core/customer.mdl")).toBe("customer.mdl");
    expect(resultDir("models/core/customer.mdl")).toBe("models/core");
  });

  it("treats a slashless id as a root-level file", () => {
    expect(resultName("readme.md")).toBe("readme.md");
    expect(resultDir("readme.md")).toBe("");
  });
});

describe("groupResultsByFolder", () => {
  it("returns no groups for an empty result set", () => {
    expect(groupResultsByFolder([])).toEqual([]);
  });

  it("groups files by their containing folder", () => {
    const groups = groupResultsByFolder([
      r("models/core/customer.mdl", 12),
      r("models/core/order.mdl", 3),
      r("models/staging/raw_events.mdl", 8),
    ]);
    expect(groups.map((g) => g.dir)).toEqual(["models/core", "models/staging"]);
    expect(groups[0].files.map((f) => f.id)).toEqual([
      "models/core/customer.mdl",
      "models/core/order.mdl",
    ]);
  });

  it("sums each group's match counts", () => {
    const [core] = groupResultsByFolder([
      r("models/core/customer.mdl", 12),
      r("models/core/order.mdl", 3),
    ]);
    expect(core.totalMatches).toBe(15);
  });

  it("orders groups by folder and files by name, case-insensitively", () => {
    const groups = groupResultsByFolder([
      r("models/staging/raw_events.mdl"),
      r("models/core/Zebra.mdl"),
      r("models/core/apple.mdl"),
    ]);
    expect(groups.map((g) => g.dir)).toEqual(["models/core", "models/staging"]);
    expect(groups[0].files.map((f) => resultName(f.id))).toEqual([
      "apple.mdl",
      "Zebra.mdl",
    ]);
  });

  it("collects root-level files under a '/' labelled group", () => {
    const groups = groupResultsByFolder([
      r("readme.md", 2),
      r("models/core/customer.mdl", 1),
    ]);
    const root = groups.find((g) => g.dir === "");
    expect(root).toBeDefined();
    expect(root!.label).toBe("/");
    expect(root!.files.map((f) => f.id)).toEqual(["readme.md"]);
  });
});
