import { Input } from "@/components/ui/input";
import { FormFieldProps } from "../../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";
import { useClearFieldWhenDisabled } from "../../hooks";
import { inlineCellControl } from "./utils";

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
  useClearFieldWhenDisabled({ disabled, fileId, zodKey, setValue, getValues });
  const isEmail = schemaField.format === "email";
  return (
    <Input
      type={isEmail ? "email" : ""}
      placeholder="…"
      className={inlineCellControl}
      {...field}
    />
  );
}

TableStringField.displayName = "TableStringField";

export default TableStringField;
