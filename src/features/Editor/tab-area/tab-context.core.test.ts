import { describe, it, expect } from "vitest";
import { getCloseTargets, toAbsolutePath } from "./tab-context.core";

describe("getCloseTargets", () => {
  const tabs = ["a", "b", "c", "d"];

  it("returns every tab for 'all' regardless of anchor", () => {
    expect(getCloseTargets(tabs, "b", "all")).toEqual(["a", "b", "c", "d"]);
    expect(getCloseTargets(tabs, "missing", "all")).toEqual(tabs);
  });

  it("returns a copy for 'all', not the original array", () => {
    expect(getCloseTargets(tabs, "a", "all")).not.toBe(tabs);
  });

  it("returns tabs left of a middle anchor", () => {
    expect(getCloseTargets(tabs, "c", "left")).toEqual(["a", "b"]);
  });

  it("returns tabs right of a middle anchor", () => {
    expect(getCloseTargets(tabs, "b", "right")).toEqual(["c", "d"]);
  });

  it("returns [] for 'left' on the first tab", () => {
    expect(getCloseTargets(tabs, "a", "left")).toEqual([]);
  });

  it("returns [] for 'right' on the last tab", () => {
    expect(getCloseTargets(tabs, "d", "right")).toEqual([]);
  });

  it("returns [] for an anchor not in the list", () => {
    expect(getCloseTargets(tabs, "missing", "left")).toEqual([]);
    expect(getCloseTargets(tabs, "missing", "right")).toEqual([]);
  });

  it("returns [] for left/right with a single tab", () => {
    expect(getCloseTargets(["only"], "only", "left")).toEqual([]);
    expect(getCloseTargets(["only"], "only", "right")).toEqual([]);
  });
});

describe("toAbsolutePath", () => {
  it("joins a Windows folder with a relative id using backslashes", () => {
    expect(toAbsolutePath("C:\\projects\\demo", "models/foo/bar.yaml")).toBe(
      "C:\\projects\\demo\\models\\foo\\bar.yaml"
    );
  });

  it("does not double the separator when the folder has a trailing one", () => {
    expect(toAbsolutePath("C:\\projects\\demo\\", "models/bar.yaml")).toBe(
      "C:\\projects\\demo\\models\\bar.yaml"
    );
  });

  it("keeps forward slashes for a POSIX folder", () => {
    expect(toAbsolutePath("/home/user/demo", "models/foo/bar.yaml")).toBe(
      "/home/user/demo/models/foo/bar.yaml"
    );
    expect(toAbsolutePath("/home/user/demo/", "bar.yaml")).toBe(
      "/home/user/demo/bar.yaml"
    );
  });

  it("handles a top-level file id", () => {
    expect(toAbsolutePath("C:\\demo", "readme.md")).toBe("C:\\demo\\readme.md");
  });
});
