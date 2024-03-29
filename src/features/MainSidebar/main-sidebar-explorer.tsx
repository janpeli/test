///import { openProject } from "@/API/project-api/project-api";
import { openProject } from "@/API/project-api/project-api";
import {
  selectProjectPath,
  selectProjectStructure,
} from "@/API/project-api/project-api.slice";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Arborist } from "../../components/ui/treeview/Arborist";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      {projectPath ? (
        <>
          <ScrollArea
            style={{
              width: "100%",
              height: windowSize.height - 109,
              //backgroundColor: "lightblue",
            }}
          >
            {projectStructure == null ? (
              ""
            ) : (
              <Arborist
                projectStructure={projectStructure}
                height={windowSize.height - 170}
              />
            )}
          </ScrollArea>
        </>
      ) : (
        <Button onClick={() => openProject(dispatch)}>Select Folder</Button>
      )}
    </div>
  );

  ///<FileViewer />;
}

export default MainSidebarExplorer;
