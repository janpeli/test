import { Tree } from "react-arborist";
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
  projectStructure: ProjectStructure | null;
  height: number;
}) => {
  const [term, setTerm] = useState("");
  const treeRef = useRef(null);

  const createFileFolder = (
    <>
      <Button
        variant={"ghost"}
        size={"sm"}
        onClick={() => treeRef.current.createInternal()}
        title="New Folder..."
      >
        <FolderPlus />
      </Button>
      <Button
        variant={"ghost"}
        size={"sm"}
        onClick={() => treeRef.current.createLeaf()}
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
          node.data.name.toLowerCase().includes(term.toLowerCase())
        }
      >
        {Node}
      </Tree>
    </>
  );
};
