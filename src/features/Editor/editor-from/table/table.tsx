import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { Control, useFieldArray } from "react-hook-form";

import { TableHeader } from "./table-header";
import { TableRow } from "./table-row";
import { useMemo } from "react";

export function Table({
  zodKey,
  fieldSchema,
  formControl,
}: {
  zodKey: string;
  fieldSchema: JSONSchema;
  formControl: Control;
}) {
  const { fields, append, remove } = useFieldArray({
    control: formControl,
    name: zodKey,
  });

  const columnCount = useMemo(() => {
    return fieldSchema.items &&
      !Array.isArray(fieldSchema.items) &&
      fieldSchema.items.properties
      ? Object.entries(fieldSchema.items.properties).reduce((acc, item) => {
          return item[1].type !== "array" && item[1].type !== "object"
            ? acc + 1
            : acc;
        }, 0)
      : 0;
  }, [fieldSchema]);

  const nestedCount = useMemo(() => {
    return fieldSchema.items &&
      !Array.isArray(fieldSchema.items) &&
      fieldSchema.items.properties
      ? Object.entries(fieldSchema.items.properties).reduce((acc, item) => {
          return item[1].type === "array" || item[1].type === "object"
            ? acc + 1
            : acc;
        }, 0)
      : 0;
  }, [fieldSchema]);

  return (
    <>
      <table className="min-w-full divide-y divide-gray-200">
        <TableHeader fieldSchema={fieldSchema} nestedCount={nestedCount} />
        <tbody className="bg-white divide-y divide-gray-200">
          {fields.map((item, index) => (
            <TableRow
              key={item.id}
              item={item}
              index={index}
              zodKey={zodKey}
              fieldSchema={fieldSchema}
              formControl={formControl}
              remove={remove}
              columnCount={columnCount}
              nestedCount={nestedCount}
            />
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={() => append({})}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
      >
        Add {fieldSchema.title || fieldSchema.description || zodKey}
      </button>
    </>
  );
}
