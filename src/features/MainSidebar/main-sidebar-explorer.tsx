import {
  selectProjectPath,
  selectProjectStructureforModels,
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

function handleDblClick(node: NodeController) {
  if (!node.data.isLeaf) return;
  openFileById(node.data.id);
}

function nodeContextCommands(node: NodeController) {
  if (!node.data.isLeaf) return createFolderContextCommands(node.data.id);
  const commands = createNodeContextCommands(node.data.id);
  return commands ? commands : [];
}

function MainSidebarExplorer() {
  const projectPath = useAppSelector(selectProjectPath);
  const projectStructure = useAppSelector(selectProjectStructureforModels);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-2 pt-1 flex-none h-7">
        <span>EXPLORER</span>
      </div>
      <Separator className="my-2" />
      {projectPath && projectStructure ? (
        <div className=" flex-1 ">
          <Treeview
            projecStructure={projectStructure}
            nodeContextCommands={nodeContextCommands}
            onDblClick={handleDblClick}
          />
        </div>
      ) : null}
    </div>
  );

  ///<FileViewer />;
}

export default MainSidebarExplorer;
