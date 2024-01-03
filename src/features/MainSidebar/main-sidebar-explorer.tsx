///import { openProject } from "@/API/project-api/project-api";
import { openProject } from "@/API/project-api/project-api";
import {
  selectProjectPath,
  selectProjectStructure,
} from "@/API/project-api/project-api.slice";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { Tree } from "react-arborist";

function FileViewer() {
  const projectPath = useAppSelector(selectProjectPath);
  const projectStructure = useAppSelector(selectProjectStructure);
  const dispatch = useAppDispatch();

  return (
    <div className="flex flex-col max-h-full overflow-hidden">
      <button onClick={() => openProject(dispatch)}>Select Folder</button>
      <div className="flex flex-col h-screen">
        <h3 className="h-16 flex-none bg-slate-700">
          Files in selected folder:
        </h3>
        <span className="h-16 flex-none bg-green-700">{projectPath}</span>
        <div className="flex-1 overflow-auto flex flex-col">
          {
            ////JSON.stringify([projectStructure])
          }
          {projectStructure == null ? "" : <Tree data={[projectStructure]} />}
        </div>
      </div>
    </div>
  );
}

function MainSidebarExplorer() {
  return <FileViewer />;
}

export default MainSidebarExplorer;
