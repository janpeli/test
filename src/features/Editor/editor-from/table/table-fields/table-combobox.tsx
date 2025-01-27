import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { TableSingleFieldType } from "../table-single-field";
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

function TableCombobox({
  zodKey,
  schemaField,
  control,
  disabled,
}: TableSingleFieldType) {
  const [open, setOpen] = useState(false);
  return (
    <FormField
      control={control}
      name={zodKey}
      disabled={disabled}
      render={({ field }) => {
        return (
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
        );
      }}
    />
  );
}

TableCombobox.displayName = "TableCombobox";

export default TableCombobox;
