import { JSONSchema } from "@/lib/JSONSchemaToZod";
import {
  Control,
  FieldValues,
  useFieldArray,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";

import TableHeader from "./table-header";
import TableRow from "./table-row/table-row";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { isTableColumn } from "./table-fields/utils";
import { convertToDefValues } from "../../utilities";

export function Table({
  zodKey,
  fieldSchema,
  control,
  register,
  setValue,
  getValues,
}: {
  zodKey: string;
  fieldSchema: JSONSchema;
  control: Control;
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  getValues: UseFormGetValues<FieldValues>;
}) {
  //const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control: control,
    name: zodKey,
  });

  const { items } = fieldSchema;
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
  }, []);

  // Memoize the label for the add button
  const buttonLabel = useMemo(
    () => `Add ${fieldSchema.title || fieldSchema.description || zodKey}`,
    [fieldSchema.title, fieldSchema.description, zodKey]
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
        <TableHeader fieldSchema={fieldSchema} nestedCount={nestedCount} />
        <tbody className="">
          {fields.map((item, index) => (
            <TableRow
              key={item.id}
              item={item.id}
              index={index}
              zodKey={zodKey}
              fieldSchema={fieldSchema}
              remove={remove}
              columnCount={columnCount}
              nestedCount={nestedCount}
              control={control}
              register={register}
              setValue={setValue}
              getValues={getValues}
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
