import { Control, useWatch } from "react-hook-form";
import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { addErrorMessage } from "@/API/GUI-api/status-panel-api";

function getParentPath(path: string) {
  const keys = path.split(".");
  keys.pop(); // Remove the last key
  return keys.join("."); // Join the remaining keys back into a string
}

// Function to check if a field should be visible based on `valid_for` conditions
export const useFieldDisabled = (
  field: JSONSchema,
  zodKey: string,
  control: Control
): boolean => {
  const parentValue = useWatch({
    control: control,
    name: getParentPath(zodKey),
  });
  if (field.valid_for && field.valid_for.property && field.valid_for.enum) {
    const masterProperty = field.valid_for.property;
    if (parentValue && !(masterProperty in parentValue)) {
      addErrorMessage(
        `Schema warning: field "${zodKey}" has valid_for.property "${masterProperty}" which does not exist in the parent object.`,
        "warning"
      );
      return false;
    }
    if (
      parentValue &&
      masterProperty in parentValue &&
      parentValue[masterProperty] !== undefined
    ) {
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
