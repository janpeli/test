import "./editor-api/editor-api";

export type Command = {
  displayName: string;
  description: string;
  contextGroup: string[];
  action: () => Promise<void>;
};

export type Commands = Command[];
