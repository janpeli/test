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
        "resize-handle group relative z-10 w-2 -mx-1 cursor-col-resize flex-shrink-0",
        activeMenu === "off" ? "hidden" : ""
      )}
      onMouseDown={onMouseDownHandler}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      title="Drag to resize"
    >
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border group-hover:bg-primary transition-colors" />
    </div>
  );
}

export default ResizeHandle;
