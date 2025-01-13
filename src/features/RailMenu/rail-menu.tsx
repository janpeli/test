import { useAppSelector, useAppDispatch } from "@/hooks/hooks";
import {
  setActiveMenu,
  selectActiveMenu,
} from "../../API/GUI-api/main-sidebar.slice";
import { RailMenuGroup } from "./rail-menu-group";
import { RailMenuItem } from "./rail-menu-item";
import {
  Box,
  FolderGit2,
  FolderTree,
  Settings,
  SquareUser,
} from "lucide-react";

type MenuItem = {
  name: string;
  icon: React.ReactNode;
  menuGroup: number;
};

type MenuItems = MenuItem[];

function RailMenu() {
  const activeMenu = useAppSelector(selectActiveMenu);
  const dispatch = useAppDispatch();

  //TODO: premiestnit do vlastneho file najlepsie tahat z configu, icony pojdu do assetov ako svg a samotna icona bude bude v configu ako text
  const menuItems: MenuItems = [
    { name: "Explorer", icon: <FolderTree />, menuGroup: 1 },
    { name: "Plugins", icon: <Box />, menuGroup: 1 },
    { name: "Repo", icon: <FolderGit2 />, menuGroup: 1 },
    { name: "Settings", icon: <Settings />, menuGroup: 2 },
    { name: "Account", icon: <SquareUser />, menuGroup: 2 },
  ];

  const distinctMenuGroups: number[] = [
    ...new Set(menuItems.map((item) => item.menuGroup)),
  ];

  return (
    <nav
      className="flex-shrink-0 w-20 border-r" /*"flex-none flex flex-col justify-between items-center border-r w-20 overflow-hidden"*/
      role="menu"
    >
      <div className="h-full flex flex-col justify-between items-center">
        {distinctMenuGroups.map((grp) => (
          <RailMenuGroup key={grp}>
            {menuItems
              .filter((item) => item.menuGroup == grp)
              .map((item, index) => (
                <RailMenuItem
                  key={index}
                  desc={item.name}
                  icon={item.icon}
                  active={activeMenu == item.name}
                  onClick={() =>
                    dispatch(
                      setActiveMenu(item.name == activeMenu ? "off" : item.name)
                    )
                  }
                />
              ))}
          </RailMenuGroup>
        ))}
      </div>
    </nav>
  );
}

export default RailMenu;
