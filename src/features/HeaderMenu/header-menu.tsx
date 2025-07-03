import { closeFile, openFileById } from "@/API/editor-api/editor-api";
import { selectActiveIdProjectNode } from "@/API/GUI-api/active-context.slice";
import {
  openCreateFolderModal,
  openCreateModelModal,
  openCreateObjectModal,
  openCreateProjectModal,
} from "@/API/GUI-api/modal-api";
import { closeProject, openProject } from "@/API/project-api/project-api";
import { selectProjectName } from "@/API/project-api/project-api.selectors";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useAppSelector } from "@/hooks/hooks";

import { selectShowStatusPanel } from "@/API/GUI-api/status-panel.slice";
import { toggleStatusPanel } from "@/API/GUI-api/status-panel-api";

function MenubarDemo() {
  const projectName = useAppSelector(selectProjectName);
  const showPanel = useAppSelector(selectShowStatusPanel);
  const activeIdProjectNode = useAppSelector(selectActiveIdProjectNode);

  return (
    <Menubar className="border-0">
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            disabled={!projectName ? false : true}
            onClick={() => openProject()}
          >
            Open Project
          </MenubarItem>
          <MenubarItem
            disabled={projectName ? false : true}
            onClick={closeProject}
          >
            Close Project
          </MenubarItem>
          <MenubarItem
            disabled={projectName ? true : false}
            onClick={openCreateProjectModal}
          >
            New Project
          </MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Create</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem
                disabled={activeIdProjectNode ? false : true}
                onClick={() => openCreateFolderModal(activeIdProjectNode ?? "")}
              >
                Folder
              </MenubarItem>
              <MenubarItem
                disabled={activeIdProjectNode ? false : true}
                onClick={() => openCreateObjectModal(activeIdProjectNode ?? "")}
              >
                Object
              </MenubarItem>
              <MenubarItem
                disabled={activeIdProjectNode ? false : true}
                onClick={() => openCreateModelModal(activeIdProjectNode ?? "")}
              >
                Model
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem
            disabled={activeIdProjectNode ? false : true}
            onClick={() => openFileById(activeIdProjectNode ?? "")}
          >
            Open file
          </MenubarItem>

          <MenubarItem
            disabled={activeIdProjectNode ? false : true}
            onClick={() => closeFile(activeIdProjectNode ?? "")}
          >
            Close file
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Find</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>Search the web</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Find...</MenubarItem>
              <MenubarItem>Find Next</MenubarItem>
              <MenubarItem>Find Previous</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem>Cut</MenubarItem>
          <MenubarItem>Copy</MenubarItem>
          <MenubarItem>Paste</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem
            checked={showPanel}
            onClick={() => toggleStatusPanel()}
          >
            Status Panel
          </MenubarCheckboxItem>
          <MenubarItem inset>Hide Sidebar</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Profiles</MenubarTrigger>
        <MenubarContent>
          <MenubarRadioGroup value="benoit">
            <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
            <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
            <MenubarRadioItem value="Luis">Luis</MenubarRadioItem>
          </MenubarRadioGroup>
          <MenubarSeparator />
          <MenubarItem inset>Edit...</MenubarItem>
          <MenubarSeparator />
          <MenubarItem inset>Add Profile...</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

const HeaderMenu = () => {
  return <MenubarDemo />;
};

export default HeaderMenu;
