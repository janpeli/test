import { JSONSchema } from "@/lib/JSONSchemaToZod";
import TableHeaderCell from "./table-header-cell";
import EditorFormTooltip from "../../layout/editor-form-tooltip";
import { getTableColumns } from "../column-sizing.core";
import React from "react";

export interface TableHeaderProps {
  schemaField: JSONSchema;
  nestedCount: number;
  /** Live width update while a handle is dragged (already-clamped px). */
  onColumnResize: (columnName: string, width: number) => void;
  /** Drag finished — persist current widths. */
  onColumnResizeEnd: () => void;
  /** Double-click a handle — drop that column's override. */
  onColumnResetWidth: (columnName: string) => void;
}

function TableHeaderComponent({
  schemaField,
  nestedCount,
  onColumnResize,
  onColumnResizeEnd,
  onColumnResetWidth,
}: TableHeaderProps) {
  const columns =
    schemaField.items && !Array.isArray(schemaField.items)
      ? getTableColumns(schemaField.items)
      : [];

  return (
    <thead className="border-b border-border bg-card">
      <tr className="divide-x divide-border">
        {nestedCount ? <th className="w-9" aria-hidden></th> : null}
        {columns.map(([name, item]) => (
          <TableHeaderCell
            key={name}
            resize={{
              columnName: name,
              onResize: onColumnResize,
              onResizeEnd: onColumnResizeEnd,
              onReset: onColumnResetWidth,
            }}
          >
            <EditorFormTooltip tooltip={item.description || ""}>
              <span className="block truncate">{item.title || name}</span>
            </EditorFormTooltip>
          </TableHeaderCell>
        ))}
        <th className="w-9" aria-hidden></th>
      </tr>
    </thead>
  );
}

const TableHeader = React.memo(TableHeaderComponent);
TableHeader.displayName = "TableHeader";

export default TableHeader;
