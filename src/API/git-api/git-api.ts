import { store } from "@/app/store";
import {
  setGitInfo,
  setGitLoading,
  setGitError,
  clearGitInfo as clearGitInfoAction,
} from "./git-api.slice";
import { addErrorMessage } from "../GUI-api/status-panel-api";

/**
 * Re-reads git information for the currently open project folder and pushes it
 * into the `gitAPI` slice. A no-op (clears state) when no project is open.
 * Called on project open, on the Repo panel mounting, and from its refresh
 * button.
 */
export const refreshGitInfo = async () => {
  const folderPath = store.getState().projectAPI.folderPath;
  if (!folderPath) {
    clearGitInfo();
    return;
  }

  try {
    store.dispatch(setGitLoading(true));
    const info = await window.project.getGitInfo(folderPath);
    store.dispatch(setGitInfo(info));
  } catch (error) {
    const message = (error as Error).message;
    store.dispatch(setGitError(message));
    addErrorMessage(`Failed to read git information: ${message}`, "error");
  }
};

/**
 * Clears git state — used when the project is closed.
 */
export const clearGitInfo = () => {
  store.dispatch(clearGitInfoAction());
};
