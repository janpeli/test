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
import { moveProjectNode, copyProjectNodes } from "@/API/project-api/project-api";
import {
  setClipboardMirror,
  clearClipboardMirror,
} from "@/API/GUI-api/clipboard.slice";
import { Commands } from "@/API";
import { store, type RootState } from "@/app/store";
import { Plugin, ProjectStructure } from "electron/src/project";
import { FileIcon } from "@/lib/file-icon";
import React, { useMemo } from "react";

function handleDblClick(node: NodeController) {
  if (!node.data.isLeaf) return;
  openFileById(node.data.id);
}

// Mirror a tree's clipboard into Redux so the menubar's Edit menu can reactively
// enable/disable Paste. Wired on both Explorer and AI panels; the most recent
// clipboard action wins ("global clipboard" semantics).
function mirrorClipboard(ids: string[], mode: "copy" | "cut" | null) {
  if (ids.length && mode) {
    store.dispatch(setClipboardMirror({ ids, mode }));
  } else {
    store.dispatch(clearClipboardMirror());
  }
}

// Cut/Copy are each gated on the matching tree handler (onNodesMove/onNodesCopy,
// both present on Explorer/AI); Paste only when something is on the clipboard.
// Disabled trees (Plugins) show none. Acts on the current selection when the
// node is part of it.
function clipboardCommands(node: NodeController): Commands {
  const commands: Commands = [];
  if (node.tree.onNodesMove) {
    commands.push({
      displayName: "Cut",
      description: "Cut this item",
      contextGroup: ["File"],
      action: async () => node.tree.cutNodes(node),
    });
  }
  if (node.tree.onNodesCopy) {
    commands.push({
      displayName: "Copy",
      description: "Copy this item",
      contextGroup: ["File"],
      action: async () => node.tree.copyNodes(node),
    });
  }
  if (
    node.tree.clipboardIds.length > 0 &&
    (node.tree.onNodesCopy || node.tree.onNodesMove)
  ) {
    commands.push({
      displayName: "Paste",
      description: "Paste clipboard item(s) here",
      contextGroup: ["File"],
      action: async () => node.tree.paste(node),
    });
  }
  return commands;
}

function makeNodeContextCommands(suppressRootCommands: boolean) {
  return (node: NodeController) => {
    // The synthetic project-root container (AI panel) has no file operations of
    // its own; create/rename/delete act on individual files and folders instead.
    if (suppressRootCommands && node.parent === null) return [];
    // Delete acts on the whole multi-selection when the right-clicked node is
    // part of it (mirrors handleDragStart / setClipboard); otherwise just itself.
    const deleteIds =
      node.tree.selectedNodes.has(node) && node.tree.selectedNodes.size > 1
        ? [...node.tree.selectedNodes].map((n) => n.data.id)
        : [node.data.id];
    const base = node.data.isLeaf
      ? createNodeContextCommands(node.data.id, deleteIds) ?? []
      : createFolderContextCommands(node.data.id, deleteIds);
    return [...base, ...clipboardCommands(node)];
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
            onNodesCopy={copyProjectNodes}
            onClipboardChange={mirrorClipboard}
            getNodeIcon={getNodeIcon}
          />
        </div>
      ) : null}
    </div>
  );
}

export default SidebarTreePanel;
