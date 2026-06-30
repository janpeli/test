// Pure helper for computing a pasted copy's unique on-disk basename. No
// app/store/Electron imports so this can be transpiled with esbuild and
// exercised in isolation (see CLAUDE.md "Commands").
//
// When a node is pasted into a folder, its name must not collide with an
// existing sibling (or with another item pasted in the same batch). Pasting
// into a *different* folder with no clash keeps the original name; only on a
// clash do we append " copy", " copy 2", … — always preserving the type suffix
// (e.g. ".tbl.yaml") so plugin/product resolution stays intact.

import { splitName, composeRenamed, RenamedName } from "../rename/rename-name.core";

/**
 * Computes a unique basename for a pasted copy of `sourceBasename` given the
 * set of basenames already present in (or allocated for) the target folder.
 *
 * @param sourceBasename - The source node's basename (e.g. "Customer.tbl.yaml").
 * @param isFolder - Folders have no suffix; the whole name is the stem.
 * @param taken - Basenames already used in the target folder. Not mutated; the
 *   caller should add the returned basename before computing the next one.
 */
export function uniqueCopyName(
  sourceBasename: string,
  isFolder: boolean,
  taken: Set<string>
): RenamedName {
  const { stem, suffix } = splitName(sourceBasename, isFolder);

  // First candidate is the original name (clash-free paste keeps it), then
  // "<stem> copy", "<stem> copy 2", "<stem> copy 3", …
  let candidate = composeRenamed(stem, suffix);
  if (!taken.has(candidate.basename)) return candidate;

  candidate = composeRenamed(`${stem} copy`, suffix);
  for (let n = 2; taken.has(candidate.basename); n++) {
    candidate = composeRenamed(`${stem} copy ${n}`, suffix);
  }
  return candidate;
}
