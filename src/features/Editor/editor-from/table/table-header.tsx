import { JSONSchema } from "@/lib/JSONSchemaToZod";
import TableHeaderCell from "./table-header-cell";
import EditorFormTooltip from "../editor-form-tooltip";
import { isTableColumn } from "./table-fields/utils";
import React from "react";

function TableHeaderComponent({
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
            if (isTableColumn(item)) {
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

const TableHeader = React.memo(TableHeaderComponent);
TableHeader.displayName = "TableHeader";

export default TableHeader;
