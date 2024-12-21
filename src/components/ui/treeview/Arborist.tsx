import { Tree, TreeApi } from "./arborist/index";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FilePlus, FolderPlus } from "lucide-react";
import { ProjectStructure } from "electron/src/project";
import { Input } from "@/components/ui/input";
import { Node } from "./Node";

export const Arborist = ({
  projectStructure,
  height,
}: {
  projectStructure: ProjectStructure; // |null
  height: number;
}) => {
  const [term, setTerm] = useState("");
  const treeRef = useRef<TreeApi<ProjectStructure>>(null);

  function handleCreateFolder() {
    if (treeRef.current) {
      treeRef.current.createInternal();
    }
  }

  function handleCreateFile() {
    if (treeRef.current) {
      treeRef.current.createLeaf();
    }
  }

  const createFileFolder = (
    <>
      <Button
        variant={"ghost"}
        size={"sm"}
        onClick={handleCreateFile}
        title="New Folder..."
      >
        <FolderPlus />
      </Button>
      <Button
        variant={"ghost"}
        size={"sm"}
        onClick={handleCreateFolder}
        title="New File..."
      >
        <FilePlus />
      </Button>
    </>
  );

  return (
    <>
      <div className="flex">
        <Input
          type="text"
          placeholder="Search..."
          className="search-input flex-1 ml-1"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <div className="folderFileActions">{createFileFolder}</div>
      </div>

      <Tree
        ref={treeRef}
        data={[projectStructure]}
        width={320}
        height={height}
        indent={12}
        rowHeight={24}
        // openByDefault={false}
        searchTerm={term}
        searchMatch={(node, term) =>
          node.data.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .includes(
              term
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
            )
        }
      >
        {Node}
      </Tree>
    </>
  );
};
