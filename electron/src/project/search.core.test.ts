import { describe, expect, it } from "vitest";
import {
  buildRgArgs,
  parseCountMatchesLine,
  parseCountMatchesOutput,
  splitGlobList,
  SearchOptions,
} from "./search.core";

const baseOptions: SearchOptions = {
  caseSensitive: false,
  regex: false,
  wholeWord: false,
  include: "",
  exclude: "",
};

describe("splitGlobList", () => {
  it("splits on commas and newlines, trimming entries and dropping blanks", () => {
    expect(splitGlobList("a.ts, b.ts\n c.ts \n\n,")).toEqual(["a.ts", "b.ts", "c.ts"]);
  });

  it("preserves spaces inside an entry (folder names may contain spaces)", () => {
    expect(splitGlobList("My Folder/**,other")).toEqual(["My Folder/**", "other"]);
  });

  it("returns an empty array for blank input", () => {
    expect(splitGlobList("")).toEqual([]);
  });
});

describe("buildRgArgs", () => {
  it("builds the default (case-insensitive, literal, no whole-word) argument list", () => {
    const args = buildRgArgs("needle", baseOptions);
    expect(args).toEqual([
      "--count-matches",
      "--no-ignore",
      "--hidden",
      "--no-messages",
      "--color",
      "never",
      "-g",
      "!.git/**",
      "-i",
      "-F",
      "-e",
      "needle",
      ".",
    ]);
  });

  it("omits -i when caseSensitive is true", () => {
    const args = buildRgArgs("needle", { ...baseOptions, caseSensitive: true });
    expect(args).not.toContain("-i");
  });

  it("omits -F when regex is true", () => {
    const args = buildRgArgs("needle", { ...baseOptions, regex: true });
    expect(args).not.toContain("-F");
  });

  it("adds -w when wholeWord is true", () => {
    const args = buildRgArgs("needle", { ...baseOptions, wholeWord: true });
    expect(args).toContain("-w");
  });

  it("adds a -g per include glob and a negated -g per exclude glob", () => {
    const args = buildRgArgs("needle", {
      ...baseOptions,
      include: "*.ts,*.tsx",
      exclude: "dist/**",
    });
    expect(args).toEqual(
      expect.arrayContaining(["-g", "*.ts", "-g", "*.tsx", "-g", "!dist/**"])
    );
  });

  it("passes the query via -e so a leading '-' isn't read as a flag", () => {
    const args = buildRgArgs("-rf", baseOptions);
    const idx = args.indexOf("-e");
    expect(args[idx + 1]).toBe("-rf");
  });
});

describe("parseCountMatchesLine", () => {
  it("parses a basic 'path:count' line", () => {
    expect(parseCountMatchesLine("tables/Customer.tbl.yaml:3")).toEqual({
      id: "tables/Customer.tbl.yaml",
      matchCount: 3,
    });
  });

  it("normalizes backslashes to forward slashes", () => {
    expect(parseCountMatchesLine("tables\\Customer.tbl.yaml:1")).toEqual({
      id: "tables/Customer.tbl.yaml",
      matchCount: 1,
    });
  });

  it("strips a leading './'", () => {
    expect(parseCountMatchesLine("./Customer.tbl.yaml:2")).toEqual({
      id: "Customer.tbl.yaml",
      matchCount: 2,
    });
  });

  it("strips a trailing carriage return", () => {
    expect(parseCountMatchesLine("Customer.tbl.yaml:2\r")).toEqual({
      id: "Customer.tbl.yaml",
      matchCount: 2,
    });
  });

  it("returns null for a blank line", () => {
    expect(parseCountMatchesLine("")).toBeNull();
  });

  it("returns null when there is no colon", () => {
    expect(parseCountMatchesLine("no-colon-here")).toBeNull();
  });

  it("returns null when the count doesn't round-trip through parseInt (e.g. leading zero)", () => {
    // documents current behavior: "03" parses to 3 but String(3) !== "03"
    expect(parseCountMatchesLine("file.txt:03")).toBeNull();
  });
});

describe("parseCountMatchesOutput", () => {
  it("parses multiple lines and skips malformed/blank ones", () => {
    const stdout = "a.yaml:1\n\nb.yaml:2\nmalformed-line\nc.yaml:10\n";
    expect(parseCountMatchesOutput(stdout)).toEqual([
      { id: "a.yaml", matchCount: 1 },
      { id: "b.yaml", matchCount: 2 },
      { id: "c.yaml", matchCount: 10 },
    ]);
  });
});
