import { IData } from "../interfaces";

function generateFolderStructure(): IData {
  const rootFolder: IData = {
    id: "/",
    name: "Root",
    isLeaf: false,
    children: [],
  };

  // Create main top-level folders
  const mainFolders = [
    "Documents",
    "Pictures",
    "Music",
    "Videos",
    "Projects",
    "Downloads",
    "Development",
  ];

  mainFolders.forEach((folderName) => {
    const mainFolder: IData = {
      id: `/${folderName}`,
      name: folderName,
      isLeaf: false,
      children: [],
    };

    // Add subfolders and files
    switch (folderName) {
      case "Documents":
        addDocumentSubfolders(mainFolder, `/Documents`);
        break;
      case "Pictures":
        addPictureSubfolders(mainFolder, `/Pictures`);
        break;
      case "Music":
        addMusicSubfolders(mainFolder, `/Music`);
        break;
      case "Videos":
        addVideoSubfolders(mainFolder, `/Videos`);
        break;
      case "Projects":
        addProjectSubfolders(mainFolder, `/Projects`);
        break;
      case "Downloads":
        addDownloadSubfolders(mainFolder, `/Downloads`);
        break;
      case "Development":
        addDevelopmentSubfolders(mainFolder, `/Development`);
        break;
    }

    rootFolder.children!.push(mainFolder);
  });

  return rootFolder;
}

function addDocumentSubfolders(parentFolder: IData, parentPath: string) {
  const subfolders = [
    "Work",
    "Personal",
    "Finances",
    "Research",
    "Certificates",
  ];

  subfolders.forEach((subfolder) => {
    const fullPath = `${parentPath}/${subfolder}`;
    const subFolderData: IData = {
      id: fullPath,
      name: subfolder,
      isLeaf: false,
      children: [],
    };

    // Add some leaf files
    const files = [
      "report.docx",
      "notes.txt",
      "summary.pdf",
      "presentation.pptx",
    ].map((fileName) => ({
      id: `${fullPath}/${fileName}`,
      name: fileName,
      isLeaf: true,
    }));

    subFolderData.children = files;
    parentFolder.children!.push(subFolderData);
  });
}

function addPictureSubfolders(parentFolder: IData, parentPath: string) {
  const subfolders = ["Vacations", "Family", "Landscapes", "Events"];

  subfolders.forEach((subfolder) => {
    const fullPath = `${parentPath}/${subfolder}`;
    const subFolderData: IData = {
      id: fullPath,
      name: subfolder,
      isLeaf: false,
      children: [],
    };

    // Add some image files
    const files = [
      "beach.jpg",
      "sunset.png",
      "mountains.jpeg",
      "group_photo.jpg",
    ].map((fileName) => ({
      id: `${fullPath}/${fileName}`,
      name: fileName,
      isLeaf: true,
    }));

    subFolderData.children = files;
    parentFolder.children!.push(subFolderData);
  });
}

function addMusicSubfolders(parentFolder: IData, parentPath: string) {
  const subfolders = ["Rock", "Jazz", "Classical", "Pop", "Electronic"];

  subfolders.forEach((subfolder) => {
    const fullPath = `${parentPath}/${subfolder}`;
    const subFolderData: IData = {
      id: fullPath,
      name: subfolder,
      isLeaf: false,
      children: [],
    };

    // Add some music files
    const files = [
      "song1.mp3",
      "track2.wav",
      "album.flac",
      "live_recording.mp3",
    ].map((fileName) => ({
      id: `${fullPath}/${fileName}`,
      name: fileName,
      isLeaf: true,
    }));

    subFolderData.children = files;
    parentFolder.children!.push(subFolderData);
  });
}

