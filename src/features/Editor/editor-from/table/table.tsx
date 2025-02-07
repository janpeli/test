import { useFieldArray } from "react-hook-form";
import TableHeader from "./table-header/table-header";
import TableRow from "./table-row/table-row";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { isTableColumn } from "./table-fields/utils";
import { convertToDefValues } from "../../utilities";
import { FormFieldProps } from "../render-form-field";

export function Table({
  zodKey,
  schemaField,
  control,
  ...rest
}: FormFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control: control,
    name: zodKey,
  });

  const { items } = schemaField;
  const { columnCount, nestedCount } = useMemo(() => {
    if (!items || Array.isArray(items) || !items.properties)
      return { columnCount: 0, nestedCount: 0 };

    return Object.entries(items.properties).reduce(
      (acc, [, value]) => {
        if (isTableColumn(value)) {
          acc.columnCount += 1;
        } else {
          acc.nestedCount += 1;
        }
        return acc;
      },
      { columnCount: 0, nestedCount: 0 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoize the label for the add button
  const buttonLabel = useMemo(
    () => `Add ${schemaField.title || schemaField.description || zodKey}`,
    [schemaField.title, schemaField.description, zodKey]
  );

  const handleAppend = useCallback(
    () =>
      append(
        items ? convertToDefValues(Array.isArray(items) ? items[0] : items) : {}
      ),
    [append, items]
  );

  return (
    <div className="overflow-x-auto ">
      <table className="min-w-min bg-background border">
        <TableHeader schemaField={schemaField} nestedCount={nestedCount} />
        <tbody className="">
          {fields.map((item, index) => (
            <TableRow
              key={item.id}
              item={item.id}
              index={index}
              zodKey={zodKey}
              schemaField={schemaField}
              remove={remove}
              columnCount={columnCount}
              nestedCount={nestedCount}
              control={control}
              {...rest}
            />
          ))}
        </tbody>
      </table>
      <Button type="button" variant={"ghost"} onClick={handleAppend}>
        <Plus className=" h-4 w-4" />
        {buttonLabel}
      </Button>
    </div>
  );
}
