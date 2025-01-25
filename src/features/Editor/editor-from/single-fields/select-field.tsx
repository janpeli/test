import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { FieldProps } from "../editor-single-field";
import EditorFormTooltip from "../editor-form-tooltip";
import { Select, SelectItem } from "@/components/ui/basic-select";

function SelectField({ zodKey, schemaField, control }: FieldProps) {
  return (
    <FormField
      key={zodKey}
      control={control}
      name={zodKey}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            <EditorFormTooltip tooltip={schemaField.description || ""}>
              <span>{schemaField.title || zodKey}</span>
            </EditorFormTooltip>
          </FormLabel>
          <FormControl>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              {schemaField.enum &&
                schemaField.enum.map((item) => (
                  <SelectItem
                    value={typeof item === "number" ? item.toString() : item}
                    key={item}
                  >
                    {item}
                  </SelectItem>
                ))}
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

SelectField.displayName = "SelectField";

export default SelectField;
