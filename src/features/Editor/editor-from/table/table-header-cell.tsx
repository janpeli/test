export default function TableHeaderCell(
  props: React.ThHTMLAttributes<HTMLTableCellElement>
) {
  return (
    <th
      className="py-3 text-left text-xs font-medium uppercase tracking-wider text-muted"
      {...props}
    ></th>
  );
}
