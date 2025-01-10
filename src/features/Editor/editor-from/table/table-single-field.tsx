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

export function TableSingleField({
  zodKey,
  schemaField,
  control,
}: {
  zodKey: string;
  schemaField: JSONSchema;
  control: Control;
}): React.ReactNode {
  switch (schemaField.type) {
    case "string":
      return (
        <FormField
          key={zodKey}
          control={control}
          name={zodKey}
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
    case "number":
      return (
        <FormField
          key={zodKey}
          control={control}
          name={zodKey}
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
          render={({ field }) => (
            <FormItem className="flex flex-row space-x-3 space-y-0 rounded-md border p-4 shadow items-center">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
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
