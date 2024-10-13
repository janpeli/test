import { z } from "zod";
import yaml from "yaml";
import { FieldValues } from "react-hook-form";

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

export const getSchemaObject = (yamlSchema: string): ISchema => {
  const schemaObject: ISchema = yaml.parse(yamlSchema);
  return schemaObject;
};

export const getFormSchemas = (yamlSchema: string) => {
  const schemaObject = getSchemaObject(yamlSchema);
  return {
    zodSchema: convertToZodSchema(schemaObject),
    schemaObject: schemaObject,
  };
};

// Function to check if a field should be visible based on `valid_for` conditions
export const shouldFieldBeVisible = (
  parentKey: string,
  field: ISchemaField,
  watchFields: FieldValues
): boolean => {
  if (field.valid_for) {
    const parentValue = watchFields[parentKey];
    if (parentValue && field.valid_for.enum.includes(parentValue)) {
      return true;
    }
    return false;
  }
  return true;
};
