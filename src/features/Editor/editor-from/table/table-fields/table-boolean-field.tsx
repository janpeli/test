//import { FormControl, FormField, FormItem } from "@/components/ui/form";

import { TableSingleFieldType } from "../table-single-field";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";

function TableBooleanField({
  zodKey,
  /* control,*/
  disabled,
  register,
  getValues,
  setValue,
}: TableSingleFieldType) {
  const [isChecked, setIsChecked] = useState<boolean>(getValues(zodKey));
  const field = register(zodKey, { disabled: disabled });
  useEffect(() => {
    if (disabled === true && isChecked) {
      setValue(zodKey, undefined);
      setIsChecked(false);
    }
  }, [disabled, setValue, zodKey, isChecked]);
  return (
    <div className="flex flex-row rounded-md border p-2 items-center ">
      <Checkbox
        checked={isChecked}
        onCheckedChange={(value) => {
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
