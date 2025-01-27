import { useFormContext } from "react-hook-form";
import { JSONSchema } from "@/lib/JSONSchemaToZod";

function getParentPath(path: string) {
  const keys = path.split(".");
  keys.pop(); // Remove the last key
  return keys.join("."); // Join the remaining keys back into a string
}

// Function to check if a field should be visible based on `valid_for` conditions
export const useFieldDisabled = (
  field: JSONSchema,
  zodKey: string
): boolean => {
  const { watch } = useFormContext();
  if (field.valid_for && field.valid_for.property && field.valid_for.enum) {
    const parentKey = getParentPath(zodKey);
    const parentValue = watch(parentKey);
    const masterProperty = field.valid_for.property;
    if (parentValue[masterProperty]) {
      if (
        parentValue[masterProperty] &&
        field.valid_for.enum.includes(parentValue[masterProperty])
      ) {
        return false;
      }
      return true;
    }
  }
  return false;
};
