import "./editor-api/editor-api";

export const COMMAND_CATEGORIES = [
  "Open",
  "Create",
  "Clipboard",
  "Path",
  "Danger",
] as const;
export type CommandCategory = (typeof COMMAND_CATEGORIES)[number];

export type Command = {
  displayName: string;
  description: string;
  category: CommandCategory;
  action: () => Promise<void>;
};

export type Commands = Command[];
