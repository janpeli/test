import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { cn } from "@/lib/utils";
import { useState } from "react";
import RenderFormField from "../render-form-field";
import { Control, UseFieldArrayRemove } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import TableSingleField from "./table-single-field";
import { isTableColumn } from "./table-fields/utils";
import React from "react";

function TableRowComponent(props: {
  item: string;
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

const TableRow = React.memo(TableRowComponent);
TableRow.displayName = "TableRow";

export default TableRow;

function ExpandedRow({
  columnCount,
  toggleRow,
  item,
  index,
  fieldSchema,
  zodKey,

  nestedCount,
}: {
  columnCount: number;
  toggleRow: boolean;
  item: string;
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
          id={item + "-exp"}
          className={cn(" hover:bg-muted/50 ", !toggleRow && "hidden")}
        >
          <td colSpan={columnCount + 2} className="px-6 py-4">
            {fieldSchema.items &&
              !Array.isArray(fieldSchema.items) &&
              fieldSchema.items.properties &&
              Object.entries(fieldSchema.items.properties).map(
                ([name, item]) => {
                  if (!isTableColumn(item)) {
                    return (
                      <RenderFormField
                        key={`${zodKey}.${index}.${name}`}
                        zodKey={`${zodKey}.${index}.${name}`}
                        schemaField={item}
                      />
                    );
                  }
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
  item: string;
  index: number;
  fieldSchema: JSONSchema;
  zodKey: string;
  formControl: Control;
  remove: UseFieldArrayRemove;
  nestedCount: number;
}) {
  /* className="w-6 h-6 flex items-center justify-center rounded-full border  hover:bg-gray-100" */
  return (
    <tr key={item} className="border">
      {nestedCount ? (
        <td key="open" className="border">
          <Button
            type="button"
            variant={"ghost"}
            onClick={() => {
              setToggleRow(!toggleRow);
            }}
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
          </Button>
        </td>
      ) : null}
      {fieldSchema.items &&
        !Array.isArray(fieldSchema.items) &&
        fieldSchema.items.properties &&
        Object.entries(fieldSchema.items.properties).map(([name, item]) => {
          if (isTableColumn(item)) {
            return (
              <td key={`${zodKey}.${index}.${name}`}>
                <TableSingleField
                  key={`${zodKey}.${index}.${name}`}
                  zodKey={`${zodKey}.${index}.${name}`}
                  schemaField={item}
                  control={formControl}
                  disabled={false}
                />
              </td>
            );
          }
        })}

      <td key="remove" className="border">
        <Button
          type="button"
          variant={"ghost"}
          onClick={() => remove(index)}
          size={"icon"}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
}
