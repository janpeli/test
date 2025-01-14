import {
  selectProjectPath,
  selectProjectStructureforModels,
} from "@/API/project-api/project-api.slice";
import { useAppSelector } from "@/hooks/hooks";
import { Separator } from "@/components/ui/separator";

import Treeview from "@/components/ui/treeview/treeview";

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
          <Treeview projecStructure={projectStructure} />
        </div>
      ) : null}
    </div>
  );

  ///<FileViewer />;
}

export default MainSidebarExplorer;
