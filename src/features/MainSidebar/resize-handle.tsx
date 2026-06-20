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
        "resize-handle w-px bg-border hover:bg-primary transition-colors cursor-col-resize flex-shrink-0",
        activeMenu === "off" ? "hidden" : ""
      )}
      onMouseDown={onMouseDownHandler}
    ></div>
  );
}

export default ResizeHandle;
