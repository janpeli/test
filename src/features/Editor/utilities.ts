import { z } from "zod";
import yaml from "yaml";

import { JSONSchema, JSONSchemaToZod } from "@/lib/JSONSchemaToZod";

// Define types for the schema structure
export interface ISchemaField {
  type: string;
  description?: string;
  properties?: Record<string, ISchemaField>;
  items?: ISchemaField;
  enum?: string[];
  valid_for?: {
    property: string;
    enum: string[];
  };
}

export interface ISchema {
  $schema: string;
  title: string;
  type: "object";
  properties: Record<string, ISchemaField>;
}

// Function to dynamically convert JSON Schema to Zod Schema
export const convertToZodSchema = (schema: ISchema): z.ZodTypeAny => {
  const mapType = (field: ISchemaField): z.ZodTypeAny => {
    switch (field.type) {
      case "string":
        return z.string().optional();
      case "boolean":
        return z.boolean().optional();
      case "integer":
        return z.number().int().optional();
      case "array":
        if (field.items) {
          return z.array(mapType(field.items)).optional();
        }
        break;
      case "object":
        if (field.properties) {
          return z
            .object(
              Object.fromEntries(
                Object.entries(field.properties).map(([key, value]) => [
                  key,
                  mapType(value),
                ])
              )
            )
            .optional();
        }
        break;
    }
    return z.any(); // Fallback for unsupported types
  };

  return z
    .object(
      Object.fromEntries(
        Object.entries(schema.properties).map(([key, value]) => [
          key,
          mapType(value),
        ])
      )
    )
    .optional();
};

type defVal = string | number | IdefValues | IdefValues[] | boolean;
interface IdefValues {
  [key: string]: defVal;
}

const convertToDefValues = (schema: JSONSchema): IdefValues => {
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
