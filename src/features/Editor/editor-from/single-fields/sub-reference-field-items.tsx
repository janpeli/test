import { getFileContentById } from "@/API/editor-api/editor-api";
import { CommandItem } from "@/components/ui/command";
import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { cn } from "@/lib/utils";
import jsonpath from "jsonpath";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { FieldValues, UseFormGetValues } from "react-hook-form";
import yaml from "yaml";

export function SubReferenceFieldItems({
  schemaField,
  fieldValue,
  onChange,
  switchOpen,
  getValues,
  zodKey,
  isMultiSelect = false,
}: {
  schemaField: JSONSchema;
  fieldValue: string | string[];
  onChange: (v: string) => void;
  switchOpen: () => void;
  getValues: UseFormGetValues<FieldValues>;
  zodKey: string;
  isMultiSelect?: boolean;
}) {
  const [values, setValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadValues = async () => {
      setLoading(true);
      let newValues: string[] = [];

      // Get fresh form values inside the effect
      const formValue = getValues();

      if (
        schemaField.properties &&
        "$sub_reference" in schemaField.properties
      ) {
        const subRefSchema = schemaField.properties.$sub_reference as {
          type: "string" | "array";
          JSONPath: string;
          file_property?: string;
          file_JSONPath?: string;
        };

        // Priority 1: file_property (sister property)
        if ("file_property" in subRefSchema && subRefSchema.file_property) {
          try {
            // Get the sister property value using the zodKey
            const zodKeyParts = zodKey.split(".");
            const parentPath = zodKeyParts.slice(0, -1).join(".");
            const sisterPropertyPath = parentPath
              ? `${parentPath}.${subRefSchema.file_property}`
              : subRefSchema.file_property;

            const fileReference = jsonpath.query(
              formValue,
              `$.${sisterPropertyPath}`
            )[0];
            const fileId = fileReference.$reference;
            if (fileId) {
              const fileValues = await getFile(fileId);
              console.log({ fileValues });
              if (subRefSchema.JSONPath) {
                newValues = jsonpath.query(fileValues, subRefSchema.JSONPath);
              } else {
                // If no JSONPath specified, use the entire file content or keys
                newValues = Array.isArray(fileValues)
                  ? fileValues
                  : Object.keys(fileValues || {});
              }
            }
          } catch (error) {
            console.error("Error loading file from file_property:", error);
          }
        }
        // Priority 2: file_JSONPath
        else if (
          "file_JSONPath" in subRefSchema &&
          subRefSchema.file_JSONPath
        ) {
          try {
            const fileReference = jsonpath.query(
              formValue,
              subRefSchema.file_JSONPath
            )[0];
            const fileId = fileReference.$reference;
            if (fileId) {
              const fileValues = await getFile(fileId);
              if (subRefSchema.JSONPath) {
                newValues = jsonpath.query(fileValues, subRefSchema.JSONPath);
              } else {
                // If no JSONPath specified, use the entire file content or keys
                newValues = Array.isArray(fileValues)
                  ? fileValues
                  : Object.keys(fileValues || {});
              }
            }
          } catch (error) {
            console.error("Error loading file from file_JSONPath:", error);
          }
        }
        // Priority 3: JSONPath on form data
        else if ("JSONPath" in subRefSchema && subRefSchema.JSONPath) {
          try {
            newValues = jsonpath.query(formValue, subRefSchema.JSONPath);
          } catch (error) {
            console.error("Error querying form data with JSONPath:", error);
          }
        }
      }

      // Filter out null/undefined values and ensure strings
      newValues = newValues
        .filter((item) => item != null)
        .map((item) => (typeof item === "string" ? item : String(item)));

      setValues(newValues);
      setLoading(false);
    };

    loadValues();
  }, [schemaField, zodKey, getValues]);

  async function getFile(id: string) {
    try {
      const fileContent = await getFileContentById(id);

      return yaml.parse(fileContent ?? "");
    } catch (error) {
      console.error("Error parsing file content:", error);
      return {};
    }
  }

  const isItemSelected = (item: string) => {
    if (isMultiSelect) {
      return Array.isArray(fieldValue) ? fieldValue.includes(item) : false;
    }
    return item === fieldValue;
  };

  if (loading) {
    return <CommandItem disabled>Loading...</CommandItem>;
  }

  return (
    <>
      {values.map((item, index) => (
        <CommandItem
          value={item}
          key={index}
          onSelect={() => {
            onChange(item);
            switchOpen();
          }}
        >
          {item}
          <Check
            className={cn(
              "ml-auto",
              isItemSelected(item) ? "opacity-100" : "opacity-0"
            )}
          />
        </CommandItem>
      ))}
    </>
  );
}
