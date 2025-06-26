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

  const getDisplayText = () => {
    if (isMultiSelect) {
      const array = Array.isArray(selectedValue) ? selectedValue : [];
      if (array.length === 0) {
        return `Select ${schemaField.title || zodKey}`;
      } else if (array.length === 1) {
        return array[0];
      } else {
        return `${array.length} items selected`;
      }
    } else {
      return selectedValue || `Select ${schemaField.title || zodKey}`;
    }
  };

  return (
    <div className="space-y-2">
      <SingleFieldLabel
        title={schemaField.title}
        description={schemaField.description}
        zodKey={zodKey}
        control={control}
      />

      {/* Multi-select pills display */}
      {isMultiSelect &&
        Array.isArray(selectedValue) &&
        selectedValue.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {selectedValue.map((item, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => removeItem(item)}
                  className="hover:bg-secondary-foreground/20 rounded-sm p-0.5"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between",
              (!selectedValue ||
                (isMultiSelect &&
                  Array.isArray(selectedValue) &&
                  selectedValue.length === 0)) &&
                "text-muted-foreground"
            )}
            {...register(zodKey + ".$sub_reference", { disabled: disabled })}
          >
            {getDisplayText()}
            <ChevronsUpDown className="opacity-50" />
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
