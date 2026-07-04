import { describe, expect, it } from "vitest";
import { retargetPasteFolder } from "./paste-target.core";

describe("retargetPasteFolder", () => {
  it("returns the target folder unchanged when it isn't on the clipboard", () => {
    expect(retargetPasteFolder("tables", ["tables/Customer.tbl.yaml"])).toBe("tables");
  });

  it("retargets to the parent folder when pasting onto a clipboard node itself", () => {
    expect(retargetPasteFolder("tables/Customer.tbl.yaml", ["tables/Customer.tbl.yaml"])).toBe(
      "tables"
    );
  });

  it("retargets to the project root ('') for a top-level clipboard node", () => {
    expect(retargetPasteFolder("Customer.tbl.yaml", ["Customer.tbl.yaml"])).toBe("");
  });

  it("handles nested folders, stripping only the last path segment", () => {
    expect(
      retargetPasteFolder("a/b/c", ["a/b/c"])
    ).toBe("a/b");
  });
});
