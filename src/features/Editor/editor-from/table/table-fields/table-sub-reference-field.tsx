import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
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

import { updateEditorFormDatabyPath } from "@/API/editor-api/editor-api";
import { FormFieldProps } from "../../render-form-field";
import { SubReferenceFieldItems } from "../../single-fields/sub-reference-field-items";

function TableSubReferenceField({
  zodKey,
  schemaField,
  register,
  getValues,
  setValue,
  disabled,
  fileId,
}: //control,
FormFieldProps) {
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

TableSubReferenceField.displayName = "TableSubReferenceField";
export default TableSubReferenceField;
