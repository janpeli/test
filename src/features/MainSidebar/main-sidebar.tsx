import { useAppSelector } from "@/hooks/hooks";
import { selectActiveMenu } from "./main-sidebar.slice";
import { cn } from "@/lib/utils";

function MainSidebar() {
  const activeMenu = useAppSelector(selectActiveMenu);

  return (
    <div
      className={cn("w-52 border-r p-1", activeMenu == "off" ? " hidden" : "")}
    >
      {activeMenu}
    </div>
  );
}

export default MainSidebar;
