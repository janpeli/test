import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { JSONSchema } from "@/lib/JSONSchemaToZod";
import { Control } from "react-hook-form";

export function EditorSingleField({
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
              <FormLabel>
                {schemaField.title ? schemaField.title : zodKey}
              </FormLabel>
              <FormControl>
                <Input placeholder="..." {...field} />
              </FormControl>
              {schemaField.description && (
                <FormDescription>{schemaField.description}</FormDescription>
              )}
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
              <FormLabel>
                {schemaField.title ? schemaField.title : zodKey}
              </FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              {schemaField.description && (
                <FormDescription>{schemaField.description}</FormDescription>
              )}
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
              <FormLabel>
                {schemaField.title ? schemaField.title : zodKey}
              </FormLabel>
              <FormControl>
                <Input type="number" step="1" pattern="\d+" {...field} />
              </FormControl>
              {schemaField.description && (
                <FormDescription>{schemaField.description}</FormDescription>
              )}
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
              <div className="space-y-1 leading-none">
                <FormLabel>
                  {schemaField.title ? schemaField.title : zodKey}
                </FormLabel>
                {schemaField.description && (
                  <FormDescription>{schemaField.description}</FormDescription>
                )}
              </div>
            </FormItem>
          )}
        />
      );
    default:
      return (
        <div key={zodKey}>
          title: {schemaField.title ? schemaField.title : zodKey} description
          {":"} {schemaField.description} <br /> not sure what is this type{" "}
          {schemaField.type}
        </div>
      );
  }
}
