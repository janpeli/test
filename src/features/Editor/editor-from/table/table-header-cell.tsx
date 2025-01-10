export default function TableHeaderCell(
  props: React.ThHTMLAttributes<HTMLTableCellElement>
) {
  return (
    <th
      className="py-3 px-1 text-left text-xs font-medium uppercase tracking-wider text-muted max-w-xs min-w-[100px]"
      {...props}
    ></th>
  );
}
