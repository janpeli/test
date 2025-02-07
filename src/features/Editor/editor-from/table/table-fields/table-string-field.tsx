import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { FormFieldProps } from "../../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";

function TableStringField({
  zodKey,
  schemaField,
  // control,
  disabled,
  register,
  setValue,
  fileId,
  getValues,
}: FormFieldProps) {
  const field = register(zodKey, {
    disabled: disabled,
    onBlur: () => {
      updateEditorFormDatabyPath(fileId, getValues(), zodKey);
    },
  });
  useEffect(() => {
    if (disabled === true) {
      setValue(zodKey, undefined);
      updateEditorFormDatabyPath(fileId, getValues(), zodKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);
  const isEmail = schemaField.format === "email";
  return <Input type={isEmail ? "email" : ""} placeholder="..." {...field} />;
}

TableStringField.displayName = "TableStringField";

export default TableStringField;
