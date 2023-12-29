import { useAppSelector } from "@/hooks/hooks";
import { selectActiveMenu } from "./main-sidebar.slice";
import { cn } from "@/lib/utils";
import MainSidebarExplorer from "./main-sidebar-explorer";
import MainSidebarRepo from "./main-sidebar-repo";
import MainSidebarTechnology from "./main-sidebar-technology";

type ComponentMap = {
  [key: string]: JSX.Element;
};

function MainSidebar() {
  const menus: ComponentMap = {
    Explorer: <MainSidebarExplorer />,
    Technology: <MainSidebarTechnology />,
    Repo: <MainSidebarRepo />,
  };
  const activeMenu = useAppSelector(selectActiveMenu);

  return (
    <div
      className={cn(
        "flex-none w-52 border-r p-1",
        activeMenu == "off" ? " hidden" : ""
      )}
    >
      {Object.keys(menus).map((menuItem, index) => (
        <div key={index} className={activeMenu == menuItem ? " " : " hidden"}>
          {menus[menuItem]}
        </div>
      ))}
    </div>
  );
}

export default MainSidebar;
