import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { Control, useFieldArray } from "react-hook-form";

import { TableHeader } from "./table-header";
import { TableRow } from "./table-row";

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

  return (
    <>
      <table className="min-w-full divide-y divide-gray-200">
        <TableHeader fieldSchema={fieldSchema} />
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
