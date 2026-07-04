import { describe, expect, it } from "vitest";
import { composeRenamed, splitName } from "./rename-name.core";

describe("splitName", () => {
  it("treats a folder's whole name as the stem, with no suffix", () => {
    expect(splitName("Sales Reports", true)).toEqual({
      stem: "Sales Reports",
      suffix: "",
    });
  });

  it("splits a file on the first dot, keeping the rest as the suffix", () => {
    expect(splitName("Customer.tbl.yaml", false)).toEqual({
      stem: "Customer",
      suffix: ".tbl.yaml",
    });
  });

  it("splits a single-extension file", () => {
    expect(splitName("intro.md", false)).toEqual({ stem: "intro", suffix: ".md" });
  });

  it("treats a file with no dot as an empty suffix", () => {
    expect(splitName("README", false)).toEqual({ stem: "README", suffix: "" });
  });

  it("treats a dotfile's leading dot as starting the suffix (empty stem)", () => {
    // documents current behavior: indexOf(".") === 0 for a hidden file
    expect(splitName(".gitignore", false)).toEqual({ stem: "", suffix: ".gitignore" });
  });
});

describe("composeRenamed", () => {
  it("matches the documented examples", () => {
    expect(composeRenamed("Client", ".tbl.yaml")).toEqual({
      basename: "Client.tbl.yaml",
      displayName: "Client.tbl",
    });
    expect(composeRenamed("diagram", ".can.md")).toEqual({
      basename: "diagram.can.md",
      displayName: "diagram.can",
    });
    expect(composeRenamed("intro", ".md")).toEqual({
      basename: "intro.md",
      displayName: "intro",
    });
    expect(composeRenamed("Revenue", "")).toEqual({
      basename: "Revenue",
      displayName: "Revenue",
    });
  });

  it("only strips the last extension from the display name, even if the stem has dots", () => {
    expect(composeRenamed("a.b", ".yaml")).toEqual({
      basename: "a.b.yaml",
      displayName: "a.b",
    });
  });
});
