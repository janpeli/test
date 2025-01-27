import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { Control } from "react-hook-form";
import TableCombobox from "./table-combobox";
import { useFieldDisabled } from "../hooks";

export type TableSingleFieldType = {
  zodKey: string;
  schemaField: JSONSchema;
  control: Control;
  disabled: boolean;
};

export function TableSingleField({
  zodKey,
  schemaField,
  control,
}: TableSingleFieldType): React.ReactNode {
  const isDisabled = useFieldDisabled(schemaField, zodKey);
  switch (schemaField.type) {
    case "string":
      if (schemaField.enum && schemaField.enum.length) {
        return (
          <TableCombobox
            key={zodKey}
            control={control}
            zodKey={zodKey}
            schemaField={schemaField}
            disabled={isDisabled}
          />
        );
      } else {
        return (
          <FormField
            key={zodKey}
            control={control}
            name={zodKey}
            disabled={isDisabled}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      }

    case "number":
      return (
        <FormField
          key={zodKey}
          control={control}
          name={zodKey}
          disabled={isDisabled}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    case "integer":
      return (
        <FormField
          key={zodKey}
          control={control}
          name={zodKey}
          disabled={isDisabled}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="number" step="1" pattern="\d+" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    case "boolean":
      return (
        <FormField
          key={zodKey}
          control={control}
          name={zodKey}
          disabled={isDisabled}
          render={({ field }) => (
            <FormItem className="flex flex-row rounded-md border p-2 shadow items-center ">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={field.disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    default:
      return (
        <div key={zodKey}>
          title: {schemaField.title ? schemaField.title : zodKey} description
          {":"} {schemaField.description} <br /> this type is not supported{" "}
          {schemaField.type}
        </div>
      );
  }
}
