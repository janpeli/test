export default function TableHeaderCell(
  props: React.ThHTMLAttributes<HTMLTableCellElement>
) {
  return (
    <th
      className="h-8 px-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap max-w-xs min-w-[120px]"
      {...props}
    ></th>
  );
}
