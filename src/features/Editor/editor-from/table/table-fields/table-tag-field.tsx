import { useEffect, useState } from "react";
import TagInput from "@/components/ui/tag-input/tag-input";
import { FormFieldProps } from "../../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";

function TableTagField({
  zodKey,
  // control,
  disabled,
  register,
  setValue,
  getValues,
  fileId,
}: FormFieldProps) {
  const [initialValues] = useState(getValues(zodKey));
  const { name } = register(zodKey, {
    disabled: disabled,
  });
  useEffect(() => {
    if (disabled === true) {
      setValue(zodKey, undefined);
      updateEditorFormDatabyPath(fileId, getValues(), zodKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);
  return (
    <TagInput
      name={name}
      value={initialValues}
      onChange={(value) => {
        setValue(zodKey, value);
        updateEditorFormDatabyPath(fileId, getValues(), zodKey);
      }}
    />
  );
}

TableTagField.displayName = "TableTagField";

export default TableTagField;
