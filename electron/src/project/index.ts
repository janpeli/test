import { ipcMain, dialog } from "electron";
import fs from "node:fs";

export default function setupIPCMain() {
  ipcMain.on("get-folder-contents", async (event, folderPath) => {
    try {
      const files = await fs.promises.readdir(folderPath);
      event.reply("folder-contents", files);
    } catch (error: any) {
      event.reply("folder-contents-error", error.message);
    }
  });

  ipcMain.on("open-folder-dialog", async (event) => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      event.reply("folder-selected", result.filePaths[0]);
    }
  });
}
