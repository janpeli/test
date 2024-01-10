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

function FileViewer() {
  const projectPath = useAppSelector(selectProjectPath);
  const projectStructure = useAppSelector(selectProjectStructure);
  const dispatch = useAppDispatch();

  return (
    <div className="flex flex-col max-h-full overflow-hidden">
      <button onClick={() => openProject(dispatch)}>Select Folder</button>
      <div className="flex flex-col ">
        <h3 className="h-16 flex-none bg-slate-700">
          Files in selected folder:
        </h3>
        <span className="h-16 flex-none bg-green-700">{projectPath}</span>
        <div className="flex-1 overflow-auto flex flex-col">
          {
            ////JSON.stringify([projectStructure])
          }
          {projectStructure == null ? "" : <Tree data={[projectStructure]} />}
        </div>
      </div>
    </div>
  );
}

const Node = ({ node, style, dragHandle, tree }) => {
  const CustomIcon = node.data.icon;
  const iconColor = node.data.iconColor;

  // console.log(node, tree);
  return (
    <div
      className={`node-container flex items-center h-full w-full ${
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
        <span className="node-text">
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

      <div className="file-actions">
        <div className="folderFileActions">
          <button onClick={() => node.edit()} title="Rename...">
            <Pencil />
          </button>
          <button onClick={() => tree.delete(node.id)} title="Delete">
            <X />
          </button>
        </div>
      </div>
    </div>
  );
};

const Arborist = ({
  projectStructure,
}: {
  projectStructure: ProjectStructure | null;
}) => {
  const [term, setTerm] = useState("");
  const treeRef = useRef(null);

  const createFileFolder = (
    <>
      <button
        onClick={() => treeRef.current.createInternal()}
        title="New Folder..."
      >
        <FolderPlus />
      </button>
      <button onClick={() => treeRef.current.createLeaf()} title="New File...">
        <FilePlus />
      </button>
    </>
  );

  return (
    <div>
      <div className="folderFileActions">{createFileFolder}</div>
      <input
        type="text"
        placeholder="Search..."
        className="search-input"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      <Tree
        ref={treeRef}
        data={[projectStructure]}
        width={260}
        height={1000}
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
    </div>
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
              backgroundColor: "lightblue",
            }}
          >
            <Arborist projectStructure={projectStructure} />
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
