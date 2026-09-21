import { List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { HeadingEntry } from "./heading-anchors.core";

type MarkdownTocProps = {
  headings: HeadingEntry[];
  onSelect: (slug: string) => void;
};

// Only worth showing once there's an actual outline to jump around in.
const MIN_HEADINGS = 3;

/** Floating "outline" button (top-right of the preview pane) opening a
 * popover list of headings; picking one scrolls the preview to it. */
export function MarkdownToc({ headings, onSelect }: MarkdownTocProps) {
  if (headings.length < MIN_HEADINGS) return null;

  const minLevel = Math.min(...headings.map((h) => h.level));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-3 right-3 z-10 h-7 w-7 shadow-sm"
          aria-label="Table of contents"
          title="Table of contents"
        >
          <List className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1.5">
        <ScrollArea className="max-h-72">
          <nav className="flex flex-col">
            {headings.map((h) => (
              <button
                key={h.slug}
                type="button"
                onClick={() => onSelect(h.slug)}
                className="truncate rounded-sm py-1 pr-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                style={{ paddingLeft: `${0.5 + (h.level - minLevel) * 0.75}rem` }}
              >
                {h.text}
              </button>
            ))}
          </nav>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default MarkdownToc;
