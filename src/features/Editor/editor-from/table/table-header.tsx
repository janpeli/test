import { JSONSchema } from "@/lib/JSONSchemaToZod";
import TableHeaderCell from "./table-header-cell";
import EditorFormTooltip from "../editor-form-tooltip";

export function TableHeader({
  fieldSchema,
  nestedCount,
}: {
  fieldSchema: JSONSchema;
  nestedCount: number;
}) {
  return (
    <thead className="bg-muted-foreground">
      <tr>
        {nestedCount ? <th className="w-12 py-3"></th> : null}
        {fieldSchema.items &&
          !Array.isArray(fieldSchema.items) &&
          fieldSchema.items.properties &&
          Object.entries(fieldSchema.items.properties).map(([name, item]) => {
            if (
              (item.type !== "object" && item.type !== "array") ||
              item.format === "reference"
            ) {
              return (
                <TableHeaderCell key={name}>
                  <EditorFormTooltip tooltip={item.description || ""}>
                    <span>{item.title || name}</span>
                  </EditorFormTooltip>
                </TableHeaderCell>
              );
            }
          })}
        <th className="w-10 py-3"></th>
      </tr>
    </thead>
  );
}
