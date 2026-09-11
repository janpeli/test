/**
 * Pure name/extension derivation for a single directory entry (no app/electron
 * imports) so it can be unit-tested in isolation. Extracted from
 * `readProjectDataRecurisive` in `project.ts`.
 */

export interface EntryNameParts {
  /** Display name. For files, the extension is stripped (tracked separately
   * as `sufix`/extension and re-appended by the UI). Folders keep their full
   * name, dots included, since they have no extension to strip. */
  name: string;
  /** Raw file extension (e.g. "yaml"), "" for directories. */
  fileExtension: string;
  /** The "type" suffix used for plugin/icon matching — for `*.schm.yaml`-style
   * double extensions this is the inner part ("schm"), otherwise the plain
   * file extension. "" for directories. */
  sufix: string;
}

/**
 * Derives the display name, raw extension, and plugin-matching suffix for one
 * directory entry, given its raw filesystem name and whether it is a directory.
 */
export function deriveEntryNameParts(
  entryName: string,
  isDirectory: boolean,
): EntryNameParts {
  const lastDotIndex = entryName.lastIndexOf(".");
  const name =
    !isDirectory && lastDotIndex > -1
      ? entryName.slice(0, lastDotIndex)
      : entryName;

  if (isDirectory) {
    return { name, fileExtension: "", sufix: "" };
  }

  const splitName = entryName.split(".");
  const fileExtension = splitName[splitName.length - 1];

  const sufix =
    fileExtension &&
    splitName.length > 2 &&
    ["yaml", "yml"].includes(fileExtension.toLocaleLowerCase())
      ? splitName[splitName.length - 2]
      : fileExtension;

  return { name, fileExtension, sufix };
}
