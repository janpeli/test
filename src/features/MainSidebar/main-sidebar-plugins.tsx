import {
  selectProjectPath,
  selectProjectStructureforPlugins,
} from "@/API/project-api/project-api.selectors";
import { useAppSelector } from "@/hooks/hooks";
import { Separator } from "@/components/ui/separator";

import Treeview from "@/components/ui/treeview/treeview";
import { NodeController } from "@/components/ui/treeview/tree/controllers/node-controller";
import { openFileById } from "@/API/editor-api/editor-api";
import { createNodeContextCommands } from "@/API/editor-api/commands";
import { Plus, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openAddPluginModal } from "@/API/GUI-api/modal-api";
import { set_MAIN_SIDEBAR_PLUGINS_TREE } from "@/API/GUI-api/main-sidebar-api";
import { refreshPlugins } from "@/API/project-api/project-api";

function handleDblClick(node: NodeController) {
  if (!node.data.isLeaf) return;
  openFileById(node.data.id);
}

function nodeContextCommands(node: NodeController) {
  if (!node.data.isLeaf) return [];
  const commands = createNodeContextCommands(node.data.id);
  return commands ? commands : [];
}

function MainSidebarPlugins() {
  const projectPath = useAppSelector(selectProjectPath);
  const projectStructure = useAppSelector(selectProjectStructureforPlugins);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex flex-row justify-between px-2 pt-1 flex-none h-7">
        <span className="uppercase flex-none">Plugins</span>
        <div className="flex flex-row">
          <Button
            variant="outline"
            disabled={projectPath ? false : true}
            className="h-7 w-7 p-1"
            onClick={() => openAddPluginModal()}
          >
            <Plus className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            disabled={projectPath ? false : true}
            className="h-7 w-7 p-1"
            onClick={() => refreshPlugins()}
          >
            <RefreshCcw className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <Separator className="my-2" />
      {projectPath && projectStructure ? (
        <div className=" flex-1 ">
          <Treeview
            projecStructure={projectStructure}
            onDblClick={handleDblClick}
            nodeContextCommands={nodeContextCommands}
            treeCallBack={set_MAIN_SIDEBAR_PLUGINS_TREE}
          />
        </div>
      ) : null}
    </div>
  );

  ///<FileViewer />;
}

export default MainSidebarPlugins;
