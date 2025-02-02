import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import EditorFormTooltip from "../editor-form-tooltip";
import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { useFormContext } from "react-hook-form";
import * as jsonpath from "jsonpath";

function SubReferenceField({ zodKey, schemaField, control }: FieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={control}
      name={zodKey}
      render={({ field }) => {
        const onChangeHandler = (v: string) => {
          field.onChange({ $sub_reference: v });
        };
        const switchOpenHandler = () => {
          setOpen(!open);
        };
        return (
          <FormItem className="flex flex-col">
            <FormLabel>
              <EditorFormTooltip tooltip={schemaField.description || ""}>
                <span>{schemaField.title ? schemaField.title : zodKey}</span>
              </EditorFormTooltip>
            </FormLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "justify-between",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value && "$sub_reference" in field.value
                      ? field.value["$sub_reference"]
                      : `Select ${schemaField.title || zodKey}`}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </FormControl>
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
                          field.value && "$sub_reference" in field.value
                            ? field.value["$sub_reference"]
                            : ""
                        }
                        onChange={onChangeHandler}
                        switchOpen={switchOpenHandler}
                      />
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

SubReferenceField.displayName = "SubReferenceField";
export default SubReferenceField;

function SubReferenceFieldItems({
  schemaField,
  fieldValue,
  onChange,
  switchOpen,
}: {
  schemaField: JSONSchema;
  fieldValue: string;
  onChange: (v: string) => void;
  switchOpen: () => void;
}) {
  const { getValues } = useFormContext();

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
      console.log(formValue);
      values = jsonpath.query(
        formValue,
        schemaField.properties.$sub_reference.JSONPath
      );
      console.log("selected values", values);
    }
  }

  return (
    <>
      {values.map((item) => (
        <CommandItem
          value={item}
          key={item}
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
