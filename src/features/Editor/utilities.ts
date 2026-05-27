import yaml from "yaml";
import { JSONSchema, JSONSchemaToZod } from "@/lib/JSONSchemaToZod";
import { addErrorMessage } from "@/API/GUI-api/status-panel-api";

type defVal = string | number | IdefValues | IdefValues[] | boolean;
export interface IdefValues {
  [key: string]: defVal;
}

export const convertToDefValues = (schema: JSONSchema): IdefValues => {
  const mapType = (field: JSONSchema): defVal | defVal[] => {
    switch (field.type) {
      case "string":
        return "";
      case "boolean":
        return false;
      case "integer":
        return "";
      case "array":
        if (field.items) {
          return field.items && Array.isArray(field.items)
            ? []
            : [mapType(field.items) as defVal];
        }
        break;
      case "object":
        if (field.properties) {
          const obj: IdefValues = {};
          Object.entries(field.properties).map(([fieldName, fieldContent]) => {
            obj[fieldName] = mapType(fieldContent) as defVal;
          });
          return obj;
        }
        break;
    }
    return {};
  }; // Fallback for unsupported types

  return (schema.properties ? mapType(schema) : {}) as IdefValues;
};

export const getSchemaObject = (yamlSchema: string): JSONSchema | null => {
  try {
    const parsed = yaml.parse(yamlSchema);
    if (!parsed || typeof parsed !== "object") {
      addErrorMessage("Form schema is empty or not a valid YAML object.", "error");
      return null;
    }
    return parsed as JSONSchema;
  } catch (e) {
    addErrorMessage(`Failed to parse form schema YAML: ${(e as Error).message}`, "error");
    return null;
  }
};

export const getFormSchemas = (yamlSchema: string, originalValues: string) => {
  const schemaObject = getSchemaObject(yamlSchema);
  if (!schemaObject) return null;

  return {
    zodSchema: getZodSchema(schemaObject),
    schemaObject: schemaObject,
    defaulValues: getDefaultValues(schemaObject, originalValues),
  };
};

export const getZodSchema = (schemaObject: JSONSchema) => {
  return JSONSchemaToZod.convert(schemaObject);
};

export const getDefaultValues = (
  schemaObject: JSONSchema,
  originalValues: string
): IdefValues => {
  const defaultSchemaValues = convertToDefValues(schemaObject);

  let parsedOriginalValues: IdefValues = {};
  try {
    const parsed = yaml.parse(originalValues);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      parsedOriginalValues = parsed as IdefValues;
    } else if (parsed !== null && parsed !== undefined) {
      addErrorMessage("File content is not a YAML object — form fields may be empty.", "warning");
    }
  } catch (e) {
    addErrorMessage(`Failed to parse file content as YAML: ${(e as Error).message}`, "error");
  }

  return {
    ...defaultSchemaValues,
    ...parsedOriginalValues,
  };
};

export function isReferenceField(schemaField: JSONSchema): boolean {
  return schemaField.properties &&
    "$reference" in schemaField.properties &&
    schemaField.properties.$reference
    ? true
    : false;
}

export function isSubReferenceField(schemaField: JSONSchema): boolean {
  return schemaField.properties &&
    "$sub_reference" in schemaField.properties &&
    schemaField.properties.$sub_reference
    ? true
    : false;
}

export function isTagArray(zodKey: string, schemaField: JSONSchema): boolean {
  return zodKey === "general.tags" ||
    (schemaField.items &&
      !Array.isArray(schemaField.items) &&
      schemaField.items.type === "string")
    ? true
    : false;
}

// Utility function to update nested object values
// const setNestedValue = (obj: IdefValues, path: string, value: IdefValues) => {
//   const keys = path.split(".");
//   let temp = obj;

//   for (let i = 0; i < keys.length - 1; i++) {
//     const key = keys[i];
//     if (!temp[key]) temp[key] = {};
//     temp = temp[key] as IdefValues;
//   }

//   temp[keys[keys.length - 1]] = value;
// };
