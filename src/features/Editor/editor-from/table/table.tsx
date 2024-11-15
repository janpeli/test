import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";

export function Table() {
  const tst = "abcdefgh";
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <TableHeader />
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tst.split("").map((k) => (
            <TableRow key={k} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
