import {
  selectActiveIdProjectFolder,
  selectActiveIdProjectNode,
} from "@/API/GUI-api/active-context.slice";
import { useAppSelector } from "@/hooks/hooks";

export default function Footer() {
  const activeIdProjectNode = useAppSelector(selectActiveIdProjectNode);
  const activeIdProjectFolder = useAppSelector(selectActiveIdProjectFolder);

  return (
    <footer className="h-5 border border-t-1 text-xs flex items-center justify-end flex-shrink-0 gap-1">
      <span>
        {"Active node: "}
        {activeIdProjectNode ? activeIdProjectNode : "Not selected"}
      </span>

      <span>
        {"Active folder: "}
        {activeIdProjectFolder ? activeIdProjectFolder : "Not selected"}
      </span>
    </footer>
  );
}
