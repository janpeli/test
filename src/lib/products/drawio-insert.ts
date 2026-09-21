import { store } from "@/app/store";
import { ProjectStructure } from "electron/src/project";
import { findProjectStructureById } from "@/API/project-api/utils";
import { setFileContent } from "@/API/editor-api/editor-api.slice";
import { addErrorMessage } from "@/API/GUI-api/status-panel-api";
import { getFileContentFromState } from "@/lib/canvas/get-canvas-content";
import { mergeCellsIntoDiagram } from "@/lib/canvas/drawio-insert.core";
import { DRAWIO_EMPTY_DIAGRAM } from "@/features/Editor/drawio-editor/drawio-embed.core";
import { resolveProductContext, loadObjectData } from "./resolve-references";

/**
 * Inserts an object into a drawio diagram by rendering the object type's
 * `basic_drawio` product (raw `<mxCell>` fragment) and splicing it into the
 * diagram's `<root>`. Mirrors `canvas-insert.ts`'s `insertObjectIntoCanvas`;
 * see PLUGIN_GUIDE.md's "Basic product for drawio" section for the template
 * contract. Pushing the merged XML through `setFileContent` (no `fromSource`)
 * reuses DrawioFrame's existing SOURCE→DRAWIO sync — no new iframe protocol.
 */
export async function insertObjectIntoDrawio(
  objectId: string,
  drawioFileId: string
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
  const product = baseObject?.products?.find((p) => p.basic_drawio);
  // No basic_drawio product (e.g. a non-droppable object type) — nothing to insert.
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

  const fragment = (result.text ?? "").trim();
  if (!fragment) return;

  const existing = getFileContentFromState(drawioFileId);
  const diagramXml =
    existing && existing.trim().length > 0 ? existing : DRAWIO_EMPTY_DIAGRAM;

  // objectId is a relative file path (see ProjectStructure.id) — sanitize to
  // a token safe inside an unescaped XML double-quoted attribute value.
  const idSeed = objectId.replace(/[^A-Za-z0-9_-]/g, "_");
  const merged = mergeCellsIntoDiagram(diagramXml, fragment, { idSeed });

  if ("error" in merged) {
    addErrorMessage(
      `Could not insert "${node.name}" into diagram: ${merged.error}`,
      "error"
    );
    return;
  }

  store.dispatch(
    setFileContent({ fileId: drawioFileId, content: merged.xml })
  );
}
