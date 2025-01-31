import { JSONSchema } from "@/lib/JSONSchemaToZod";

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
    schemaField.format === "reference"
  ) {
    return true;
  }

  return false;
}
