///import { openProject } from "@/API/project-api/project-api";
import { openProject } from "@/API/project-api/project-api";
import {
  selectProjectPath,
  selectProjectStructure,
} from "@/API/project-api/project-api.slice";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { Tree } from "react-arborist";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  FilePlus,
  FolderPlus,
  File,
  Folder,
  ChevronDown,
  ChevronRight,
  Pencil,
  X,
} from "lucide-react";
import { ProjectStructure } from "electron/src/project";

const Node = ({ node, style, dragHandle, tree }) => {
  const CustomIcon = node.data.icon;
  const iconColor = node.data.iconColor;

  // console.log(node, tree);
  return (
    <div
      className={`group node-container flex items-center h-full w-full ${
        node.state.isSelected ? "isSelected" : ""
      }`}
      style={style}
      ref={dragHandle}
    >
      <div
        className="node-content flex items-center h-full w-full"
        onClick={() => node.isInternal && node.toggle()}
      >
        {node.isLeaf ? (
          <>
            <span className="arrow w-5 text-xl flex"></span>
            <span className="file-folder-icon mr-2 flex items-center text-xl">
              {CustomIcon ? (
                <CustomIcon color={iconColor ? iconColor : "#6bc7f6"} />
              ) : (
                <File color="#6bc7f6" />
              )}
            </span>
          </>
        ) : (
          <>
            <span className="arrow">
              {node.isOpen ? <ChevronDown /> : <ChevronRight />}
            </span>
            <span className="file-folder-icon">
              {CustomIcon ? (
                <CustomIcon color={iconColor ? iconColor : "#f6cf60"} />
              ) : (
                <Folder />
              )}
            </span>
          </>
        )}
        <span className="node-text flex-1">
          {node.isEditing ? (
            <input
              type="text"
              defaultValue={node.data.name}
              onFocus={(e) => e.currentTarget.select()}
              onBlur={() => node.reset()}
              onKeyDown={(e) => {
                if (e.key === "Escape") node.reset();
                if (e.key === "Enter") node.submit(e.currentTarget.value);
              }}
              autoFocus
            />
          ) : (
            <span>{node.data.name}</span>
          )}
        </span>
      </div>

      <div className="file-actions h-full hidden group-hover:flex">
        <div className="folderFileActions flex flex-row items-center mr-2">
          <button
            className="flex items-center text-base h-full w-5"
            onClick={() => node.edit()}
            title="Rename..."
          >
            <Pencil />
          </button>
          <button
            className="flex items-center text-base h-full w-5"
            onClick={() => tree.delete(node.id)}
            title="Delete"
          >
            <X />
          </button>
        </div>
      </div>
    </div>
  );
};

const Arborist = ({
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
        <input
          type="text"
          placeholder="Search..."
          className="search-input flex-1"
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
        indent={24}
        rowHeight={32}
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

function MainSidebarExplorer() {
  const projectPath = useAppSelector(selectProjectPath);
  const projectStructure = useAppSelector(selectProjectStructure);
  const dispatch = useAppDispatch();

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="flex flex-col flex-1">
      <div className="px-2 pt-1">EXPLORER</div>
      <Separator className="my-2" />
      {projectPath ? (
        <>
          <div
            style={{
              width: "100%",
              height: windowSize.height - 109,
              //backgroundColor: "lightblue",
            }}
          >
            {projectStructure == null ? (
              ""
            ) : (
              <Arborist
                projectStructure={projectStructure}
                height={windowSize.height - 170}
              />
            )}
          </div>
        </>
      ) : (
        <Button onClick={() => openProject(dispatch)}>Select Folder</Button>
      )}
    </div>
  );

  ///<FileViewer />;
}

export default MainSidebarExplorer;
