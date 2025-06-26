import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { FormFieldProps } from "../../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";

function TableBooleanField({
  zodKey,
  /* control,*/
  disabled,
  register,
  getValues,
  setValue,
  fileId,
}: FormFieldProps) {
  const [isChecked, setIsChecked] = useState<boolean>(
    Boolean(getValues(zodKey))
  );
  const field = register(zodKey, {
    disabled: disabled,
    setValueAs: (v) => Boolean(v),
  });

  useEffect(() => {
    if (disabled === true && isChecked) {
      setValue(zodKey, false); // Set to false instead of undefined
      setIsChecked(false);
      updateEditorFormDatabyPath(fileId, getValues(), zodKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, setValue, zodKey, isChecked]);

  return (
    <div className="flex flex-row rounded-md border p-2 items-center ">
      <Checkbox
        checked={isChecked}
        onCheckedChange={(value) => {
          // Ensure we always set a boolean value
          const boolValue = Boolean(value);
          setValue(zodKey, boolValue);
          setIsChecked(boolValue);
          updateEditorFormDatabyPath(fileId, getValues(), zodKey);
        }}
        {...field}
      />
    </div>
  );
}

TableBooleanField.displayName = "TableBooleanField";
export default TableBooleanField;
