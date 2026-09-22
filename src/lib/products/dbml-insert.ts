import { store } from "@/app/store";
import { ProjectStructure } from "electron/src/project";
import { findProjectStructureById } from "@/API/project-api/utils";
import { setFileContent } from "@/API/editor-api/editor-api.slice";
import { addErrorMessage } from "@/API/GUI-api/status-panel-api";
import { getFileContentFromState } from "@/lib/canvas/get-canvas-content";
import { resolveProductContext, loadObjectData } from "./resolve-references";

/**
 * Inserts an object into a DBML diagram by rendering the object type's
 * *basic DBML* product (the one flagged `basic_dbml: true`, expected to emit
 * a standalone DBML `Table { }` block) and appending it to the file's content.
 *
 * v1 behaviour, matching insertObjectIntoCanvas: appends the rendered block
 * (DBML, like Mermaid, has no stable text-position mapping for drop
 * coordinates — the diagram's own dagre auto-layout places the new table on
 * next render). Unlike the Mermaid canvas, no header is seeded — plain DBML
 * needs none. Objects whose type declares no basic DBML product are a
 * graceful no-op.
 */
export async function insertObjectIntoDbml(
  objectId: string,
  dbmlFileId: string
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
  const product = baseObject?.products?.find((p) => p.basic_dbml);
  // No basic DBML product (e.g. a non-droppable object type) — nothing to insert.
  if (!product) return;

  const data = await loadObjectData(objectId);
  const context = await resolveProductContext(data);
  const result = await window.project.renderProduct({
    template: product.definition,
    context,
  });

  if (result.error) {
    addErrorMessage(
      `Could not insert "${node.name}" into diagram: ${result.error}`,
      "error"
    );
    return;
  }

  const block = (result.text ?? "").trim();
  if (!block) return;

  const existing = (getFileContentFromState(dbmlFileId) ?? "").trim();
  const newContent = `${existing.length ? `${existing}\n\n` : ""}${block}\n`;
  store.dispatch(setFileContent({ fileId: dbmlFileId, content: newContent }));
}
