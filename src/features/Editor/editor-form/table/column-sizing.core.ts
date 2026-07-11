// Pure, dependency-free column sizing logic for editor-form tables.
//
// Only a `import type` of JSONSchema is used here: type-only imports are
// erased by the TS/esbuild transform (no runtime module is pulled in), so
// this file stays testable under Vitest without touching the Electron/store
// world. See CLAUDE.md's "*.core.ts" convention.
import type { JSONSchema } from "@/lib/JSONSchemaToZod";

/**
 * The JSONSchema type doesn't declare `maxLength` (not used elsewhere in the
 * app), but plugin authors can set it per the JSON Schema meta-schema
 * (data/plugins/meta-schemas/json-schema.meta.schema.json). Extend locally
 * rather than widening the shared type for one consumer.
 */
export type ColumnSchema = JSONSchema & { maxLength?: number };

export interface ColumnSizing {
  /** CSS width for the column's <col>. Every column is fixed-width: the
   * table pins its own width to the sum, so a resize drag moves exactly the
   * dragged boundary instead of being re-absorbed by a flexible column. */
  width: string;
}

const BOOLEAN_WIDTH = "70px";
const NUMBER_WIDTH = "100px";
const ENUM_STRING_WIDTH = "160px";
const REFERENCE_WIDTH = "180px";
const TAG_ARRAY_WIDTH = "200px";
const SHORT_STRING_WIDTH = "130px";
const STRING_WIDTH = "300px";
const FALLBACK_WIDTH = "140px";

/** Strings at or below this length don't need much room and can be given a
 * modest fixed width instead of flexing like unbounded strings. */
const SHORT_STRING_MAX_LENGTH = 20;

/** Maps a table column's schema to a CSS width for its `<col>` element. */
export function getColumnSizing(schema: ColumnSchema): ColumnSizing {
  // Tag field: array of strings (see isTableColumn's own array special-case).
  if (
    schema.items &&
    !Array.isArray(schema.items) &&
    schema.items.type === "string"
  ) {
    return { width: TAG_ARRAY_WIDTH };
  }

  switch (schema.type) {
    case "boolean":
      return { width: BOOLEAN_WIDTH };

    case "number":
    case "integer":
      return { width: NUMBER_WIDTH };

    case "string":
      if (schema.enum && schema.enum.length) {
        return { width: ENUM_STRING_WIDTH };
      }
      if (
        typeof schema.maxLength === "number" &&
        schema.maxLength <= SHORT_STRING_MAX_LENGTH
      ) {
        return { width: SHORT_STRING_WIDTH };
      }
      return { width: STRING_WIDTH };

    case "object":
      // Reference / sub-reference columns (isTableColumn admits object only
      // when one of these formats is set).
      return { width: REFERENCE_WIDTH };

    case "array":
      return { width: TAG_ARRAY_WIDTH };

    default:
      return { width: FALLBACK_WIDTH };
  }
}

/** Same predicate table.tsx/table-header.tsx/main-row.tsx already used
 * inline — relocated here so column list + sizing derive from one place. */
export function isTableColumn(schemaField: ColumnSchema): boolean {
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

/**
 * Ordered `[name, schema]` pairs for the columns rendered by the table —
 * i.e. the properties of an items schema that pass `isTableColumn`, in
 * declaration order. Header, body rows, and the <colgroup> all iterate this
 * same list so column indices never drift apart.
 */
export function getTableColumns(
  itemsSchema: JSONSchema | JSONSchema[] | undefined
): [string, ColumnSchema][] {
  if (!itemsSchema || Array.isArray(itemsSchema) || !itemsSchema.properties) {
    return [];
  }

  return Object.entries(itemsSchema.properties).filter(([, schema]) =>
    isTableColumn(schema)
  );
}
