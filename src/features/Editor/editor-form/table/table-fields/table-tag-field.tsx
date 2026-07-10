import { useState } from "react";
import TagInput from "@/components/ui/tag-input/tag-input";
import { FormFieldProps } from "../../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";
import { useClearFieldWhenDisabled } from "../../hooks";

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
  useClearFieldWhenDisabled({ disabled, fileId, zodKey, setValue, getValues });
  return (
    <div className="p-1">
      <TagInput
        name={name}
        value={initialValues}
        onChange={(value) => {
          setValue(zodKey, value);
          updateEditorFormDatabyPath(fileId, getValues(), zodKey);
        }}
      />
    </div>
  );
}

TableTagField.displayName = "TableTagField";

export default TableTagField;
