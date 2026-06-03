import { JSONSchema } from "@/lib/JSONSchemaToZod";
import TableHeaderCell from "./table-header-cell";
import EditorFormTooltip from "../../layout/editor-form-tooltip";
import { isTableColumn } from "../table-fields/utils";
import React from "react";

function TableHeaderComponent({
  schemaField,
  nestedCount,
}: {
  schemaField: JSONSchema;
  nestedCount: number;
}) {
  return (
    <thead className="border-b bg-muted/60">
      <tr className="divide-x">
        {nestedCount ? <th className="w-9" aria-hidden></th> : null}
        {schemaField.items &&
          !Array.isArray(schemaField.items) &&
          schemaField.items.properties &&
          Object.entries(schemaField.items.properties).map(([name, item]) => {
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
        <th className="w-9" aria-hidden></th>
      </tr>
    </thead>
  );
}

const TableHeader = React.memo(TableHeaderComponent);
TableHeader.displayName = "TableHeader";

export default TableHeader;
