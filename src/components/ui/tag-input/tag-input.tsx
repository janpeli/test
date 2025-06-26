import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useTags } from "./use-tags";

import { Cross2Icon, CheckIcon, PlusIcon } from "@radix-ui/react-icons";
import { useOnClickOutside } from "@/hooks/hooks";
import React from "react";
import {
  BlancPopoverContent,
  Popover,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TagInputProps {
  onChange?: (tags: string[]) => void;
  name: string;
  value?: string[];
  suggestions?: string[];
  maxTags?: number;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  suggestionsOnly?: boolean; // New property to restrict to suggestions only
}

const tagStyles = {
  base: "inline-flex items-center gap-1.5 px-2 py-0.5 text-sm rounded-md transition-colors duration-150",
  colors: {
    blue: "bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/30 dark:hover:border-blue-600/50",
    purple:
      "bg-purple-50 text-purple-700 border border-purple-200 hover:border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/30 dark:hover:border-purple-600/50",
    green:
      "bg-green-50 text-green-700 border border-green-200 hover:border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/30 dark:hover:border-green-600/50",
  },
};

const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  (
    {
      onChange,
      name,
      value = [],
      suggestions = [],
      maxTags = 10,
      placeholder = "Add tags...",
      error,
      disabled,
      suggestionsOnly = false, // Default to false for backward compatibility
    },
    ref
  ) => {
    const { tags, addTag, removeTag, removeLastTag, getTagColor } = useTags({
      onChange,
      defaultTags: value,
      maxTags,
    });
    const [input, setInput] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const popOverRef = useRef<HTMLDivElement>(null);

    const filteredSuggestions = suggestions
      .filter(
        (suggestion: string) =>
          typeof input === "string" &&
          suggestion.toLowerCase().indexOf(input.toLowerCase()) >= 0 &&
          !tags.some((tag: string) => tag === suggestion)
      )
      .slice(0, 5);

    // Modified to respect suggestionsOnly setting
    const canAddNewTag =
      !suggestionsOnly &&
      input.length > 0 &&
      !suggestions.some((s) => s.toLowerCase() === input.toLowerCase());

    function addNewTag(tag: string) {
      addTag(tag);
      setInput("");
      setIsOpen(false);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
      if (e.key === "Backspace" && input === "" && tags.length > 0) {
        removeLastTag();
      } else if (e.key === "Enter" && input) {
        e.preventDefault();
        if (isOpen && filteredSuggestions[selectedIndex]) {
          addNewTag(filteredSuggestions[selectedIndex]);
        } else if (canAddNewTag) {
          addNewTag(input);
        }
        // When suggestionsOnly is true and no valid suggestion is selected,
        // don't add anything and just close the popover
        else if (suggestionsOnly) {
          setIsOpen(false);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "ArrowDown" && isOpen) {
        e.preventDefault();
        const maxIndex = canAddNewTag
          ? filteredSuggestions.length
          : filteredSuggestions.length - 1;
        setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
      } else if (e.key === "ArrowUp" && isOpen) {
        e.preventDefault();
        const maxIndex = canAddNewTag
          ? filteredSuggestions.length
          : filteredSuggestions.length - 1;
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
      }
    }

    const clickOutsideHandler = useCallback((e: MouseEvent) => {
      if (!popOverRef.current || popOverRef.current.contains(e.target as Node))
        return;
      setIsOpen(false);
    }, []);

    useOnClickOutside(containerRef, clickOutsideHandler);

    // Update placeholder text when suggestionsOnly is true
    const getPlaceholder = () => {
      if (tags.length > 0) return "";
      if (suggestionsOnly && suggestions.length > 0) {
        return "Choose from suggestions...";
      }
      return placeholder;
    };

    return (
      <div
        className="w-full max-w-full sm:max-w-2xl space-y-2"
        ref={containerRef}
      >
        <Popover
          open={
            isOpen && (input || filteredSuggestions.length > 0) ? true : false
          }
          onOpenChange={setIsOpen}
        >
          <PopoverTrigger asChild>
            <div
              className={cn(
                "min-h-[3rem] sm:min-h-[2.5rem] p-2 sm:p-1.5",
                "rounded-md border",
                "focus-within:ring-1 ",
                "flex items-center flex-row flex-wrap gap-2 sm:gap-1.5 relative"
              )}
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    tagStyles.base,
                    "text-base sm:text-sm py-1 sm:py-0.5",
                    getTagColor(tag) || tagStyles.colors.blue
                  )}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className={cn(
                      "text-current/60 hover:text-current transition-colors",
                      "p-1 sm:p-0"
                    )}
                  >
                    <Cross2Icon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                </span>
              ))}

              <input
                id={name}
                name={name}
                ref={ref}
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setIsOpen(true);
                  setSelectedIndex(0);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                className={cn(
                  "flex-1 min-w-[140px] sm:min-w-[120px] bg-transparent",
                  "h-8 sm:h-7",
                  "text-base sm:text-sm",
                  "text-zinc-900 dark:text-zinc-100",
                  "placeholder:text-zinc-500 dark:placeholder:text-zinc-400",
                  "focus:outline-none"
                )}
                disabled={disabled}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-autocomplete="list"
              />

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>
          </PopoverTrigger>
          <BlancPopoverContent
            ref={popOverRef}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {isOpen && (input || filteredSuggestions.length > 0) && (
              <div
                className={cn(
                  "max-h-[60vh] sm:max-h-[300px] overflow-y-auto",
                  "bg-white dark:bg-zinc-900",
                  "overflow-hidden"
                )}
              >
                <div className="px-2 py-1.5 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    {suggestionsOnly
                      ? "Choose a tag"
                      : "Choose a tag or create one"}
                  </span>
                </div>
                <div className="p-2 sm:p-1.5 flex flex-wrap gap-2 sm:gap-1.5">
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      type="button"
                      key={suggestion}
                      onClick={() => {
                        addNewTag(suggestion);
                      }}
                      className={cn(
                        tagStyles.base,
                        selectedIndex === index
                          ? tagStyles.colors.blue
                          : "bg-zinc-50 text-zinc-700 border border-zinc-300 hover:border-zinc-400 dark:bg-zinc-800/50 dark:text-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                      )}
                    >
                      {suggestion}
                      {selectedIndex === index && (
                        <CheckIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ))}
                  {canAddNewTag && (
                    <button
                      type="button"
                      onClick={() => {
                        addNewTag(input);
                      }}
                      className={cn(
                        tagStyles.base,
                        selectedIndex === filteredSuggestions.length
                          ? tagStyles.colors.blue
                          : "bg-zinc-50 text-zinc-700 border border-zinc-300 hover:border-zinc-400 dark:bg-zinc-800/50 dark:text-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                      )}
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      Create "{input}"
                    </button>
                  )}
                </div>
                {/* Show message when no suggestions match and suggestionsOnly is true */}
                {suggestionsOnly &&
                  filteredSuggestions.length === 0 &&
                  input && (
                    <div className="p-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      No matching suggestions found
                    </div>
                  )}
              </div>
            )}
          </BlancPopoverContent>
        </Popover>
      </div>
    );
  }
);

TagInput.displayName = "TagInput";

export default TagInput;
