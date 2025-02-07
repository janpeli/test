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
import { FormFieldProps } from "../../render-form-field";
import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";

function TableCombobox({
  zodKey,
  schemaField,
  register,
  getValues,
  setValue,
  disabled,
  fileId,
}: FormFieldProps) {
  const [open, setOpen] = useState(false);

  const [selectedValue, setSelectedValue] = useState(getValues(zodKey));

  const onChangeHandler = (v: string) => {
    setSelectedValue(v);
    setValue(zodKey, v);
    updateEditorFormDatabyPath(fileId, getValues(), zodKey);
  };

  if (disabled && selectedValue) {
    setSelectedValue("");
    setValue(zodKey, "");
    updateEditorFormDatabyPath(fileId, getValues(), zodKey);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full min-w-[150px] max-w-xs",
            "justify-between",
            !selectedValue && "text-muted-foreground"
          )}
          {...register(zodKey, { disabled: disabled })}
          value={selectedValue}
        >
          {selectedValue && !disabled
            ? selectedValue
            : `Select ${schemaField.title || zodKey}`}
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
            <CommandEmpty>{`No  ${
              schemaField.title && zodKey
            } found.`}</CommandEmpty>
            <CommandGroup>
              {schemaField.enum &&
                schemaField.enum.map((item) => (
                  <CommandItem
                    value={typeof item === "number" ? item.toString() : item}
                    key={item}
                    onSelect={() => {
                      onChangeHandler(
                        typeof item === "number" ? item.toString() : item
                      );
                      setOpen(!open);
                    }}
                  >
                    {item}
                    <Check
                      className={cn(
                        "ml-auto",
                        (typeof item === "number" ? item.toString() : item) ===
                          selectedValue
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

TableCombobox.displayName = "TableCombobox";

export default TableCombobox;

/*
 <FormItem className="flex flex-col">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-[200px] justify-between",
                      !field.value && "text-muted-foreground"
                    )}
                    disabled={field.disabled}
                    aria-disabled={field.disabled}
                  >
                    {field.value
                      ? field.value
                      : `Select ${schemaField.title || zodKey}`}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
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
                      {schemaField.enum &&
                        schemaField.enum.map((item) => (
                          <CommandItem
                            value={
                              typeof item === "number" ? item.toString() : item
                            }
                            key={item}
                            onSelect={() => {
                              field.onChange(item);
                              setOpen(!open);
                            }}
                          >
                            {item}
                            <Check
                              className={cn(
                                "ml-auto",
                                (typeof item === "number"
                                  ? item.toString()
                                  : item) === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FormItem>
*/
