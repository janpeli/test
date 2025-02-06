import { FieldProps } from "../editor-single-field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { FieldValues, UseFormGetValues } from "react-hook-form";
import * as jsonpath from "jsonpath";
import SingleFieldLabel from "./single-field-label";

function SubReferenceField({
  zodKey,
  schemaField,
  register,
  getValues,
  setValue,
}: FieldProps) {
  const [open, setOpen] = useState(false);

  const [selectedValue, setSelectedValue] = useState(
    getValues(zodKey + ".$sub_reference")
  );

  const onChangeHandler = (v: string) => {
    setSelectedValue(v);
    setValue(zodKey + ".$sub_reference", v);
  };
  const switchOpenHandler = () => {
    setOpen(!open);
  };

  return (
    <div className="space-y-2">
      <input
        type="hidden"
        value={selectedValue}
        {...register(zodKey + ".$sub_reference")}
      />
      <SingleFieldLabel
        title={schemaField.title}
        description={schemaField.description}
        zodKey={zodKey}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "justify-between w-full",
              selectedValue && "text-muted-foreground"
            )}
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
}: {
  schemaField: JSONSchema;
  fieldValue: string;
  onChange: (v: string) => void;
  switchOpen: () => void;
  getValues: UseFormGetValues<FieldValues>;
}) {
  //const { getValues } = useFormContext();

  let values: string[] = [];
  if (schemaField.properties && "$sub_reference" in schemaField.properties) {
    if ("file_property" in schemaField.properties.$sub_reference) {
      null;
    }

    if ("file_JSONPath" in schemaField.properties.$sub_reference) {
      null;
    }

    if ("JSONPath" in schemaField.properties.$sub_reference) {
      const formValue = getValues();
      values = jsonpath.query(
        formValue,
        schemaField.properties.$sub_reference.JSONPath
      );
    }
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
