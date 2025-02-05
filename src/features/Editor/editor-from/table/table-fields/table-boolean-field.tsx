//import { FormControl, FormField, FormItem } from "@/components/ui/form";

import { TableSingleFieldType } from "../table-single-field";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

function TableBooleanField({
  zodKey,
  /* control,
  disabled,*/
  register,
  getValues,
  setValue,
}: TableSingleFieldType) {
  const [isChecked, setIsChecked] = useState<boolean>(getValues(zodKey));
  const field = register(zodKey);
  console.log(getValues(zodKey));
  return (
    <div className="flex flex-row rounded-md border p-2 items-center ">
      <Checkbox
        checked={isChecked}
        onCheckedChange={(value) => {
          console.log("checked state:", value);
          setValue(zodKey, value);
          setIsChecked(value ? true : false);
        }}
        {...field}
      />
    </div>
  );
}

TableBooleanField.displayName = "TableBooleanField";

export default TableBooleanField;

/*
    <FormField
      key={zodKey}
      control={control}
      name={zodKey}
      disabled={disabled}
      render={({ field }) => (
        <FormItem className="flex flex-row rounded-md border p-2 items-center ">
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={field.disabled}
            />
          </FormControl>
        </FormItem>
      )}
    />
*/
