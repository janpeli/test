import { selectProjectPath } from "@/API/project-api/project-api.selectors";
import { useAppSelector } from "@/hooks/hooks";

import Treeview from "@/components/ui/treeview/treeview";
import {
  createFolderContextCommands,
  createNodeContextCommands,
} from "@/API/editor-api/commands";
import { NodeController } from "@/components/ui/treeview/tree/controllers/node-controller";
import { TreeController } from "@/components/ui/treeview/tree/controllers/tree-controller";
import { openFileById } from "@/API/editor-api/editor-api";
import { explorerOnSelect } from "@/API/GUI-api/main-sidebar-api";
import { moveProjectNode } from "@/API/project-api/project-api";
import { store, type RootState } from "@/app/store";
import { Plugin, ProjectStructure } from "electron/src/project";
import { FileIcon } from "@/lib/file-icon";
import React, { useMemo } from "react";

function handleDblClick(node: NodeController) {
  if (!node.data.isLeaf) return;
  openFileById(node.data.id);
}

function makeNodeContextCommands(suppressRootCommands: boolean) {
  return (node: NodeController) => {
    // The synthetic project-root container (AI panel) has no file operations of
    // its own; create/rename/delete act on individual files and folders instead.
    if (suppressRootCommands && node.parent === null) return [];
    if (!node.data.isLeaf) return createFolderContextCommands(node.data.id);
    const commands = createNodeContextCommands(node.data.id);
    return commands ? commands : [];
  };
}

function getNodeIcon(node: NodeController): React.ReactNode {
  if (!node.data.isLeaf) return null;
  const data = node.data as ProjectStructure;
  const plugins = store.getState().projectAPI.plugins as Plugin[];
  return (
    <FileIcon name={data.name} sufix={data.sufix} plugin_uuid={data.plugin_uuid} plugins={plugins} />
  );
}

type SidebarTreePanelProps = {
  label: string;
  structureSelector: (state: RootState) => ProjectStructure | null;
  treeCallBack: (tree: TreeController) => void;
  /** AI panel: suppress the context menu on the synthetic root container. */
  suppressRootCommands?: boolean;
};

function SidebarTreePanel({
  label,
  structureSelector,
  treeCallBack,
  suppressRootCommands = false,
}: SidebarTreePanelProps) {
  const projectPath = useAppSelector(selectProjectPath);
  const structure = useAppSelector(structureSelector);
  const nodeContextCommands = useMemo(
    () => makeNodeContextCommands(suppressRootCommands),
    [suppressRootCommands]
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="h-7 flex-none flex items-center px-2.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">
          {label}
        </span>
      </div>
      {projectPath && structure ? (
        <div className="flex flex-col flex-1 min-h-0">
          <Treeview
            projecStructure={structure}
            nodeContextCommands={nodeContextCommands}
            onDblClick={handleDblClick}
            treeCallBack={treeCallBack}
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

export default SidebarTreePanel;
