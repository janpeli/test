import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { selectEditedFiles } from "@/API/editor-api/editor-api.slice";
import { Tab } from "./tab";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { reorderFilesThisLast } from "@/API/editor-api/editor-api";

export function TabArea() {
  const editorData = useAppSelector(selectEditedFiles);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabContainerRef = useRef<HTMLDivElement>(null);

  // Scroll logic
  const scrollTabs = (direction: "left" | "right") => {
    if (tabContainerRef.current) {
      const { scrollLeft } = tabContainerRef.current;
      const scrollAmount = 100;

      if (direction === "left") {
        tabContainerRef.current.scrollTo({
          left: scrollLeft - scrollAmount,
          behavior: "smooth",
        });
      } else {
        tabContainerRef.current.scrollTo({
          left: scrollLeft + scrollAmount,
          behavior: "smooth",
        });
      }
    }
  };

  // Check if we need to show scroll buttons
  const updateScrollButtons = () => {
    if (tabContainerRef.current) {
      const { scrollLeft, clientWidth, scrollWidth } = tabContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
      //console.log(scrollLeft, clientWidth, scrollWidth);
    }
  };

  // Attach scroll event listener
  useEffect(() => {
    const container = tabContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons);
      updateScrollButtons(); // Check on initial render
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", updateScrollButtons);
      }
    };
  }, []);

  useEffect(() => {
    updateScrollButtons();
  }, [editorData]);

  useEffect(() => {
    const handleResizeTabs = () => {
      updateScrollButtons();
    };

    window.addEventListener("resize", handleResizeTabs);

    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener("resize", handleResizeTabs);
    };
  }, []);

  return (
    <div className="relative border-b bg-background select-none cursor-pointer overflow-hidden">
      <div
        className="flex overflow-auto scrollbar pr-7"
        ref={tabContainerRef}
        role="tablist"
        aria-orientation="horizontal"
        tabIndex={0}
      >
        {editorData.map((item) => (
          <Tab key={item.id} editedFile={item} />
        ))}
        <TabAreaSpaceAfterTabs></TabAreaSpaceAfterTabs>
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2">
        {canScrollLeft && (
          <Button
            variant={"secondary"}
            size={"icon"}
            className=" h-full aspect-square w-auto "
            onClick={() => scrollTabs("left")}
          >
            <ChevronLeft />
          </Button>
        )}
        {canScrollRight && (
          <Button
            variant={"secondary"}
            size={"icon"}
            className=" h-full aspect-square w-auto "
            onClick={() => scrollTabs("right")}
          >
            <ChevronRight />
          </Button>
        )}
      </div>
    </div>
  );
}

export function TabAreaSpaceAfterTabs() {
  const dispatch = useAppDispatch();
  const [isDropTarget, setIsDropTarget] = useState(false);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (event.dataTransfer.types.includes("custom/draggedfileid")) {
      setIsDropTarget(true);
    }
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer.types.includes("custom/draggedfileid")) {
      setIsDropTarget(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    // Check if we're leaving the main container, not just moving between children
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDropTarget(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDropTarget(false);

    const draggedFileId = event.dataTransfer.getData("custom/draggedfileid");

    reorderFilesThisLast(dispatch, draggedFileId);
  };

  return (
    <div
      className={cn(
        "flex-1 min-w-[30px] border-l-2 border-l-transparent",
        isDropTarget && "bg-muted/70 border-l-primary"
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    />
  );
}
