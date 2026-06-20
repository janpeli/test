import {
  selectProjectPath,
  selectProjectStructureforAI,
} from "@/API/project-api/project-api.selectors";
import { useAppSelector } from "@/hooks/hooks";
import { Separator } from "@/components/ui/separator";

import Treeview from "@/components/ui/treeview/treeview";
import {
  createFolderContextCommands,
  createNodeContextCommands,
} from "@/API/editor-api/commands";
import { NodeController } from "@/components/ui/treeview/tree/controllers/node-controller";
import { openFileById } from "@/API/editor-api/editor-api";
import {
  explorerOnSelect,
  set_MAIN_SIDEBAR_AI_TREE,
} from "@/API/GUI-api/main-sidebar-api";
import { moveProjectNode } from "@/API/project-api/project-api";
import { store } from "@/app/store";
import { Plugin, ProjectStructure } from "electron/src/project";
import { FileIcon } from "@/lib/file-icon";
import React from "react";

function handleDblClick(node: NodeController) {
  if (!node.data.isLeaf) return;
  openFileById(node.data.id);
}

function nodeContextCommands(node: NodeController) {
  // The synthetic project-root container has no file operations of its own;
  // create/rename/delete act on the .claude folder and individual files instead.
  if (node.parent === null) return [];
  if (!node.data.isLeaf) return createFolderContextCommands(node.data.id);
  const commands = createNodeContextCommands(node.data.id);
  return commands ? commands : [];
}

function getNodeIcon(node: NodeController): React.ReactNode {
  if (!node.data.isLeaf) return null;
  const data = node.data as ProjectStructure;
  const plugins = store.getState().projectAPI.plugins as Plugin[];
  return (
    <FileIcon name={data.name} sufix={data.sufix} plugin_uuid={data.plugin_uuid} plugins={plugins} />
  );
}

function MainSidebarAI() {
  const projectPath = useAppSelector(selectProjectPath);
  const aiStructure = useAppSelector(selectProjectStructureforAI);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-2 pt-1 flex-none h-7">
        <span>AI</span>
      </div>
      <Separator className="my-2" />
      {projectPath && aiStructure ? (
        <div className=" flex-1 ">
          <Treeview
            projecStructure={aiStructure}
            nodeContextCommands={nodeContextCommands}
            onDblClick={handleDblClick}
            treeCallBack={set_MAIN_SIDEBAR_AI_TREE}
            onSelect={explorerOnSelect}
            allowDragDrop={true}
            onNodesMove={moveProjectNode}
            getNodeIcon={getNodeIcon}
          />
        </div>
      ) : null}
    </div>
  );
}

export default MainSidebarAI;
