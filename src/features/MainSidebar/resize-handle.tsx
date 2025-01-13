import { useAppSelector } from "@/hooks/hooks";
import { selectActiveMenu } from "../../API/GUI-api/main-sidebar.slice";
import { cn } from "@/lib/utils";
import { MouseEventHandler } from "react";

function ResizeHandle({
  onMouseDownHandler,
}: {
  onMouseDownHandler: MouseEventHandler;
}) {
  const activeMenu = useAppSelector(selectActiveMenu);

  return (
    <div
      className={cn(
        "resize-handle w-1 bg-transparent hover:bg-blue-500 cursor-col-resize flex-shrink-0 border-r hover:border-none",
        activeMenu === "off" ? "hidden" : ""
      )}
      onMouseDown={onMouseDownHandler}
    ></div>
  );
}

export default ResizeHandle;
