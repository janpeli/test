import { ipcRenderer, contextBridge } from "electron";
import { METHOD_CHANNELS, type ProjectIpcContract } from "../project/ipc-contract";

// Build the exposed `window.project.*` object by looping over the single IPC
// contract: every method becomes a thin `ipcRenderer.invoke(channel, ...args)`
// wrapper. Adding/removing a channel in ipc-contract.ts updates this bridge
// automatically — no per-method boilerplate to keep in sync.
export function setupContextBridges() {
  const api = Object.fromEntries(
    Object.entries(METHOD_CHANNELS).map(([method, channel]) => [
      method,
      (...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
    ]),
  ) as ProjectIpcContract;

  contextBridge.exposeInMainWorld("project", api);
}
