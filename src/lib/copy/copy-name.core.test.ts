import { describe, expect, it } from "vitest";
import { uniqueCopyName } from "./copy-name.core";

describe("uniqueCopyName", () => {
  it("keeps the original name when there is no clash", () => {
    const result = uniqueCopyName("Customer.tbl.yaml", false, new Set());
    expect(result).toEqual({ basename: "Customer.tbl.yaml", displayName: "Customer.tbl" });
  });

  it("appends ' copy' on a first clash", () => {
    const taken = new Set(["Customer.tbl.yaml"]);
    const result = uniqueCopyName("Customer.tbl.yaml", false, taken);
    expect(result).toEqual({
      basename: "Customer copy.tbl.yaml",
      displayName: "Customer copy.tbl",
    });
  });

  it("counts up ' copy 2', ' copy 3', ... on repeated clashes", () => {
    const taken = new Set([
      "Customer.tbl.yaml",
      "Customer copy.tbl.yaml",
      "Customer copy 2.tbl.yaml",
    ]);
    const result = uniqueCopyName("Customer.tbl.yaml", false, taken);
    expect(result.basename).toBe("Customer copy 3.tbl.yaml");
  });

  it("works for folders (no suffix)", () => {
    const taken = new Set(["Reports"]);
    const result = uniqueCopyName("Reports", true, taken);
    expect(result).toEqual({ basename: "Reports copy", displayName: "Reports copy" });
  });

  it("does not mutate the taken set", () => {
    const taken = new Set(["Customer.tbl.yaml"]);
    uniqueCopyName("Customer.tbl.yaml", false, taken);
    expect(taken).toEqual(new Set(["Customer.tbl.yaml"]));
  });
});
