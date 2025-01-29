import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { Control, useFieldArray } from "react-hook-form";

import { TableHeader } from "./table-header";
import { TableRow } from "./table-row";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
          return (item[1].type !== "array" && item[1].type !== "object") ||
            item[1].format === "reference"
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
          return (item[1].type === "array" || item[1].type === "object") &&
            item[1].format !== "reference"
            ? acc + 1
            : acc;
        }, 0)
      : 0;
  }, [fieldSchema]);

  return (
    <div className="overflow-x-auto ">
      <table className="min-w-min bg-background border">
        <TableHeader fieldSchema={fieldSchema} nestedCount={nestedCount} />
        <tbody className="">
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
      <Button variant={"ghost"} onClick={() => append({})}>
        <Plus className=" h-4 w-4" /> Add{" "}
        {fieldSchema.title || fieldSchema.description || zodKey}
      </Button>
    </div>
  );
}
