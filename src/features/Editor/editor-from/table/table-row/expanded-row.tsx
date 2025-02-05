import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { cn } from "@/lib/utils";
import {
  Control,
  FieldValues,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import RenderFormField from "../../render-form-field";
import { isTableColumn } from "../table-fields/utils";

export function ExpandedRow({
  columnCount,
  toggleRow,
  item,
  index,
  fieldSchema,
  zodKey,
  nestedCount,
  control,
  register,
  setValue,
  getValues,
}: {
  columnCount: number;
  toggleRow: boolean;
  item: string;
  index: number;
  fieldSchema: JSONSchema;
  zodKey: string;
  nestedCount: number;
  control: Control;
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  getValues: UseFormGetValues<FieldValues>;
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
                        control={control}
                        register={register}
                        setValue={setValue}
                        getValues={getValues}
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
