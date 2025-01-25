import { useState } from "react";

interface UseTagsProps {
  onChange?: (tags: string[]) => void;
  defaultTags?: string[];
  maxTags?: number;
  defaultColors?: string[];
}

export function useTags({
  onChange,
  defaultTags = [],
  maxTags = 10,
  defaultColors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  ],
}: UseTagsProps = {}) {
  const [tags, setTags] = useState<string[]>(defaultTags);

  function addTag(tag: string) {
    if (tags.length >= maxTags) return;
    if (tags.some((t) => t === tag)) return;
    const newTags = [...tags, tag];
    setTags(newTags);
    onChange?.(newTags);
    return newTags;
  }

  function removeTag(tag: string) {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    onChange?.(newTags);
    return newTags;
  }

  function removeLastTag() {
    if (tags.length === 0) return;
    return removeTag(tags[tags.length - 1]);
  }

  function getTagColor(tag: string) {
    const randomColor =
      defaultColors[
        Math.floor(deterministicRandom(tag) * defaultColors.length)
      ];
    return randomColor;
  }

  return {
    tags,
    setTags,
    addTag,
    removeTag,
    removeLastTag,
    hasReachedMax: tags.length >= maxTags,
    getTagColor,
  };
}

function deterministicRandom(inputString: string) {
  // Simple hash function to convert string to a seed
  let hash = 0;
  for (let i = 0; i < inputString.length; i++) {
    const char = inputString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use a linear congruential generator with the hash as seed
  const seed = Math.abs(hash);
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);

  // Generate a pseudo-random number between 0 and 1
  const random = ((seed * a + c) % m) / m;

  return random;
}
