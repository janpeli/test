import { Input } from "@/components/ui/input";
import { FieldProps } from "../editor-single-field";
import EditorFormTooltip from "../editor-form-tooltip";
import { Label } from "@/components/ui/label";
//import { useFormContext } from "react-hook-form";

function IntegerField({ zodKey, schemaField, register }: FieldProps) {
  //const { register } = useFormContext();
  const field = register(zodKey);
  return (
    <div className="space-y-2">
      <Label htmlFor={zodKey}>
        <EditorFormTooltip tooltip={schemaField.description || ""}>
          <span>{schemaField.title || zodKey}</span>
        </EditorFormTooltip>
      </Label>
      <Input type="number" step="1" pattern="\d+" {...field} />
    </div>
  );
}

IntegerField.displayName = "IntegerField";

export default IntegerField;
