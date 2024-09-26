import { useAppSelector } from "@/hooks/hooks";
import { selectEditedFiles } from "@/API/editor-api/editor-api.slice";
import { Tab } from "./tab";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
      <div className="flex overflow-auto scrollbar" ref={tabContainerRef}>
        {editorData.map((item) => (
          <Tab key={item.id} editedFile={item} />
        ))}
        <div className="flex-none w-7" />
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
