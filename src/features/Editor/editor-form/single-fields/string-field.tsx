import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import SingleFieldLabel from "./single-field-label";
import { FormFieldProps } from "../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";
import { useClearFieldWhenDisabled } from "../hooks";

function StringField({
  zodKey,
  schemaField,
  register,
  setValue,
  disabled,
  fileId,
  getValues,
  control,
}: FormFieldProps) {
  const field = register(zodKey, {
    disabled: disabled,
    onBlur: () => {
      updateEditorFormDatabyPath(fileId, getValues(), zodKey);
    },
  });
  useClearFieldWhenDisabled({ disabled, fileId, zodKey, setValue, getValues });

  return (
    <div
      className={cn("space-y-2", schemaField.format === "text" && "col-span-2")}
    >
      <SingleFieldLabel
        title={schemaField.title}
        description={schemaField.description}
        zodKey={zodKey}
        control={control}
      />
      {schemaField.format === "text" ? (
        <Textarea
          placeholder={schemaField.description ? schemaField.description : ".."}
          {...field}
        />
      ) : (
        <Input placeholder="..." {...field} />
      )}
    </div>
  );
}

StringField.displayName = "StringField";

export default StringField;
