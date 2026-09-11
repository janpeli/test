import { selectProjectStructureforAI } from "@/API/project-api/project-api.selectors";
import { set_MAIN_SIDEBAR_AI_TREE } from "@/API/GUI-api/main-sidebar-api";
import { refreshProjectStructure } from "@/API/project-api/project-tree";
import SidebarTreePanel from "./main-sidebar-tree-panel";

function MainSidebarAI() {
  return (
    <SidebarTreePanel
      label="AI"
      structureSelector={selectProjectStructureforAI}
      treeCallBack={set_MAIN_SIDEBAR_AI_TREE}
      rootCommands="none"
      onRefresh={refreshProjectStructure}
    />
  );
}

export default MainSidebarAI;
