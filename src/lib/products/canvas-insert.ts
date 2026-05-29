import { store } from "@/app/store";
import { ProjectStructure } from "electron/src/project";
import { findProjectStructureById } from "@/API/project-api/utils";
import { setFileContent } from "@/API/editor-api/editor-api.slice";
import { addErrorMessage } from "@/API/GUI-api/status-panel-api";
import { resolveProductContext, loadObjectData } from "./resolve-references";

/**
 * Reads a file's current content out of the editor state (the source of truth
 * for canvas files, which are edited as raw text rather than through a form).
 */
function getFileContentFromState(fileId: string): string | undefined {
  for (const editor of store.getState().editorAPI.editors) {
    const file = editor.editedFiles.find((f) => f.id === fileId);
    if (file) return file.content;
  }
  return undefined;
}

/**
 * Inserts an object into a canvas file by rendering the object type's *basic*
 * product (the one flagged `basic: true`, expected to emit Mermaid-compatible
 * text) and appending it to the canvas content.
 *
 * v1 behaviour: appends the rendered block (Mermaid has no stable text-position
 * mapping for drop coordinates). When the canvas is empty an `erDiagram` header
 * is seeded so the first dropped entity renders. Objects whose type declares no
 * basic product are a graceful no-op.
 */
export async function insertObjectIntoCanvas(
  objectId: string,
  canvasFileId: string
): Promise<void> {
  const state = store.getState();
  const projectStructure = state.projectAPI
    .projectStructure as ProjectStructure | null;
  if (!projectStructure) return;

  const node = findProjectStructureById(projectStructure, objectId);
  if (!node || node.isFolder) return;

  const plugin = state.projectAPI.plugins?.find(
    (p) => p.uuid === node.plugin_uuid
  );
  const baseObject = plugin?.base_objects.find((o) => o.sufix === node.sufix);
  const product = baseObject?.products?.find((p) => p.basic);
  // No basic product (e.g. a non-droppable object type) — nothing to insert.
  if (!product) return;

  const data = await loadObjectData(objectId);
  const context = await resolveProductContext(data);
  const result = await window.project.renderProduct({
    template: product.definition,
    context,
  });

  if (result.error) {
    addErrorMessage(
      `Could not insert "${node.name}" into canvas: ${result.error}`,
      "error"
    );
    return;
  }

  const block = (result.text ?? "").trim();
  if (!block) return;

  const existing = (getFileContentFromState(canvasFileId) ?? "").trim();
  const newContent = `${existing.length ? existing : "erDiagram"}\n${block}\n`;
  store.dispatch(setFileContent({ fileId: canvasFileId, content: newContent }));
}
