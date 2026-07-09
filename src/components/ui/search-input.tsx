// Dependencies: pnpm install lucide-react

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import React from "react";

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** When provided and the (controlled) value is non-empty, shows a clear button. */
  onClear?: () => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, autoFocus, onClear, value, ...props }, ref) => {
    const showClear =
      onClear !== undefined && typeof value === "string" && value.length > 0;
    return (
      <div className="relative">
        <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={ref}
          autoFocus={autoFocus}
          placeholder="Search"
          value={value}
          className={cn("pl-8 pr-8", className)}
          {...props}
        />
        {showClear && (
          <button
            type="button"
            aria-label="Clear search"
            // Keep focus in the input when clearing.
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClear}
            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";
export { SearchInput };
