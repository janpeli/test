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
  const schemaObject: JSONSchema = yaml.parse(yamlSchema);
  return schemaObject;
};

export const getFormSchemas = (yamlSchema: string, original_values: string) => {
  const schemaObject = getSchemaObject(yamlSchema);

  return {
    zodSchema: JSONSchemaToZod.convert(schemaObject),
    schemaObject: schemaObject,
    defaulValues: {
      ...convertToDefValues(schemaObject),
      ...yaml.parse(original_values),
    },
  };
};

// Utility function to update nested object values
export const setNestedValue = (
  obj: IdefValues,
  path: string,
  value: IdefValues
) => {
  const keys = path.split(".");
  let temp = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!temp[key]) temp[key] = {};
    temp = temp[key] as IdefValues;
  }

  temp[keys[keys.length - 1]] = value;
};
