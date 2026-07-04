import path from "path";

export function assertAbsoluteCleanPath(rawPath: string): void {
  if (!path.isAbsolute(rawPath)) {
    throw new Error(`Expected absolute path, got: ${rawPath}`);
  }
}
