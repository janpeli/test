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
import SingleFieldLabel from "./single-field-label";
//import { useFormContext } from "react-hook-form";

function ComboboxField({
  zodKey,
  schemaField,
  register,
  getValues,
}: FieldProps) {
  const [open, setOpen] = useState(false);
  //const { register, getValues } = useFormContext();

  const [selectedValue, setSelectedValue] = useState(getValues(zodKey));

  const onChangeHandler = (v: string) => {
    setSelectedValue(v);
  };

  return (
    <div className="space-y-2">
      <input type="hidden" value={selectedValue} {...register(zodKey)} />
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
              !selectedValue && "text-muted-foreground"
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
                          (typeof item === "number"
                            ? item.toString()
                            : item) === selectedValue
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
    </div>
  );
}

ComboboxField.displayName = "ComboboxField";

export default ComboboxField;
