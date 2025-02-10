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
      <div className="px-2 pt-1 flex-none h-7">
        <span className=" uppercase">Plugins</span>
      </div>
      <Separator className="my-2" />
      {projectPath && projectStructure ? (
        <div className=" flex-1 ">
          <Treeview
            projecStructure={projectStructure}
            onDblClick={handleDblClick}
            nodeContextCommands={nodeContextCommands}
          />
        </div>
      ) : null}
    </div>
  );

  ///<FileViewer />;
}

export default MainSidebarPlugins;
