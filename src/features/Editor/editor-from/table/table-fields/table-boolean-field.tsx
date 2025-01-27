import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { TableSingleFieldType } from "../table-single-field";
import { Checkbox } from "@/components/ui/checkbox";

function TableBooleanField({
  zodKey,
  control,
  disabled,
}: TableSingleFieldType) {
  return (
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
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default TableBooleanField;
