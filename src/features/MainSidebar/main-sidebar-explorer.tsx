import { selectProjectStructureforExplorer } from "@/API/project-api/project-api.selectors";
import { set_MAIN_SIDEBAR_EXPLORER_TREE } from "@/API/GUI-api/main-sidebar-api";
import SidebarTreePanel from "./main-sidebar-tree-panel";

function MainSidebarExplorer() {
  return (
    <SidebarTreePanel
      label="EXPLORER"
      structureSelector={selectProjectStructureforExplorer}
      treeCallBack={set_MAIN_SIDEBAR_EXPLORER_TREE}
      rootCommands="create"
    />
  );
}

export default MainSidebarExplorer;
