import { useAppSelector } from "@/hooks/hooks";
import { selectActiveMenu } from "../../API/GUI-api/main-sidebar.slice";
import { cn } from "@/lib/utils";
import MainSidebarExplorer from "./main-sidebar-explorer";
import MainSidebarRepo from "./main-sidebar-repo";
import MainSidebarPlugins from "./main-sidebar-plugins";
import ResizeHandle from "./resize-handle";
import { MouseEventHandler, useRef, useState } from "react";
import ProjectPicker from "../ProjectPicker/project-picker";

type ComponentMap = {
  [key: string]: JSX.Element;
};

const menus: ComponentMap = {
  Explorer: <MainSidebarExplorer />,
  Plugins: <MainSidebarPlugins />,
  Repo: <MainSidebarRepo />,
};

function MainSidebar() {
  const activeMenu = useAppSelector(selectActiveMenu);

  const [sidebarWidth, setSidebarWidth] = useState(300);

  const sidebarRef = useRef<HTMLDivElement>(null);

  const rsMouseDownHandler: MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const x = e.clientX;

    const sbWidth = sidebarRef.current
      ? window.getComputedStyle(sidebarRef.current).width
      : "300";
    const initialWidth = parseInt(sbWidth, 10);

    const mouseMoveHandler = (e: MouseEvent) => {
      //const dx = x - e.clientX; // Resize from left to right
      const dx = e.clientX - x; // Resix=ze from right to left
      const newWidth = initialWidth + dx;
      const screenwidth = window.innerWidth;

      if (newWidth <= screenwidth - 400 && newWidth >= 300) {
        setSidebarWidth(newWidth);
      }
    };

    const mouseUpHandler = () => {
      document.removeEventListener("mouseup", mouseUpHandler);
      document.removeEventListener("mousemove", mouseMoveHandler);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  };

  return (
    <>
      <aside
        className={cn(
          "flex-none flex flex-col p-0 flex-shrink-0 overflow-hidden",
          activeMenu == "off" ? "hidden" : ""
        )}
        style={{ width: `${sidebarWidth}px` }}
        ref={sidebarRef}
      >
        {Object.keys(menus).map((menuItem, index) => (
          <div
            key={index}
            className={cn(
              "flex flex-col flex-1",
              activeMenu == menuItem ? " " : "hidden"
            )}
          >
            {menus[menuItem]}
          </div>
        ))}
        <ProjectPicker />
      </aside>
      <ResizeHandle onMouseDownHandler={rsMouseDownHandler} />
    </>
  );
}

MainSidebar.displayName = "MainSidebar";

export default MainSidebar;
