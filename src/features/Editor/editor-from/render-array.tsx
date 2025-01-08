import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { Control, useFieldArray } from "react-hook-form";
import RenderFormField from "./render-form-field";

export default function RenderArray({
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
    // a table should go here
    <div key={zodKey} className="mb-4 p-2 flex flex-col">
      {fields.map((item, index) => (
        <div key={item.id} className="border p-4 mb-2 rounded-md flex-row flex">
          {Array.isArray(fieldSchema.items) || !fieldSchema.items ? null : (
            <RenderFormField
              key={`${zodKey}.${index}`}
              zodKey={`${zodKey}.${index}`}
              schemaField={fieldSchema.items}
              formControl={formControl}
            />
          )}

          <button
            type="button"
            onClick={() => remove(index)}
            className="mt-2 text-red-500 hover:underline"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({})}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
      >
        Add {fieldSchema.title || fieldSchema.description || zodKey}
      </button>
    </div>
  );
}
