import yaml from "yaml";
import { JSONSchema, JSONSchemaToZod } from "@/lib/JSONSchemaToZod";

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

export const getSchemaObject = (yamlSchema: string): JSONSchema => {
  return yaml.parse(yamlSchema);
};

export const getFormSchemas = (yamlSchema: string, originalValues: string) => {
  const schemaObject = getSchemaObject(yamlSchema);

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
  const parsedOriginalValues = yaml.parse(originalValues);

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
const setNestedValue = (obj: IdefValues, path: string, value: IdefValues) => {
  const keys = path.split(".");
  let temp = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!temp[key]) temp[key] = {};
    temp = temp[key] as IdefValues;
  }

  temp[keys[keys.length - 1]] = value;
};
