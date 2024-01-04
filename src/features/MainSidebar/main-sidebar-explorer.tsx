///import { openProject } from "@/API/project-api/project-api";
import { openProject } from "@/API/project-api/project-api";
import {
  selectProjectPath,
  selectProjectStructure,
} from "@/API/project-api/project-api.slice";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { Tree } from "react-arborist";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

function FileViewer() {
  const projectPath = useAppSelector(selectProjectPath);
  const projectStructure = useAppSelector(selectProjectStructure);
  const dispatch = useAppDispatch();

  return (
    <div className="flex flex-col max-h-full overflow-hidden">
      <button onClick={() => openProject(dispatch)}>Select Folder</button>
      <div className="flex flex-col ">
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
  const projectPath = useAppSelector(selectProjectPath);
  const projectStructure = useAppSelector(selectProjectStructure);
  const dispatch = useAppDispatch();

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="flex flex-col flex-1">
      <div className="px-2 pt-1">EXPLORER</div>
      <Separator className="my-2" />
      <div
        style={{
          width: "100%",
          height: windowSize.height - 109,
          backgroundColor: "lightblue",
        }}
      ></div>
    </div>
  );

  ///<FileViewer />;
}

export default MainSidebarExplorer;
