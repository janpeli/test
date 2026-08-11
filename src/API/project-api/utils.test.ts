import { describe, expect, it } from "vitest";
import { ProjectStructure } from "electron/src/project";
import {
  buildExplorerStructure,
  isModelRootFolder,
  PROJECT_ROOT_ID,
  validateNewChildName,
} from "./utils";

function folder(id: string, name = id): ProjectStructure {
  return {
    id,
    isOpen: false,
    name,
    isFolder: true,
    isLeaf: false,
    children: [],
    sufix: "",
    plugin_uuid: "",
  };
}

function file(id: string, name: string, sufix: string): ProjectStructure {
  return {
    id,
    isOpen: false,
    name,
    isFolder: false,
    isLeaf: true,
    sufix,
    plugin_uuid: "",
  };
}

function root(children: ProjectStructure[]): ProjectStructure {
  return {
    id: "C:/projects/demo",
    isOpen: true,
    name: "demo",
    isFolder: true,
    isLeaf: false,
    children,
    sufix: "",
    plugin_uuid: "",
  };
}

describe("isModelRootFolder", () => {
  it("accepts any folder name, not just models", () => {
    expect(isModelRootFolder(folder("models"))).toBe(true);
    expect(isModelRootFolder(folder("staging"))).toBe(true);
    expect(isModelRootFolder(folder("Data Warehouse"))).toBe(true);
  });

  it("rejects the plugins folder", () => {
    expect(isModelRootFolder(folder("plugins"))).toBe(false);
  });

  // The reader strips a leading-dot stem to an empty name, so these must be
  // matched by id — and .git/.vscode must stay out of the Explorer too.
  it("rejects dot-folders", () => {
    expect(isModelRootFolder(folder(".claude", ""))).toBe(false);
    expect(isModelRootFolder(folder(".git", ""))).toBe(false);
    expect(isModelRootFolder(folder(".vscode", ""))).toBe(false);
  });

  it("rejects root-level files", () => {
    expect(isModelRootFolder(file("project.yaml", "project", "yaml"))).toBe(
      false
    );
    expect(isModelRootFolder(file("CLAUDE.md", "CLAUDE", "md"))).toBe(false);
  });
});

describe("validateNewChildName", () => {
  const structure = root([
    folder("models"),
    folder("plugins"),
    folder(".claude", ""),
    file("project.yaml", "project", "yaml"),
  ]);
  structure.children
    ?.find((c) => c.id === "models")
    ?.children?.push(folder("models/customer", "customer"));

  it("rejects 'plugins' (any case) at the project root", () => {
    expect(validateNewChildName("plugins", PROJECT_ROOT_ID, structure)).toMatch(
      /reserved/
    );
    expect(validateNewChildName("Plugins", PROJECT_ROOT_ID, structure)).toMatch(
      /reserved/
    );
  });

  it("rejects dot-names at the project root", () => {
    expect(validateNewChildName(".foo", PROJECT_ROOT_ID, structure)).toMatch(
      /reserved/
    );
  });

  it("rejects a name already taken at the project root, case-insensitively", () => {
    expect(validateNewChildName("models", PROJECT_ROOT_ID, structure)).toMatch(
      /already exists/
    );
    expect(validateNewChildName("MODELS", PROJECT_ROOT_ID, structure)).toMatch(
      /already exists/
    );
    expect(
      validateNewChildName("project.yaml", PROJECT_ROOT_ID, structure)
    ).toMatch(/already exists/);
  });

  it("rejects a name already taken inside a subfolder", () => {
    expect(validateNewChildName("customer", "models", structure)).toMatch(
      /already exists/
    );
  });

  it("allows a fresh name at the root and in subfolders", () => {
    expect(validateNewChildName("staging", PROJECT_ROOT_ID, structure)).toBeNull();
    expect(validateNewChildName("orders", "models", structure)).toBeNull();
  });

  it("allows 'plugins' and dot-names below the root", () => {
    expect(validateNewChildName("plugins", "models", structure)).toBeNull();
    expect(validateNewChildName(".foo", "models", structure)).toBeNull();
  });
});

describe("buildExplorerStructure", () => {
  it("keeps every model folder as a sibling root child", () => {
    const structure = buildExplorerStructure(
      root([
        folder("models"),
        folder("staging"),
        folder("plugins"),
        folder(".claude", ""),
        file("project.yaml", "project", "yaml"),
      ])
    );

    expect(structure?.children?.map((c) => c.id)).toEqual([
      "models",
      "staging",
    ]);
  });

  it("re-keys the root to the project-relative id so children line up", () => {
    const structure = buildExplorerStructure(root([folder("models")]));

    expect(structure?.id).toBe(PROJECT_ROOT_ID);
    expect(structure?.name).toBe("demo");
  });

  it("returns a root with no children rather than null when a project has no model folders", () => {
    const structure = buildExplorerStructure(root([folder("plugins")]));

    expect(structure).not.toBeNull();
    expect(structure?.children).toEqual([]);
  });

  it("returns null without a project", () => {
    expect(buildExplorerStructure(null)).toBeNull();
    expect(buildExplorerStructure(undefined)).toBeNull();
  });

  it("does not mutate the store's structure", () => {
    const original = root([folder("models"), folder("plugins")]);
    buildExplorerStructure(original);

    expect(original.children?.map((c) => c.id)).toEqual(["models", "plugins"]);
    expect(original.id).toBe("C:/projects/demo");
  });
});
