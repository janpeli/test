import { describe, expect, it } from "vitest";
import type { ProjectStructure } from "electron/src/project";
import { buildIconMetaMap, extensionOf } from "./icon-meta.core";

function leaf(
  id: string,
  sufix: string,
  plugin_uuid: string | null
): ProjectStructure {
  return {
    id,
    isOpen: false,
    name: id.split("/").pop() ?? id,
    isFolder: false,
    isLeaf: true,
    sufix,
    plugin_uuid,
  };
}

function folder(
  id: string,
  children: ProjectStructure[]
): ProjectStructure {
  return {
    id,
    isOpen: false,
    name: id.split("/").pop() ?? id,
    isFolder: true,
    isLeaf: false,
    children,
    sufix: "",
    plugin_uuid: null,
  };
}

describe("buildIconMetaMap", () => {
  it("maps every leaf across nested folders, skipping folder nodes", () => {
    const structure = folder("root", [
      leaf("a.md", "md", null),
      folder("tables", [
        leaf("tables/Customer.tbl.yaml", "tbl", "uuid-1"),
        folder("tables/deep", [leaf("tables/deep/x.ent.yaml", "ent", "uuid-2")]),
      ]),
    ]);

    const map = buildIconMetaMap(structure);
    expect(map.size).toBe(3);
    expect(map.get("a.md")).toEqual({ sufix: "md", plugin_uuid: null });
    expect(map.get("tables/Customer.tbl.yaml")).toEqual({
      sufix: "tbl",
      plugin_uuid: "uuid-1",
    });
    expect(map.get("tables/deep/x.ent.yaml")).toEqual({
      sufix: "ent",
      plugin_uuid: "uuid-2",
    });
    expect(map.has("tables")).toBe(false);
  });

  it("returns an empty map for a null structure", () => {
    expect(buildIconMetaMap(null).size).toBe(0);
  });
});

describe("extensionOf", () => {
  it("returns the extension after the last dot", () => {
    expect(extensionOf("Customer.tbl.yaml")).toBe("yaml");
  });

  it("returns '' when there is no dot", () => {
    expect(extensionOf("README")).toBe("");
  });

  it("returns '' for a trailing dot", () => {
    expect(extensionOf("weird.")).toBe("");
  });
});
