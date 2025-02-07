import { UseFieldArrayRemove } from "react-hook-form";
import React, { useState } from "react";
import { ExpandedRow } from "./expanded-row";
import { MainRow } from "./main-row";
import { FormFieldProps } from "../../render-form-field";

export interface TableRowProps extends FormFieldProps {
  item: string;
  index: number;
  remove: UseFieldArrayRemove;
  columnCount: number;
  nestedCount: number;
  toggleRow?: boolean;
}

/*
{
  item: string;
  index: number;
  remove: UseFieldArrayRemove;
  columnCount: number;
  nestedCount: number;
  zodKey: string;
  schemaField: JSONSchema;
  control: Control;
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  getValues: UseFormGetValues<FieldValues>;
  setFormDataInRedux: () => void;
}
*/

function TableRowComponent(props: TableRowProps) {
  const [toggleRow, setToggleRow] = useState<boolean>(false);

  return (
    <>
      <MainRow {...props} toggleRow={toggleRow} setToggleRow={setToggleRow} />
      <ExpandedRow {...props} toggleRow={toggleRow} />
    </>
  );
}

const TableRow = React.memo(TableRowComponent);
TableRow.displayName = "TableRow";

export default TableRow;
