import { FormControl, FormField, FormItem } from "@/components/ui/form";
import TagInput from "@/components/ui/tag-input/tag-input";
import { TableSingleFieldType } from "../table-single-field";

function TableTagField({ zodKey, control, disabled }: TableSingleFieldType) {
  return (
    <FormField
      key={zodKey}
      control={control}
      name={zodKey}
      disabled={disabled}
      render={({ field }) => (
        <FormItem className="col-span-2">
          <FormControl>
            <TagInput {...field} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

TableTagField.displayName = "TableTagField";

export default TableTagField;
