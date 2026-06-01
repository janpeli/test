import {
  selectProjectPath,
  selectProjectStructureforPlugins,
} from "@/API/project-api/project-api.selectors";
import { useAppSelector } from "@/hooks/hooks";
import { Separator } from "@/components/ui/separator";

import Treeview from "@/components/ui/treeview/treeview";
import { NodeController } from "@/components/ui/treeview/tree/controllers/node-controller";
import {
  openFileById,
  openFileByIdInOtherView,
} from "@/API/editor-api/editor-api";
import { Plus, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openAddPluginModal } from "@/API/GUI-api/modal-api";
import { set_MAIN_SIDEBAR_PLUGINS_TREE } from "@/API/GUI-api/main-sidebar-api";
import { refreshPlugins } from "@/API/project-api/project-api";
import { Commands } from "@/API";
import { ProjectStructure } from "electron/src/project";
import { findProjectStructureById } from "@/API/project-api/utils";
import { addErrorMessage } from "@/API/GUI-api/status-panel-api";

type PluginFileKind = "schema" | "product" | "template";

const KIND_SUFFIX: Record<PluginFileKind, string> = {
  schema: ".schm.yaml",
  product: ".njk",
  template: ".tmpl.yaml",
};

const KIND_SKELETON: Record<PluginFileKind, string> = {
  schema: '$schema: "https://json-schema.org/draft/2020-12/schema"\ntype: object\nproperties: {}\n',
  product: "{# Template for {{ general.name }} #}\n",
  template: "{}\n",
};

const KIND_SUBDIR: Record<PluginFileKind, string> = {
  schema: "definition",
  product: "product",
  template: "template",
};

function getTargetDir(folderNodeId: string, kind: PluginFileKind): string {
  const parts = folderNodeId.split("/");
  const lastName = parts[parts.length - 1];
  if (lastName === KIND_SUBDIR[kind]) return folderNodeId;
  // From plugin root (depth 2: plugins/<name>) or unrelated subfolder,
  // direct creation into the canonical subdirectory.
  const pluginRoot = parts.slice(0, 2).join("/");
  return pluginRoot + "/" + KIND_SUBDIR[kind];
}

function findUniqueName(
  targetDir: string,
  kind: PluginFileKind,
  pluginsRoot: ProjectStructure | null
): string {
  const suffix = KIND_SUFFIX[kind];
  const baseName = "new";
  const existing = pluginsRoot
    ? new Set((findProjectStructureById(pluginsRoot, targetDir)?.children ?? []).map((c) => c.name))
    : new Set<string>();

  let candidate = baseName + suffix;
  let counter = 2;
  while (existing.has(candidate)) {
    candidate = `${baseName}-${counter}${suffix}`;
    counter++;
  }
  return candidate;
}

async function createPluginFile(
  folderNodeId: string,
  kind: PluginFileKind,
  projectFolder: string,
  pluginsRoot: ProjectStructure | null
): Promise<void> {
  const targetDir = getTargetDir(folderNodeId, kind);
  const filename = findUniqueName(targetDir, kind, pluginsRoot);
  const relPath = targetDir + "/" + filename;

  const ok = await window.project.createPluginFile({
    filePath: relPath,
    folderPath: projectFolder,
    content: KIND_SKELETON[kind],
  });

  if (!ok) {
    addErrorMessage(`Failed to create ${filename}`, "error");
    return;
  }

  await refreshPlugins();
  openFileById(relPath);
}

function handleDblClick(node: NodeController) {
  if (!node.data.isLeaf) return;
  openFileById(node.data.id);
}

function buildContextCommands(
  node: NodeController,
  projectFolder: string | null,
  pluginsRoot: ProjectStructure | null
): Commands {
  if (node.data.isLeaf) {
    return [
      {
        displayName: "Open",
        description: "Open file in editor",
        contextGroup: ["File"],
        action: async () => openFileById(node.data.id),
      },
      {
        displayName: "Open In Other View",
        description: "Open file in other editor view",
        contextGroup: ["File"],
        action: async () => openFileByIdInOtherView(node.data.id),
      },
    ];
  }

  if (!projectFolder) return [];

  const folder = projectFolder;
  const root = pluginsRoot;

  return [
    {
      displayName: "New Definition Schema",
      description: "Create a new .schm.yaml schema definition file",
      contextGroup: ["Create"],
      action: () => createPluginFile(node.data.id, "schema", folder, root),
    },
    {
      displayName: "New Product Template",
      description: "Create a new .njk Nunjucks product template",
      contextGroup: ["Create"],
      action: () => createPluginFile(node.data.id, "product", folder, root),
    },
    {
      displayName: "New Template File",
      description: "Create a new .tmpl.yaml default-values template",
      contextGroup: ["Create"],
      action: () => createPluginFile(node.data.id, "template", folder, root),
    },
  ];
}

function MainSidebarPlugins() {
  const projectFolder = useAppSelector(selectProjectPath);
  const pluginsRoot = useAppSelector(selectProjectStructureforPlugins);

  function nodeContextCommands(node: NodeController): Commands {
    return buildContextCommands(node, projectFolder, pluginsRoot);
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex flex-row justify-between px-2 pt-1 flex-none h-7">
        <span className="uppercase flex-none">Plugins</span>
        <div className="flex flex-row">
          <Button
            variant="outline"
            disabled={projectFolder ? false : true}
            className="h-7 w-7 p-1"
            onClick={() => openAddPluginModal()}
          >
            <Plus className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            disabled={projectFolder ? false : true}
            className="h-7 w-7 p-1"
            onClick={() => refreshPlugins()}
          >
            <RefreshCcw className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <Separator className="my-2" />
      {projectFolder && pluginsRoot ? (
        <div className=" flex-1 ">
          <Treeview
            projecStructure={pluginsRoot}
            onDblClick={handleDblClick}
            nodeContextCommands={nodeContextCommands}
            treeCallBack={set_MAIN_SIDEBAR_PLUGINS_TREE}
          />
        </div>
      ) : null}
    </div>
  );
}

export default MainSidebarPlugins;
