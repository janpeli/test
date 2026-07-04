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
    <div className="overflow-hidden rounded-md border bg-background">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <TableHeader schemaField={schemaField} nestedCount={nestedCount} />
          <tbody className="divide-y">
            {fields.map((item, index) => (
              <TableRow
                key={item.id}
                item={item.id}
                index={index}
                zodKey={zodKey}
                schemaField={schemaField}
                columnCount={columnCount}
                nestedCount={nestedCount}
                control={control}
                {...rest}
                remove={remove}
              />
            ))}
          </tbody>
        </table>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleAppend}
        className="w-full justify-start rounded-none border-t font-normal text-muted-foreground hover:text-foreground"
      >
        <Plus className="mr-1 h-4 w-4" />
        {buttonLabel}
      </Button>
    </div>
  );
}
