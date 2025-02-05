// import { FormControl, FormField, FormItem } from "@/components/ui/form";
import TagInput from "@/components/ui/tag-input/tag-input";
import { TableSingleFieldType } from "../table-single-field";
import { useEffect } from "react";

function TableTagField({
  zodKey,
  // control,
  disabled,
  register,
  setValue,
}: TableSingleFieldType) {
  const { name, ref } = register(zodKey, { disabled: disabled });
  useEffect(() => {
    if (disabled === true) {
      setValue(zodKey, undefined);
    }
  }, [disabled, setValue, zodKey]);
  return (
    <TagInput
      name={name}
      ref={ref}
      onChange={(value) => setValue(zodKey, value)}
    />
  );
}

TableTagField.displayName = "TableTagField";

export default TableTagField;
