import { openProject } from "@/API/project-api/project-api";
import {
  selectProjectPath,
  selectProjectStructureforPlugins,
} from "@/API/project-api/project-api.slice";
import { useAppSelector } from "@/hooks/hooks";
import { Separator } from "@/components/ui/separator";

import { Button } from "@/components/ui/button";

import Treeview from "@/components/ui/treeview/treeview";

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
          <Treeview projecStructure={projectStructure} />
        </div>
      ) : (
        <Button onClick={() => openProject()}>Select Folder</Button>
      )}
    </div>
  );

  ///<FileViewer />;
}

export default MainSidebarPlugins;