function addVideoSubfolders(parentFolder: IData, parentPath: string) {
  const subfolders = ["Movies", "TV Shows", "Documentaries", "Home Videos"];

  subfolders.forEach((subfolder) => {
    const fullPath = `${parentPath}/${subfolder}`;
    const subFolderData: IData = {
      id: fullPath,
      name: subfolder,
      isLeaf: false,
      children: [],
    };

    // Add some video files
    const files = [
      "movie1.mp4",
      "series_episode.mkv",
      "documentary.avi",
      "clip.mov",
    ].map((fileName) => ({
      id: `${fullPath}/${fileName}`,
      name: fileName,
      isLeaf: true,
    }));

    subFolderData.children = files;
    parentFolder.children!.push(subFolderData);
  });
}

function addProjectSubfolders(parentFolder: IData, parentPath: string) {
  const subfolders = ["Web", "Mobile", "Data Science", "Machine Learning"];

  subfolders.forEach((subfolder) => {
    const fullPath = `${parentPath}/${subfolder}`;
    const subFolderData: IData = {
      id: fullPath,
      name: subfolder,
      isLeaf: false,
      children: [],
    };

    // Add some project-related files and subfolders
    const projectItems: IData[] = [
      {
        id: `${fullPath}/Project1`,
        name: "Project1",
        isLeaf: false,
        children: [
          {
            id: `${fullPath}/Project1/src`,
            name: "src",
            isLeaf: false,
            children: [
              {
                id: `${fullPath}/Project1/src/index.ts`,
                name: "index.ts",
                isLeaf: true,
              },
              {
                id: `${fullPath}/Project1/src/utils.ts`,
                name: "utils.ts",
                isLeaf: true,
              },
            ],
          },
          {
            id: `${fullPath}/Project1/README.md`,
            name: "README.md",
            isLeaf: true,
          },
        ],
      },
      {
        id: `${fullPath}/notes.txt`,
        name: "notes.txt",
        isLeaf: true,
      },
    ];

    subFolderData.children = projectItems;
    parentFolder.children!.push(subFolderData);
  });
}

function addDownloadSubfolders(parentFolder: IData, parentPath: string) {
  const subfolders = ["Installers", "Archives", "Torrents", "Misc"];

  subfolders.forEach((subfolder) => {
    const fullPath = `${parentPath}/${subfolder}`;
    const subFolderData: IData = {
      id: fullPath,
      name: subfolder,
      isLeaf: false,
      children: [],
    };

    // Add some download-related files
    const files = [
      "setup.exe",
      "archive.zip",
      "data.tar.gz",
      "document.pdf",
    ].map((fileName) => ({
      id: `${fullPath}/${fileName}`,
      name: fileName,
      isLeaf: true,
    }));

    subFolderData.children = files;
    parentFolder.children!.push(subFolderData);
  });
}

function addDevelopmentSubfolders(parentFolder: IData, parentPath: string) {
  const subfolders = ["Languages", "Frameworks", "Libraries", "Tools"];

  subfolders.forEach((subfolder) => {
    const fullPath = `${parentPath}/${subfolder}`;
    const subFolderData: IData = {
      id: fullPath,
      name: subfolder,
      isLeaf: false,
      children: [],
    };

    // Add some development-related files and subfolders
    const devItems: IData[] = [
      {
        id: `${fullPath}/TypeScript`,
        name: "TypeScript",
        isLeaf: false,
        children: [
          {
            id: `${fullPath}/TypeScript/config.json`,
            name: "config.json",
            isLeaf: true,
          },
          {
            id: `${fullPath}/TypeScript/README.md`,
            name: "README.md",
            isLeaf: true,
          },
        ],
      },
      {
        id: `${fullPath}/notes.txt`,
        name: "notes.txt",
        isLeaf: true,
      },
    ];

    subFolderData.children = devItems;
    parentFolder.children!.push(subFolderData);
  });
}

// Generate the folder structure
const folderStructureData = generateFolderStructure();

// Count total nodes
function countNodes(node: IData): number {
  let count = 1; // Count the current node
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }
  return count;
}

console.log("Total nodes:", countNodes(folderStructureData));

export default folderStructureData;
