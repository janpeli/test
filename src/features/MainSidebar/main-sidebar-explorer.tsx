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
    <div>
      <button onClick={selectFolder}>Select Folder</button>
      <div>
        <h3>Files in selected folder:</h3>
        <span>{folderPath}</span>
        <ul>
          {files.map((file, index) => (
            <li key={index}>{file}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MainSidebarExplorer() {
  return (
    <div>
      <FileViewer />
    </div>
  );
}

export default MainSidebarExplorer;
