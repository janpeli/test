import { useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { FieldProps } from "./editor-single-field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import SingleFieldLabel from "./single-field-label";

//import { useFormContext } from "react-hook-form";

function StringField({
  zodKey,
  schemaField,
  register,
  setValue,
  disabled,
}: FieldProps) {
  const field = register(zodKey, { disabled: disabled });
  useEffect(() => {
    if (disabled === true) {
      setValue(zodKey, undefined);
    }
  }, [disabled, setValue, zodKey]);
  return (
    <div
      className={cn("space-y-2", schemaField.format === "text" && "col-span-2")}
    >
      <SingleFieldLabel
        title={schemaField.title}
        description={schemaField.description}
        zodKey={zodKey}
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
