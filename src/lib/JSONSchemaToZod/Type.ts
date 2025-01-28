export type JSONSchema = {
  type?: string;
  properties?:
    | Record<string, JSONSchema>
    | {
        reference?: {
          type: "string";
          format: "reference";
          sufix: string[];
        };
      };
  items?: JSONSchema | JSONSchema[];
  required?: string[];
  enum?: (string | number)[];
  format?: string;
  oneOf?: JSONSchema[];
  allOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  additionalProperties?: boolean | JSONSchema;
  description?: string;
  Unique_properties?: string[];
  valid_for?: { property: string; enum: string[] };
  title?: string;
  sufix?: string[];

  //[key: string]: any; // For any other additional properties
};
