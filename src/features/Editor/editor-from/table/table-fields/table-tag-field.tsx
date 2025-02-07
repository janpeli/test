import { useEffect } from "react";
import TagInput from "@/components/ui/tag-input/tag-input";
import { FormFieldProps } from "../../render-form-field";

function TableTagField({
  zodKey,
  // control,
  disabled,
  register,
  setValue,
}: FormFieldProps) {
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
