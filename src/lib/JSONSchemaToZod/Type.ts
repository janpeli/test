export type JSONSchema = {
  type?: string;
  properties?: JSONSchemaProperties;
  items?: JSONSchema | JSONSchema[];
  required?: string[];
  enum?: (string | number)[];
  format?: Format;
  oneOf?: JSONSchema[];
  allOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  additionalProperties?: boolean | JSONSchema;
  description?: string;
  Unique_properties?: string[];
  valid_for?: { property: string; enum: (boolean | string)[] };
  title?: string;
  sufix?: string[];
  //[key: string]: any; // For any other additional properties
};

export type JSONSchemaProperties =
  | Record<string, JSONSchema>
  | {
      $reference?: {
        type: "string";
        format: "uri-reference";
        sufix: string[];
      };
    }
  | {
      $sub_reference: {
        type: "string";
        JSONPath: string;
        file_property?: string;
        file_JSONPath?: string;
      };
    };

type Format =
  | "date-time"
  | "date"
  | "time"
  | "duration"
  | "email"
  | "idn-email"
  | "hostname"
  | "idn-hostname"
  | "ipv4"
  | "ipv6"
  | "uri"
  | "uri-reference"
  | "iri"
  | "iri-reference"
  | "uuid"
  | "uri-template"
  | "json-pointer"
  | "relative-json-pointer"
  | "regex"
  | "text"
  | "reference";
