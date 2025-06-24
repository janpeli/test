import { FieldValues, UseFormGetValues } from "react-hook-form";
import jsonpath from "jsonpath";
import { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { JSONSchema } from "@/lib/JSONSchemaToZod";
import SingleFieldLabel from "./single-field-label";
import { FormFieldProps } from "../render-form-field";
import {
  getFileContentById,
  updateEditorFormDatabyPath,
} from "@/API/editor-api/editor-api";
import yaml from "yaml";

function SubReferenceField({
  zodKey,
  schemaField,
  register,
  getValues,
  setValue,
  disabled,
  fileId,
  control,
}: FormFieldProps) {
  const [open, setOpen] = useState(false);

  const [selectedValue, setSelectedValue] = useState(
    getValues(zodKey + ".$sub_reference")
  );

  const onChangeHandler = (v: string) => {
    setSelectedValue(v);
    setValue(zodKey + ".$sub_reference", v);
    updateEditorFormDatabyPath(fileId, getValues(), zodKey + ".$sub_reference");
  };
  const switchOpenHandler = () => {
    setOpen(!open);
  };

  if (disabled && selectedValue) {
    onChangeHandler("");
  }

  return (
    <div className="space-y-2">
      <SingleFieldLabel
        title={schemaField.title}
        description={schemaField.description}
        zodKey={zodKey}
        control={control}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full ",
              "justify-between",
              !selectedValue && "text-muted-foreground"
            )}
            {...register(zodKey + ".$sub_reference", { disabled: disabled })}
            value={selectedValue}
          >
            {selectedValue
              ? selectedValue
              : `Select ${schemaField.title || zodKey}`}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className=" p-0">
          <Command>
            <CommandInput
              placeholder={`Search ${schemaField.title || zodKey}...`}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>{`No  ${
                schemaField.title && zodKey
              } found.`}</CommandEmpty>
              <CommandGroup>
                <SubReferenceFieldItems
                  schemaField={schemaField}
                  fieldValue={
                    selectedValue
                      ? Array.isArray(selectedValue)
                        ? selectedValue[0]
                        : selectedValue
                      : ""
                  }
                  onChange={onChangeHandler}
                  switchOpen={switchOpenHandler}
                  getValues={getValues}
                  zodKey={zodKey}
                />
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

SubReferenceField.displayName = "SubReferenceField";
export default SubReferenceField;

function SubReferenceFieldItems({
  schemaField,
  fieldValue,
  onChange,
  switchOpen,
  getValues,
  zodKey,
}: {
  schemaField: JSONSchema;
  fieldValue: string;
  onChange: (v: string) => void;
  switchOpen: () => void;
  getValues: UseFormGetValues<FieldValues>;
  zodKey: string;
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
          type: "string";
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
              item === fieldValue ? "opacity-100" : "opacity-0"
            )}
          />
        </CommandItem>
      ))}
    </>
  );
}
