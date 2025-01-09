import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { cn } from "@/lib/utils";
import { useState } from "react";
import RenderFormField from "../render-form-field";
import { Control, UseFieldArrayRemove } from "react-hook-form";
import { X } from "lucide-react";

export function TableRow(props: {
  item: Record<"id", string>;
  index: number;
  fieldSchema: JSONSchema;
  zodKey: string;
  formControl: Control;
  remove: UseFieldArrayRemove;
  columnCount: number;
  nestedCount: number;
}) {
  const [toggleRow, setToggleRow] = useState<boolean>(false);

  return (
    <>
      <MainRow toggleRow={toggleRow} setToggleRow={setToggleRow} {...props} />
      <ExpandedRow toggleRow={toggleRow} {...props} />
    </>
  );
}

function ExpandedRow({
  columnCount,
  toggleRow,
  item,
  index,
  fieldSchema,
  zodKey,
  formControl,
  nestedCount,
}: {
  columnCount: number;
  toggleRow: boolean;
  item: Record<"id", string>;
  index: number;
  fieldSchema: JSONSchema;
  zodKey: string;
  formControl: Control;
  nestedCount: number;
}) {
  return (
    <>
      {nestedCount ? (
        <tr
          id={item.id + "-exp"}
          className={cn(" bg-gray-50 ", !toggleRow && "hidden")}
        >
          <td colSpan={columnCount + 2} className="px-6 py-4">
            {fieldSchema.items &&
              !Array.isArray(fieldSchema.items) &&
              fieldSchema.items.properties &&
              Object.entries(fieldSchema.items.properties).map(
                ([name, item]) => {
                  if (item.type === "array" || item.type === "object")
                    return (
                      <RenderFormField
                        key={`${zodKey}.${index}.${name}`}
                        zodKey={`${zodKey}.${index}.${name}`}
                        schemaField={item}
                        formControl={formControl}
                      />
                    );
                }
              )}
          </td>
        </tr>
      ) : null}
    </>
  );
}

function MainRow({
  setToggleRow,
  toggleRow,
  item,
  index,
  fieldSchema,
  zodKey,
  formControl,
  remove,
  nestedCount,
}: {
  setToggleRow: (a: boolean) => void;
  toggleRow: boolean;
  item: Record<"id", string>;
  index: number;
  fieldSchema: JSONSchema;
  zodKey: string;
  formControl: Control;
  remove: UseFieldArrayRemove;
  nestedCount: number;
}) {
  return (
    <tr key={item.id}>
      {nestedCount ? (
        <td key="open" className="px-6 py-4">
          <button
            type="button"
            onClick={() => {
              setToggleRow(!toggleRow);
            }}
            className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                toggleRow ? " rotate-180 " : ""
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
      ) : null}
      {fieldSchema.items &&
        !Array.isArray(fieldSchema.items) &&
        fieldSchema.items.properties &&
        Object.entries(fieldSchema.items.properties).map(([name, item]) => {
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
        })}

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
  );
}
