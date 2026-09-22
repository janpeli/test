// Store/IPC-bound persistence for the DBML diagram's sidecar layout file. The
// git-friendly parse/serialize logic itself is pure (dbml-layout-file.core.ts,
// unit-tested); this module is the thin wrapper that reads the project folder
// from Redux and does the actual file I/O over the existing generic
// getFileContent/saveFileContent IPC (no dedicated channel needed — the
// sidecar is just another file under the project folder).

import { store } from "@/app/store";
import {
  DbmlLayoutFile,
  emptyDbmlLayoutFile,
  parseDbmlLayoutFile,
  serializeDbmlLayoutFile,
  sidecarPathFor,
} from "./dbml-layout-file.core";

export async function readDbmlLayout(dbmlFileId: string): Promise<DbmlLayoutFile> {
  const folderPath = store.getState().projectAPI.folderPath;
  if (!folderPath) return emptyDbmlLayoutFile();
  try {
    const { content } = await window.project.getFileContent({
      filePath: sidecarPathFor(dbmlFileId),
      folderPath,
    });
    return parseDbmlLayoutFile(content);
  } catch {
    // No sidecar yet (first time this file is opened) — start empty.
    return emptyDbmlLayoutFile();
  }
}

export async function writeDbmlLayout(
  dbmlFileId: string,
  layout: DbmlLayoutFile
): Promise<void> {
  const folderPath = store.getState().projectAPI.folderPath;
  if (!folderPath) return;
  await window.project.saveFileContent({
    filePath: sidecarPathFor(dbmlFileId),
    folderPath,
    content: serializeDbmlLayoutFile(layout),
  });
}
