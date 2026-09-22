// Pure auto-layout helpers for the DBML diagram — no app/store/Electron/React
// imports, so this can be unit-tested in isolation (see CLAUDE.md "*.core.ts"
// convention). Wraps @dagrejs/dagre to turn a DbmlSchema into node positions;
// dbml-editor.tsx renders those positions as absolutely-positioned table cards
// plus an SVG edge overlay.

import dagre from "@dagrejs/dagre";
import type { DbmlColumn, DbmlSchema, DbmlTable, QualifiedName } from "./dbml-parser.core";

export const TABLE_HEADER_HEIGHT = 32;
export const TABLE_ROW_HEIGHT = 24;
export const TABLE_WIDTH = 220;
export const TABLE_MIN_HEIGHT = TABLE_HEADER_HEIGHT + TABLE_ROW_HEIGHT;

/**
 * Black or white — whichever reads better on a custom `headercolor` header
 * background (standard perceptual-luminance heuristic). Returns null for a
 * malformed hex string (e.g. a headercolor written by hand, or by another
 * DBML tool, that our own writer would never produce) so the caller can fall
 * back to its normal (non-inline) text color instead of guessing.
 */
export function contrastTextColor(hex: string): "#000000" | "#ffffff" | null {
  const clean = hex.replace(/^#/, "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 150 ? "#000000" : "#ffffff";
}

/**
 * The columns actually rendered for a table — every column normally, or just
 * the PK/FK ones when the "keys only" view is on. A ref's columns are always
 * either the PK side or the FK side, so this filter never hides a column an
 * edge needs to anchor to.
 */
export function visibleColumns(
  table: DbmlTable,
  fkColumns: Set<string>,
  showOnlyPkFk: boolean
): DbmlColumn[] {
  if (!showOnlyPkFk) return table.columns;
  return table.columns.filter((c) => c.pk || fkColumns.has(c.name));
}

/**
 * Card height for a table: header + one row per (visible) column, never below
 * the header alone. Takes an explicit column list — always the table's FULL
 * columns for layout/persistence math (auto-layout spacing, bounds, group
 * boxes), but the filtered list from `visibleColumns` when computing what's
 * actually on screen under "keys only" (see table-node.tsx / edge-layer.tsx).
 */
export function tableHeight(columns: DbmlColumn[]): number {
  return TABLE_HEADER_HEIGHT + Math.max(1, columns.length) * TABLE_ROW_HEIGHT;
}

export interface TablePosition {
  x: number; // top-left corner, px
  y: number;
}

/** Auto-layout: one node per table (sized to its column count), one edge per ref. */
export function autoLayoutTables(schema: DbmlSchema): Record<string, TablePosition> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 120, marginx: 40, marginy: 40 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const table of schema.tables) {
    g.setNode(table.name, { width: TABLE_WIDTH, height: tableHeight(table.columns) });
  }
  for (const ref of schema.refs) {
    if (ref.source.table === ref.target.table) continue; // dagre can't layout self-edges
    if (!g.hasNode(ref.source.table) || !g.hasNode(ref.target.table)) continue;
    g.setEdge(ref.source.table, ref.target.table);
  }

  dagre.layout(g);

  const positions: Record<string, TablePosition> = {};
  for (const name of g.nodes()) {
    const node = g.node(name);
    if (!node) continue;
    positions[name] = { x: node.x - node.width / 2, y: node.y - node.height / 2 };
  }
  return positions;
}

export interface ContentBounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

const NEW_TABLE_GAP = 40;

/**
 * Places every table missing from `existingPositions` (e.g. a table just
 * added in SOURCE, after the diagram already has a saved layout) — stacked
 * in a column below whatever's already positioned, never touching it.
 *
 * This is deliberately NOT "re-run dagre for the full schema and keep the
 * saved positions, using dagre's fresh coordinate only for the new table":
 * dagre has no notion of "this node is pinned" — a fresh full-schema layout
 * reassigns every node's coordinates from scratch, and a disconnected node
 * (no Ref to anything) tends to land at the same fixed origin regardless of
 * how many other tables exist. Cherry-picking just the new table's fresh
 * coordinate then risks placing it exactly on top of an unrelated table that
 * kept its own (older, saved) position — see the regression test below.
 */
export function placeUnpositionedTables(
  schema: DbmlSchema,
  existingPositions: Record<QualifiedName, TablePosition>
): Record<QualifiedName, TablePosition> {
  const result: Record<QualifiedName, TablePosition> = { ...existingPositions };
  const unpositioned = schema.tables.filter((t) => !(t.name in existingPositions));
  if (unpositioned.length === 0) return result;

  const bounds = computeContentBounds(schema, existingPositions);
  const hasExisting = Object.keys(existingPositions).length > 0;
  const x = hasExisting ? bounds.minX : NEW_TABLE_GAP;
  let y = hasExisting ? bounds.minY + bounds.height + NEW_TABLE_GAP : NEW_TABLE_GAP;

  for (const table of unpositioned) {
    result[table.name] = { x, y };
    y += tableHeight(table.columns) + NEW_TABLE_GAP;
  }
  return result;
}

/** Bounding box of every positioned table, for fit-to-view and sizing the SVG edge overlay. */
export function computeContentBounds(
  schema: DbmlSchema,
  positions: Record<QualifiedName, TablePosition>
): ContentBounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const table of schema.tables) {
    const pos = positions[table.name];
    if (!pos) continue;
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + TABLE_WIDTH);
    maxY = Math.max(maxY, pos.y + tableHeight(table.columns));
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, width: 0, height: 0 };
  return { minX, minY, width: maxX - minX, height: maxY - minY };
}

/** Vertical center (within a table card) of a given column's row, header included. */
export function columnAnchorY(columns: DbmlColumn[], columnName: string): number {
  const idx = columns.findIndex((c) => c.name === columnName);
  const row = idx >= 0 ? idx : 0;
  return TABLE_HEADER_HEIGHT + row * TABLE_ROW_HEIGHT + TABLE_ROW_HEIGHT / 2;
}

export const GROUP_PADDING = 16;
export const GROUP_HEADER_HEIGHT = 22;

/**
 * Bounding box (padded, with room for a label header) around each TableGroup's
 * member tables, for rendering a group container behind them. Groups with no
 * positioned members (e.g. an empty group, or one whose tables were removed
 * from the schema) are omitted.
 */
export function computeGroupBounds(
  schema: DbmlSchema,
  positions: Record<QualifiedName, TablePosition>
): Record<string, ContentBounds> {
  const tableByName = new Map(schema.tables.map((t) => [t.name, t]));
  const result: Record<string, ContentBounds> = {};

  for (const group of schema.groups) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const tableName of group.tables) {
      const table = tableByName.get(tableName);
      const pos = positions[tableName];
      if (!table || !pos) continue;
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + TABLE_WIDTH);
      maxY = Math.max(maxY, pos.y + tableHeight(table.columns));
    }
    if (!Number.isFinite(minX)) continue;
    result[group.name] = {
      minX: minX - GROUP_PADDING,
      minY: minY - GROUP_PADDING - GROUP_HEADER_HEIGHT,
      width: maxX - minX + GROUP_PADDING * 2,
      height: maxY - minY + GROUP_PADDING * 2 + GROUP_HEADER_HEIGHT,
    };
  }
  return result;
}
