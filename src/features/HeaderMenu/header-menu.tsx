import { closeFile, openFileById } from "@/API/editor-api/editor-api";
import { selectActiveIdProjectNode } from "@/API/GUI-api/active-context.slice";
import {
  openCreateCanvasModal,
  openCreateFolderModal,
  openCreateMarkdownModal,
  openCreateSqlModal,
  openCreateModelModal,
  openCreateObjectModal,
  openCreateProjectModal,
  openDeleteModal,
  openRenameModal,
} from "@/API/GUI-api/modal-api";
import { closeProject, openProject } from "@/API/project-api/project-api";
import { selectProjectName } from "@/API/project-api/project-api.selectors";
import { selectClipboard } from "@/API/GUI-api/clipboard.slice";
import {
  menubarCopy,
  menubarCut,
  menubarPaste,
} from "@/API/GUI-api/clipboard-api";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";

import { selectShowStatusPanel } from "@/API/GUI-api/status-panel.slice";
import { toggleStatusPanel } from "@/API/GUI-api/status-panel-api";
import {
  selectActiveMenu,
  setActiveMenu,
} from "@/API/GUI-api/main-sidebar.slice";
import { toggleCommandPalette } from "@/API/GUI-api/command-palette.slice";
import { getShortcut } from "@/lib/shortcuts/registry";
import { formatChord } from "@/lib/shortcuts/shortcuts.core";
import { isMac } from "@/lib/shortcuts/use-global-shortcuts";

/** Renders the formatted chord for a registered shortcut, by id. */
function ShortcutHint({ id }: { id: string }) {
  const def = getShortcut(id);
  if (!def) return null;
  return <MenubarShortcut>{formatChord(def.chord, isMac)}</MenubarShortcut>;
}

function MenubarDemo() {
  const dispatch = useAppDispatch();
  const projectName = useAppSelector(selectProjectName);
  const showPanel = useAppSelector(selectShowStatusPanel);
  const activeMenu = useAppSelector(selectActiveMenu);
  const sidebarVisible = activeMenu !== "off";
  const activeIdProjectNode = useAppSelector(selectActiveIdProjectNode);
  const clipboard = useAppSelector(selectClipboard);

  return (
    <Menubar className="h-auto border-0 bg-transparent p-0 shadow-none space-x-0">
      <MenubarMenu>
        <MenubarTrigger className="h-6 px-1.5 text-xs font-normal text-muted-foreground">
          File
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            disabled={!projectName ? false : true}
            onClick={() => openProject()}
          >
            Open Project
            <ShortcutHint id="project.open" />
          </MenubarItem>
          <MenubarItem
            disabled={projectName ? false : true}
            onClick={closeProject}
          >
            Close Project
            <ShortcutHint id="project.close" />
          </MenubarItem>
          <MenubarItem
            disabled={projectName ? true : false}
            onClick={openCreateProjectModal}
          >
            New Project
            <ShortcutHint id="project.new" />
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
              <MenubarItem
                disabled={activeIdProjectNode ? false : true}
                onClick={() => openCreateMarkdownModal(activeIdProjectNode ?? "")}
              >
                Markdown
              </MenubarItem>
              <MenubarItem
                disabled={activeIdProjectNode ? false : true}
                onClick={() => openCreateCanvasModal(activeIdProjectNode ?? "")}
              >
                Canvas
              </MenubarItem>
              <MenubarItem
                disabled={activeIdProjectNode ? false : true}
                onClick={() => openCreateSqlModal(activeIdProjectNode ?? "")}
              >
                SQL
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem
            disabled={activeIdProjectNode ? false : true}
            onClick={() => openRenameModal(activeIdProjectNode ?? "")}
          >
            Rename
            <ShortcutHint id="file.rename" />
          </MenubarItem>

          <MenubarItem
            disabled={activeIdProjectNode ? false : true}
            onClick={() => openDeleteModal(activeIdProjectNode ?? "")}
          >
            Delete
            <ShortcutHint id="file.delete" />
          </MenubarItem>

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
            <ShortcutHint id="file.close" />
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger className="h-6 px-1.5 text-xs font-normal text-muted-foreground">
          Edit
        </MenubarTrigger>
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
          <MenubarItem disabled={!activeIdProjectNode} onClick={menubarCut}>
            Cut
            <MenubarShortcut>{isMac ? "⌘X" : "Ctrl+X"}</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled={!activeIdProjectNode} onClick={menubarCopy}>
            Copy
            <MenubarShortcut>{isMac ? "⌘C" : "Ctrl+C"}</MenubarShortcut>
          </MenubarItem>
          <MenubarItem
            disabled={clipboard.ids.length === 0}
            onClick={menubarPaste}
          >
            Paste
            <MenubarShortcut>{isMac ? "⌘V" : "Ctrl+V"}</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger className="h-6 px-1.5 text-xs font-normal text-muted-foreground">
          View
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => dispatch(toggleCommandPalette())}>
            Command Palette
            <ShortcutHint id="view.commandPalette" />
          </MenubarItem>
          <MenubarSeparator />
          <MenubarCheckboxItem
            checked={showPanel}
            onClick={() => toggleStatusPanel()}
          >
            Status Panel
            <ShortcutHint id="view.statusPanel" />
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            checked={sidebarVisible}
            onClick={() =>
              dispatch(setActiveMenu(sidebarVisible ? "off" : "Explorer"))
            }
          >
            Sidebar
            <ShortcutHint id="view.sidebar" />
          </MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

const HeaderMenu = () => {
  return <MenubarDemo />;
};

export default HeaderMenu;
