import type { ProjectIpcContract } from "electron/src/project";

// `window.project` is exactly the IPC contract — the single definition the main
// handlers and the preload bridge also derive from (electron/src/project/ipc-contract.ts).
export type IprojectAPI = ProjectIpcContract;

declare global {
  interface Window {
    project: IprojectAPI;
  }
}
