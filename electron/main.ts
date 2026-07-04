import { app, BrowserWindow } from "electron";
import path from "node:path";
import fs from "node:fs";
import installExtension, {
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import setupIPCMain from "./src/project";

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, "../public");

let win: BrowserWindow | null;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

interface WindowState {
  bounds: { x: number; y: number; width: number; height: number };
  isMaximized: boolean;
}

function getWindowState(): Partial<WindowState> {
  const stateFile = path.join(app.getPath("userData"), "window-state.json");
  try {
    const data = fs.readFileSync(stateFile, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function saveWindowState(win: BrowserWindow): void {
  const bounds = win.isMaximized() ? win.getNormalBounds() : win.getBounds();
  const state: WindowState = {
    bounds,
    isMaximized: win.isMaximized(),
  };
  const stateFile = path.join(app.getPath("userData"), "window-state.json");
  fs.writeFileSync(stateFile, JSON.stringify(state));
}

function createWindow() {
  const savedState = getWindowState();

  win = new BrowserWindow({
    width: savedState.bounds?.width ?? 900,
    height: savedState.bounds?.height ?? 700,
    x: savedState.bounds?.x,
    y: savedState.bounds?.y,
    minHeight: 700,
    minWidth: 800,
    autoHideMenuBar: true,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
    },
  });

  if (savedState.isMaximized) {
    win.maximize();
  }

  win.on("close", () => {
    saveWindowState(win!);
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    console.log("Loading URL: ", VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, "index.html"));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  if (VITE_DEV_SERVER_URL) {
    installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS])
      .then(([redux, react]) =>
        console.log(`Added Extensions:  ${redux.name}, ${react.name}`)
      )
      .catch((err) => console.log("An error occurred: ", err));
  }

  setupIPCMain();

  createWindow();
});
