import { app } from "electron";
import path from "path";

// Get the correct path whether in development or production
export const getDataPath = () => {
  if (app.isPackaged) {
    // In production - use the path to the resources directory
    return path.join(app.getAppPath(), "../", "data", "your-data-file.json");
    // Alternative approach:
    // return path.join(path.dirname(app.getAppPath()), 'data', 'your-data-file.json');
  } else {
    // In development
    return path.join(__dirname, "../data", "your-data-file.json"); // Adjust based on your project structure
  }
};
