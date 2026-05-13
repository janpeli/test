import { useEffect } from "react";
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

  const masterProperty = field.valid_for?.property;
  const hasSchemaMismatch = !!(
    masterProperty &&
    field.valid_for?.enum &&
    parentValue &&
    !(masterProperty in parentValue)
  );

  useEffect(() => {
    if (hasSchemaMismatch && masterProperty) {
      addErrorMessage(
        `Schema warning: field "${zodKey}" has valid_for.property "${masterProperty}" which does not exist in the parent object.`,
        "warning"
      );
    }
  }, [hasSchemaMismatch, masterProperty, zodKey]);

  if (field.valid_for && field.valid_for.property && field.valid_for.enum) {
    if (parentValue && !(field.valid_for.property in parentValue)) {
      return false;
    }
    if (
      parentValue &&
      field.valid_for.property in parentValue &&
      parentValue[field.valid_for.property] !== undefined
    ) {
      if (
        parentValue[field.valid_for.property] &&
        field.valid_for.enum.includes(parentValue[field.valid_for.property])
      ) {
        return false;
      }
      return true;
    }
  }
  return false;
};
