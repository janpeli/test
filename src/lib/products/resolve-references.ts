import { store } from "@/app/store";
import { getFileContentById } from "@/API/editor-api/editor-api";
import yaml from "yaml";
import { resolveReferences } from "./resolve-references.core";

/**
 * Store-bound product reference resolution.
 *
 * Resolves the cross-file references embedded in an object's data into plain
 * data for a product template (see `resolve-references.core.ts` for the pure
 * algorithm and the resolved shape).
 */

/**
 * Loads an object's data by file id, preferring live form data (so the product
 * view tracks unsaved edits) and falling back to the persisted YAML on disk.
 * Returns an empty object when the file is missing or unparseable.
 */
export async function loadObjectData(
  id: string
): Promise<Record<string, unknown>> {
  const forms = store.getState().editorForms;
  if (forms[id]) return forms[id] as Record<string, unknown>;
  try {
    const content = await getFileContentById(id);
    return (yaml.parse(content ?? "") as Record<string, unknown>) ?? {};
  } catch {
    return {};
  }
}

/**
 * Resolves `$reference` / `$sub_reference` nodes in an object's data into plain
 * data suitable for a product template's context.
 *
 * @param data  The object's own data (live form data or parsed YAML).
 * @param depth Maximum levels of `$reference` indirection to follow. Defaults to
 *              1 (direct references only).
 */
export async function resolveProductContext(
  data: object,
  depth: number = 1
): Promise<object> {
  return resolveReferences(data, loadObjectData, {
    depth,
    onUnresolved: (id) => {
      if (import.meta.env.DEV) {
        console.warn(`[products] could not resolve $reference "${id}"`);
      }
    },
  });
}
