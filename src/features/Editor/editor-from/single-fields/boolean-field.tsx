import { FieldProps } from "../editor-single-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";
//import { useFormContext } from "react-hook-form";

function BooleanField({
  zodKey,
  schemaField,
  register,
  setValue,
  getValues,
}: FieldProps) {
  //const { register, setValue, getValues } = useFormContext();
  const [isChecked, setIsChecked] = useState<boolean>(getValues(zodKey));
  const field = register(zodKey);
  console.log(getValues(zodKey));

  return (
    <div className="flex flex-row space-x-3 space-y-0 rounded-md border p-4 shadow items-center">
      <Checkbox
        checked={isChecked}
        onCheckedChange={(value) => {
          console.log("checked state:", value);
          setValue(zodKey, value);
          setIsChecked(value ? true : false);
        }}
        {...field}
      />

      <div className="space-y-1 leading-none">
        <Label htmlFor={zodKey}>
          {schemaField.title ? schemaField.title : zodKey}
        </Label>
        {schemaField.description && (
          <p className="text-[0.8rem] text-muted-foreground">
            {schemaField.description}
          </p>
        )}
      </div>
    </div>
  );
}

BooleanField.displayName = "BooleanField";

export default BooleanField;

/*
    <FormField
      key={zodKey}
      name={zodKey}
      render={({ field }) => (
        <FormItem className="flex flex-row space-x-3 space-y-0 rounded-md border p-4 shadow items-center">
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              {...field}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>
              {schemaField.title ? schemaField.title : zodKey}
            </FormLabel>
            {schemaField.description && (
              <FormDescription>{schemaField.description}</FormDescription>
            )}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
*/
