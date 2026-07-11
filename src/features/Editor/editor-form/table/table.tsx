import { useFieldArray } from "react-hook-form";
import TableHeader from "./table-header/table-header";
import TableRow from "./table-row/table-row";
import TableColgroup from "./table-colgroup";
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getColumnSizing, getTableColumns } from "./column-sizing.core";
import {
  clampColumnWidth,
  parseStoredWidths,
  resolveColumnWidths,
  serializeWidths,
  storageKey,
  totalTableWidth,
} from "./column-resize.core";
import { convertToDefValues } from "../../utilities";
import { FormFieldProps } from "../render-form-field";

export function Table({
  zodKey,
  schemaField,
  control,
  ...rest
}: FormFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control: control,
    name: zodKey,
  });

  // User-set column widths (px, keyed by column name). Loaded once from
  // localStorage; written back only on drag-end / reset, not per pointermove.
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    () => {
      try {
        return parseStoredWidths(localStorage.getItem(storageKey(zodKey)));
      } catch {
        return {};
      }
    }
  );

  const persist = useCallback(
    (widths: Record<string, number>) => {
      try {
        localStorage.setItem(storageKey(zodKey), serializeWidths(widths));
      } catch {
        // Ignore quota/availability errors — persistence is best-effort.
      }
    },
    [zodKey]
  );

  // Mirror the latest widths in a ref so drag-end can persist without adding
  // `columnWidths` to its dependencies (which would re-create the callback,
  // re-rendering the memoized header, on every live drag update).
  const widthsRef = useRef(columnWidths);
  widthsRef.current = columnWidths;

  const handleColumnResize = useCallback((columnName: string, width: number) => {
    setColumnWidths((prev) => ({
      ...prev,
      [columnName]: clampColumnWidth(width),
    }));
  }, []);

  const handleColumnResizeEnd = useCallback(() => {
    persist(widthsRef.current);
  }, [persist]);

  const handleColumnResetWidth = useCallback(
    (columnName: string) => {
      setColumnWidths((prev) => {
        const next = { ...prev };
        delete next[columnName];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const { items } = schemaField;
  const { columns, columnCount, nestedCount } = useMemo(() => {
    if (!items || Array.isArray(items) || !items.properties)
      return { columns: [], columnCount: 0, nestedCount: 0 };

    const columns = getTableColumns(items).map(
      ([name, colSchema]) =>
        [name, getColumnSizing(colSchema).width] as [string, string]
    );
    const totalCount = Object.keys(items.properties).length;
    return {
      columns,
      columnCount: columns.length,
      nestedCount: totalCount - columns.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // All columns are fixed-width and the table pins itself to their sum:
  // resize drags move exactly the dragged boundary, and a too-wide table
  // scrolls inside the overflow-x-auto wrapper instead of squeezing columns.
  const resolvedWidths = useMemo(
    () => resolveColumnWidths(columns, columnWidths),
    [columns, columnWidths]
  );
  const tableWidth = totalTableWidth(resolvedWidths, nestedCount > 0);

  // Memoize the label for the add button
  const buttonLabel = useMemo(
    () => `Add ${schemaField.title || schemaField.description || zodKey}`,
    [schemaField.title, schemaField.description, zodKey]
  );

  const handleAppend = useCallback(
    () =>
      append(
        items ? convertToDefValues(Array.isArray(items) ? items[0] : items) : {}
      ),
    [append, items]
  );

  return (
    <div className="overflow-hidden rounded-md border bg-background">
      <div className="overflow-x-auto">
        <table
          className="table-fixed border-collapse text-sm"
          style={{ width: `${tableWidth}px` }}
        >
          <TableColgroup
            columnWidths={resolvedWidths}
            hasExpandColumn={nestedCount > 0}
          />
          <TableHeader
            schemaField={schemaField}
            nestedCount={nestedCount}
            onColumnResize={handleColumnResize}
            onColumnResizeEnd={handleColumnResizeEnd}
            onColumnResetWidth={handleColumnResetWidth}
          />
          <tbody className="divide-y">
            {fields.map((item, index) => (
              <TableRow
                key={item.id}
                item={item.id}
                index={index}
                zodKey={zodKey}
                schemaField={schemaField}
                columnCount={columnCount}
                nestedCount={nestedCount}
                control={control}
                {...rest}
                remove={remove}
              />
            ))}
          </tbody>
        </table>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleAppend}
        className="w-full justify-start rounded-none border-t font-normal text-muted-foreground hover:text-foreground"
      >
        <Plus className="mr-1 h-4 w-4" />
        {buttonLabel}
      </Button>
    </div>
  );
}
