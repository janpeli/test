// Pure state-machine helpers for keeping the DBML diagram's in-memory layout
// in step with its on-disk sidecar across file switches and concurrent writes
// — no app/store/Electron/React imports (see CLAUDE.md "*.core.ts" convention).
// dbml-editor.tsx is the stateful wrapper: it owns the `loadedLayout` React
// state and the async read/write IPC calls, and defers every decision about
// what that state means to the functions here.

import type { DbmlSchema, QualifiedName } from "./dbml-parser.core";
import { autoLayoutTables, placeUnpositionedTables, type TablePosition } from "./dbml-layout.core";
import { emptyDbmlLayoutFile, type DbmlLayoutFile } from "./dbml-layout-file.core";

/** A sidecar read result, stamped with the fileId it was read for. */
export interface LoadedLayout {
  fileId: string;
  // null = no sidecar on disk yet (free to auto-layout), as distinct from
  // "not loaded yet" — see deriveLayoutState.
  layout: DbmlLayoutFile | null;
}

/**
 * Tri-state view of `loadedLayout` for the file currently open. `ready` is
 * false until a read stamped for THIS fileId has landed, so callers can never
 * mistake "haven't loaded it yet" for "loaded, and it's genuinely empty" —
 * the two must be told apart wherever the difference changes behaviour
 * (resolvePositions below: laying out against an unloaded/wrong-file layout
 * would produce a wrong frame that then gets persisted). Reads that are fine
 * treating both cases the same way (a view toggle's default, a group's
 * collapsed state) can go through `layoutOrEmpty` instead of branching on
 * `ready` themselves.
 */
export type LayoutState = { ready: false } | { ready: true; layout: DbmlLayoutFile | null };

export function deriveLayoutState(
  fileId: string | undefined,
  loaded: LoadedLayout | null
): LayoutState {
  if (!fileId || loaded?.fileId !== fileId) return { ready: false };
  return { ready: true, layout: loaded.layout };
}

/**
 * The layout to read or merge a mutation into, collapsing "not loaded yet"
 * and "loaded, nothing saved" into the same empty value — safe for anything
 * that only reads with a sensible default, or merges on top (never decides
 * whether to auto-layout from scratch, which needs `resolvePositions`).
 */
export function layoutOrEmpty(state: LayoutState): DbmlLayoutFile {
  return (state.ready ? state.layout : null) ?? emptyDbmlLayoutFile();
}

/**
 * The table positions to render: nothing until this file's own sidecar has
 * been read (laying out against another file's, or no, layout only produces
 * a wrong frame that would then get persisted); a fresh relational
 * auto-layout once it's confirmed there's nothing saved yet; otherwise the
 * saved positions, with any table missing from them (added in SOURCE since
 * the last save) placed by `placeUnpositionedTables`.
 */
export function resolvePositions(
  schema: DbmlSchema,
  state: LayoutState
): Record<QualifiedName, TablePosition> {
  if (!state.ready) return {};
  const saved = state.layout;
  if (!saved || Object.keys(saved.tables).length === 0) {
    return autoLayoutTables(schema);
  }
  return placeUnpositionedTables(schema, saved.tables);
}

/** True when some table in `schema` has no entry in the saved layout yet. */
export function hasUnsavedTableGap(
  schema: DbmlSchema,
  savedTables: Record<QualifiedName, unknown>
): boolean {
  return schema.tables.some((t) => !(t.name in savedTables));
}
