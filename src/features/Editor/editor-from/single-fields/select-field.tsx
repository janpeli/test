import { FieldProps } from "../editor-single-field";
import EditorFormTooltip from "../editor-form-tooltip";
import { Select, SelectItem } from "@/components/ui/basic-select";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";
import React, { useCallback } from "react";

function SelectItemsComponent({ items }: { items: (string | number)[] }) {
  return (
    <>
      {items &&
        items.map((item) => (
          <SelectItem
            value={typeof item === "number" ? item.toString() : item}
            key={item}
          >
            {item}
          </SelectItem>
        ))}
    </>
  );
}

const SelectItems = React.memo(SelectItemsComponent);

function SelectField({ zodKey, schemaField }: FieldProps) {
  const { register, setValue, getValues } = useFormContext();
  const field = register(zodKey);

  const setVal = useCallback(
    (value: string) => setValue(zodKey, value),
    [zodKey, setValue]
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={zodKey}>
        <EditorFormTooltip tooltip={schemaField.description || ""}>
          <span>{schemaField.title || zodKey}</span>
        </EditorFormTooltip>
      </Label>
      <Select
        {...field}
        onValueChange={setVal}
        defaultValue={getValues(zodKey)}
      >
        {schemaField.enum && <SelectItems items={schemaField.enum} />}
      </Select>
    </div>
  );
}

SelectField.displayName = "SelectField";

export default SelectField;

/*
   <FormField
      key={zodKey}
      name={zodKey}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            <EditorFormTooltip tooltip={schemaField.description || ""}>
              <span>{schemaField.title || zodKey}</span>
            </EditorFormTooltip>
          </FormLabel>
          <FormControl>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              {schemaField.enum &&
                schemaField.enum.map((item) => (
                  <SelectItem
                    value={typeof item === "number" ? item.toString() : item}
                    key={item}
                  >
                    {item}
                  </SelectItem>
                ))}
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

*/
