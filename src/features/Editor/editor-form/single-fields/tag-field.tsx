import { useState } from "react";
import TagInput from "@/components/ui/tag-input/tag-input";
import SingleFieldLabel from "./single-field-label";
import { FormFieldProps } from "../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";
import { useClearFieldWhenDisabled } from "../hooks";

function TagField({
  zodKey,
  schemaField,
  register,
  setValue,
  disabled,
  getValues,
  fileId,
  control,
}: FormFieldProps) {
  const [initialValues] = useState(getValues(zodKey));
  const { name } = register(zodKey, {
    disabled: disabled,
  });
  useClearFieldWhenDisabled({ disabled, fileId, zodKey, setValue, getValues });

  return (
    <div className="space-y-2">
      <SingleFieldLabel
        title={schemaField.title}
        description={schemaField.description}
        zodKey={zodKey}
        control={control}
      />
      <TagInput
        name={name}
        value={initialValues}
        onChange={(value) => {
          setValue(zodKey, value);
          updateEditorFormDatabyPath(fileId, getValues(), zodKey);
        }}
        disabled={disabled}
      />
    </div>
  );
}

TagField.displayName = "TagField";

export default TagField;
