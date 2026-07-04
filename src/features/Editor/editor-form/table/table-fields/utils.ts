import { JSONSchema } from "@/lib/JSONSchemaToZod";

/**
 * Shared styling for inline-edit controls living inside a data-grid cell.
 * Strips the control's own border/shadow/radius so the table gridlines carry
 * the structure; a focus ring (inset) marks the cell being edited. Keeps the
 * dense 32px row height used across the table.
 */
export const inlineCellControl =
  "h-8 w-full rounded-none border-0 bg-transparent px-2.5 shadow-none " +
  "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring";

export function isTableColumn(schemaField: JSONSchema) {
  if (
    schemaField.items &&
    !Array.isArray(schemaField.items) &&
    schemaField.items.type === "string"
  ) {
    return true;
  }

  if (
    (schemaField.type !== "array" && schemaField.type !== "object") ||
    schemaField.format === "reference" ||
    schemaField.format === "sub-reference"
  ) {
    return true;
  }

  return false;
}
