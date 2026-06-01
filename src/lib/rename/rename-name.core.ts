// Pure helpers for computing a renamed node's on-disk basename and displayed
// name. No app/store/Electron imports so this can be transpiled with esbuild
// and exercised in isolation (see CLAUDE.md "Commands").
//
// The renderer only lets the user edit the *stem* of a name; the type suffix +
// extension (e.g. ".tbl.yaml", ".can.md", ".md") is preserved verbatim so the
// suffix that drives plugin/product resolution can never be altered. Folders
// have no suffix, so their whole name is the stem.

export interface NameParts {
  // The editable portion (text before the first dot for files; whole name for
  // folders).
  stem: string;
  // Everything from the first dot onward, including the leading dot (empty when
  // there is no dot or for folders).
  suffix: string;
}

/**
 * Splits a node's on-disk basename into the editable stem and the preserved
 * suffix.
 *
 * @param basename - The last path segment (e.g. "Customer.tbl.yaml").
 * @param isFolder - Folders have no suffix; the whole name is the stem.
 */
export function splitName(basename: string, isFolder: boolean): NameParts {
  if (isFolder) {
    return { stem: basename, suffix: "" };
  }
  const firstDot = basename.indexOf(".");
  if (firstDot === -1) {
    return { stem: basename, suffix: "" };
  }
  return {
    stem: basename.slice(0, firstDot),
    suffix: basename.slice(firstDot),
  };
}

export interface RenamedName {
  // The new on-disk basename (stem + preserved suffix).
  basename: string;
  // The display name shown in the tree / tab, i.e. the basename minus its last
  // extension — matching the electron project scanner's `name` rule.
  displayName: string;
}

/**
 * Builds the renamed basename and the matching display name from a new stem and
 * the preserved suffix.
 *
 * Examples:
 *   composeRenamed("Client", ".tbl.yaml") -> { basename: "Client.tbl.yaml", displayName: "Client.tbl" }
 *   composeRenamed("diagram", ".can.md")  -> { basename: "diagram.can.md",  displayName: "diagram.can" }
 *   composeRenamed("intro", ".md")        -> { basename: "intro.md",        displayName: "intro" }
 *   composeRenamed("Revenue", "")         -> { basename: "Revenue",         displayName: "Revenue" }
 */
export function composeRenamed(newStem: string, suffix: string): RenamedName {
  const basename = newStem + suffix;
  const lastDot = basename.lastIndexOf(".");
  const displayName = lastDot > -1 ? basename.slice(0, lastDot) : basename;
  return { basename, displayName };
}
