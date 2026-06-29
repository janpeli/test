import { selectProjectStructureforAI } from "@/API/project-api/project-api.selectors";
import { set_MAIN_SIDEBAR_AI_TREE } from "@/API/GUI-api/main-sidebar-api";
import SidebarTreePanel from "./main-sidebar-tree-panel";

function MainSidebarAI() {
  return (
    <SidebarTreePanel
      label="AI"
      structureSelector={selectProjectStructureforAI}
      treeCallBack={set_MAIN_SIDEBAR_AI_TREE}
      suppressRootCommands
    />
  );
}

export default MainSidebarAI;
