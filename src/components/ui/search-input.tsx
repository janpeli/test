// Dependencies: pnpm install lucide-react

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import React from "react";

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, type, autoFocus, ...props }, ref) => {
    return (
      <div className="relative">
        <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={ref}
          autoFocus={autoFocus}
          placeholder="Search"
          className={cn("pl-8", className)}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "SearchInput";
export { SearchInput };
