import { useState } from "react";

function FileViewer() {
  const [folderPath, setFolderPath] = useState("");
  const [files, setFiles] = useState([]);

  const selectFolder = async () => {
    try {
      const selectedFolder = await window.project.openFolderDialog();
      if (selectedFolder) {
        setFolderPath(selectedFolder);
        const folderContents = await window.project.getFolderContents(
          selectedFolder
        );
        setFiles(folderContents);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="flex flex-col max-h-full overflow-hidden">
      <button onClick={selectFolder}>Select Folder</button>
      <div className="flex flex-col h-screen">
        <h3 className="h-16 flex-none bg-slate-700">
          Files in selected folder:
        </h3>
        <span className="h-16 flex-none bg-green-700">{folderPath}</span>
        <ul className="flex-1 overflow-auto flex flex-col">
          {files.map((file, index) => (
            <li key={index} className="flex-none">
              {file}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MainSidebarExplorer() {
  return <FileViewer />;
}

export default MainSidebarExplorer;
