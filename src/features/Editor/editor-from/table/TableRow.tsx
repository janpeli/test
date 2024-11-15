import { cn } from "@/lib/utils";
import { useState } from "react";

export function TableRow() {
  const [toggleRow, setToggleRow] = useState<boolean>(false);
  const columnCount: number = 5;

  return (
    <>
      <MainRow toggleRow={toggleRow} setToggleRow={setToggleRow} />
      <ExpandedRow columnCount={columnCount} toggleRow={toggleRow} />
    </>
  );
}
function ExpandedRow({
  columnCount,
  toggleRow,
}: {
  columnCount: number;
  toggleRow: boolean;
}) {
  return (
    <tr id="row1" className={cn(" bg-gray-50", toggleRow ? "hidden" : "")}>
      <td colSpan={columnCount} className="px-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone1"
              className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Department
            </label>
            <input
              type="text"
              name="department1"
              className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter department"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location1"
              className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter location"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate1"
              className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </td>
    </tr>
  );
}

function MainRow({
  setToggleRow,
  toggleRow,
}: {
  setToggleRow: (a: boolean) => void;
  toggleRow: boolean;
}) {
  return (
    <tr>
      <td className="px-6 py-4">
        <button
          type="button"
          onClick={() => {
            setToggleRow(!toggleRow);
          }}
          className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
        >
          <svg
            id="icon1"
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              toggleRow ? "rotate(0deg)" : "rotate(180deg)"
            )}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col space-y-2">
          <input
            type="text"
            name="name1"
            value="John Doe"
            className="text-sm font-medium text-gray-900 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <input
            type="email"
            name="email1"
            value="john@example.com"
            className="text-sm text-gray-500 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          name="title1"
          value="Software Engineer"
          className="text-sm text-gray-900 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <select
          name="status1"
          className="text-xs rounded-full bg-green-100 text-green-800 border-transparent focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="active">Active</option>
          <option value="away">Away</option>
          <option value="offline">Offline</option>
        </select>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          name="role1"
          value="Developer"
          className="text-sm text-gray-500 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </td>
    </tr>
  );
}
