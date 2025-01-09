import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { useState } from "react";
import { Control, useFieldArray } from "react-hook-form";
import RenderFormField from "../render-form-field";
import { X } from "lucide-react";
import { TableHeader } from "./table-header";

export function Table({
  zodKey,
  fieldSchema,
  formControl,
}: {
  zodKey: string;
  fieldSchema: JSONSchema;
  formControl: Control;
}) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const { fields, append, remove } = useFieldArray({
    control: formControl,
    name: zodKey,
  });

  //console.log(expandedRows);
  const toggleRow = (id: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  return (
    <>
      <table className="min-w-full divide-y divide-gray-200">
        <TableHeader fieldSchema={fieldSchema} />
        <tbody className="bg-white divide-y divide-gray-200">
          {fields.map((item, index) => (
            <tr key={item.id}>
              <td key="open" className="px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    toggleRow(index);
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      expandedRows.has(index) ? " rotate-180 " : ""
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </td>
              {fieldSchema.items &&
                !Array.isArray(fieldSchema.items) &&
                fieldSchema.items.properties &&
                Object.entries(fieldSchema.items.properties).map(
                  ([name, item]) => {
                    if (item.type !== "array" && item.type !== "object")
                      return (
                        <td key={`${zodKey}.${index}.${name}`}>
                          <RenderFormField
                            key={`${zodKey}.${index}.${name}`}
                            zodKey={`${zodKey}.${index}.${name}`}
                            schemaField={item}
                            formControl={formControl}
                          />
                        </td>
                      );
                  }
                )}

              <td key="remove" className="px-6 py-4">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                >
                  <X />
                </button>
              </td>
            </tr>
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
