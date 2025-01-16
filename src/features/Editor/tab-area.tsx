import { useAppSelectorWithParams } from "@/hooks/hooks";
import { selectEditedFiles } from "@/API/editor-api/editor-api.slice";
import { Tab } from "./tab";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TabAreaSpaceAfterTabs } from "./tab-area-space-after-tabs";

type TabAreaProps = {
  editorIdx: number;
};

export function TabArea({ editorIdx }: TabAreaProps) {
  const editorData = useAppSelectorWithParams(selectEditedFiles, {
    editorIdx,
  });
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
    }
  };

  // Attach scroll event listener with unique ID
  useEffect(() => {
    const container = tabContainerRef.current;
    if (container) {
      const handleScroll = (e: Event) => {
        if (e.target === container) {
          updateScrollButtons();
        }
      };

      container.addEventListener("scroll", handleScroll);
      updateScrollButtons(); // Check on initial render

      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  useEffect(() => {
    updateScrollButtons();
  }, [editorData]);

  useEffect(() => {
    const handleResizeTabs = () => {
      if (tabContainerRef.current) {
        updateScrollButtons();
      }
    };

    window.addEventListener("resize", handleResizeTabs);

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
          <Tab key={item.id} editedFile={item} editorIdx={editorIdx} />
        ))}
        <TabAreaSpaceAfterTabs editorIdx={editorIdx} />
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2">
        {canScrollLeft && (
          <Button
            variant="secondary"
            size="icon"
            className="h-full aspect-square w-auto"
            onClick={() => scrollTabs("left")}
          >
            <ChevronLeft />
          </Button>
        )}
        {canScrollRight && (
          <Button
            variant="secondary"
            size="icon"
            className="h-full aspect-square w-auto"
            onClick={() => scrollTabs("right")}
          >
            <ChevronRight />
          </Button>
        )}
      </div>
    </div>
  );
}
