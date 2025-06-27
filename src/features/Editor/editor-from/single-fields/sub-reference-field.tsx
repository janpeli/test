import { useState } from "react";
import { ChevronsUpDown, X } from "lucide-react";
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
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import SingleFieldLabel from "./single-field-label";
import { FormFieldProps } from "../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";
import { SubReferenceFieldItems } from "./sub-reference-field-items";
import { JSONSchemaProperties } from "@/lib/JSONSchemaToZod";

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

  // Type guard to check if properties contains $sub_reference
  const hasSubReference = (
    props: JSONSchemaProperties
  ): props is {
    $sub_reference: {
      type: "string" | "array";
      JSONPath: string;
      file_property?: string;
      file_JSONPath?: string;
    };
  } => {
    return props && "$sub_reference" in props;
  };

  // Check if the field type is array
  const isMultiSelect =
    schemaField.properties && hasSubReference(schemaField.properties)
      ? schemaField.properties.$sub_reference.type === "array"
      : false;

  const [selectedValue, setSelectedValue] = useState(() => {
    const value = getValues(zodKey + ".$sub_reference");
    return isMultiSelect ? (Array.isArray(value) ? value : []) : value;
  });

  const onChangeHandler = (v: string) => {
    let newValue;

    if (isMultiSelect) {
      const currentArray = Array.isArray(selectedValue) ? selectedValue : [];
      if (currentArray.includes(v)) {
        // Remove if already selected
        newValue = currentArray.filter((item) => item !== v);
      } else {
        // Add if not selected
        newValue = [...currentArray, v];
      }
    } else {
      newValue = v;
    }

    setSelectedValue(newValue);
    setValue(zodKey + ".$sub_reference", newValue);
    updateEditorFormDatabyPath(fileId, getValues(), zodKey + ".$sub_reference");
  };

  const removeItem = (itemToRemove: string) => {
    if (isMultiSelect && Array.isArray(selectedValue)) {
      const newValue = selectedValue.filter((item) => item !== itemToRemove);
      setSelectedValue(newValue);
      setValue(zodKey + ".$sub_reference", newValue);
      updateEditorFormDatabyPath(
        fileId,
        getValues(),
        zodKey + ".$sub_reference"
      );
    }
  };

  const switchOpenHandler = () => {
    setOpen(!open);
  };

  if (disabled && selectedValue) {
    const emptyValue = isMultiSelect ? [] : "";
    setSelectedValue(emptyValue);
    setValue(zodKey + ".$sub_reference", emptyValue);
    updateEditorFormDatabyPath(fileId, getValues(), zodKey + ".$sub_reference");
  }

  const showPlaceholder =
    isMultiSelect &&
    (!Array.isArray(selectedValue) || selectedValue.length === 0);

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
              "w-full justify-between min-h-10 h-auto p-2",
              (!selectedValue ||
                (isMultiSelect &&
                  Array.isArray(selectedValue) &&
                  selectedValue.length === 0)) &&
                "text-muted-foreground"
            )}
            {...register(zodKey + ".$sub_reference", { disabled: disabled })}
          >
            <div className="flex flex-wrap items-center gap-1 flex-1 min-h-6">
              {/* Multi-select pills inside the button */}
              {isMultiSelect &&
                Array.isArray(selectedValue) &&
                selectedValue.length > 0 && (
                  <>
                    {selectedValue.map((item, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md"
                        onClick={(e) => e.stopPropagation()} // Prevent button click when clicking pill
                      >
                        <span>{item}</span>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent button click
                            removeItem(item);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              removeItem(item);
                            }
                          }}
                          className="hover:bg-secondary-foreground/20 rounded-sm p-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
                          aria-label={`Remove ${item}`}
                          style={{
                            opacity: disabled ? 0.5 : 1,
                            pointerEvents: disabled ? "none" : "auto",
                          }}
                        >
                          <X className="h-3 w-3" />
                        </div>
                      </div>
                    ))}
                  </>
                )}

              {/* Placeholder text for empty multi-select or single select display */}
              {showPlaceholder && (
                <span className="text-muted-foreground">
                  Select {schemaField.title || zodKey}
                </span>
              )}

              {!isMultiSelect && selectedValue && <span>{selectedValue}</span>}

              {!isMultiSelect && !selectedValue && (
                <span>Select {schemaField.title || zodKey}</span>
              )}
            </div>

            <ChevronsUpDown className="opacity-50 ml-2 h-4 w-4 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Command>
            <CommandInput
              placeholder={`Search ${schemaField.title || zodKey}...`}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>{`No ${
                schemaField.title || zodKey
              } found.`}</CommandEmpty>
              <CommandGroup>
                <SubReferenceFieldItems
                  schemaField={schemaField}
                  fieldValue={selectedValue}
                  onChange={onChangeHandler}
                  switchOpen={isMultiSelect ? () => {} : switchOpenHandler} // Don't close popover for multi-select
                  getValues={getValues}
                  zodKey={zodKey}
                  isMultiSelect={isMultiSelect}
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
