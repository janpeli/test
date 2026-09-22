// Pure SVG serializer for the DBML diagram export — no app/store/Electron/React
// imports, so this can be unit-tested in isolation (see CLAUDE.md "*.core.ts"
// convention). Mirrors what dbml-editor.tsx/table-node.tsx/group-box.tsx/
// edge-layer.tsx render on screen, but as one self-contained SVG document the
// main-process resvg rasteriser can render headlessly (see
// electron/src/project/project.ts `rasterizeSvgToPng`, reused unchanged for
// this export path). The generic size/background helpers
// (getDiagramSize/pinSvgSize/injectBackground/prepareSvgString) already used
// by the canvas (Mermaid) export live in `src/lib/canvas/export-image.core.ts`
// and are reused as-is — only the diagram markup itself is DBML-specific.

import type { DbmlSchema, QualifiedName } from "./dbml-parser.core";
import {
  computeRefEdgePath,
  contrastTextColor,
  columnAnchorY,
  TABLE_HEADER_HEIGHT,
  TABLE_ROW_HEIGHT,
  TABLE_WIDTH,
  GROUP_HEADER_HEIGHT,
  visibleColumns,
  type ContentBounds,
  type TablePosition,
} from "./dbml-layout.core";

// Must match `sansSerifFamily`/`defaultFontFamily` in
// `electron/src/project/project.ts` `rasterizeSvgToPng` — same reasoning as
// `DIAGRAM_FONT_FAMILY` in `src/lib/canvas/mermaid-init.ts`: a single concrete
// font name keeps Chromium's on-screen render and resvg's headless one from
// resolving different fallback fonts.
export const DBML_EXPORT_FONT_FAMILY = "Arial";

export interface DbmlExportPalette {
  /** Canvas/page background (`bg-background` on the viewport). */
  background: string;
  /** Table card + group box fill (`bg-card` / `bg-muted`, identical in this theme). */
  card: string;
  /** Table card border, row separators, default header text (`text-card-foreground`). */
  border: string;
  cardForeground: string;
  /** Column type text, FK icon, group label/border (`text-muted-foreground`). */
  mutedForeground: string;
  /** PK icon color (Tailwind `amber-500`, same in both themes). */
  pk: string;
}

// Hardcoded to mirror `src/styles/globals.css` `:root`/`.dark` tokens
// (`--background`/`--card`/`--border`/`--foreground`/`--muted-foreground`), the
// same approach `WHITE`/`DARK` in `src/lib/canvas/export-image.core.ts` takes
// for the canvas export — every one of these tokens is grayscale (0% HSL
// saturation) in this app's theme, so `L%` converts directly to a gray hex
// byte (`round(L/100 * 255)`).
export const DBML_LIGHT_PALETTE: DbmlExportPalette = {
  background: "#fafafa", // --background: 0 0% 98%
  card: "#f5f5f5", // --card / --muted: 0 0% 96%
  border: "#d6d6d6", // --border: 0 0% 84%
  cardForeground: "#454545", // --card-foreground: 0 0% 27%
  mutedForeground: "#757575", // --muted-foreground: 0 0% 46%
  pk: "#f59e0b", // Tailwind amber-500
};

export const DBML_DARK_PALETTE: DbmlExportPalette = {
  background: "#2b2b2b", // --background: 0 0% 17%
  card: "#262626", // --card / --muted: 0 0% 15%
  border: "#3d3d3d", // --border: 0 0% 24%
  cardForeground: "#e3e3e3", // --card-foreground: 0 0% 89%
  mutedForeground: "#a1a1a1", // --muted-foreground: 0 0% 63%
  pk: "#f59e0b", // Tailwind amber-500 (unchanged across themes)
};

// lucide-react v0.294.0 `KeyRound`/`Link2` path data (ISC license), 24x24
// viewBox — the same icons table-node.tsx renders — reproduced here as raw
// path/shape data since the export is a standalone SVG with no component tree.
const KEY_ICON_PATH = "M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z";
const KEY_ICON_DOT = { cx: 16.5, cy: 7.5, r: 0.5 };
const LINK_ICON_PATHS = ["M9 17H7A5 5 0 0 1 7 7h2", "M15 7h2a5 5 0 1 1 0 10h-2"];
const LINK_ICON_LINE = { x1: 8, x2: 16, y1: 12, y2: 12 };
const ICON_SIZE = 12; // matches table-node.tsx's `h-3 w-3` (12px)

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** A 24x24-viewBox lucide icon, scaled/translated to sit at (x, y) at `size` px. */
function renderIcon(
  kind: "pk" | "fk",
  x: number,
  y: number,
  color: string
): string {
  const scale = ICON_SIZE / 24;
  const g = `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`;
  if (kind === "pk") {
    return `${g}<path d="${KEY_ICON_PATH}"/><circle cx="${KEY_ICON_DOT.cx}" cy="${KEY_ICON_DOT.cy}" r="${KEY_ICON_DOT.r}" fill="${color}"/></g>`;
  }
  return `${g}${LINK_ICON_PATHS.map((d) => `<path d="${d}"/>`).join("")}<line x1="${LINK_ICON_LINE.x1}" y1="${LINK_ICON_LINE.y1}" x2="${LINK_ICON_LINE.x2}" y2="${LINK_ICON_LINE.y2}"/></g>`;
}

export interface RenderDbmlDiagramSvgParams {
  schema: DbmlSchema;
  positions: Record<QualifiedName, TablePosition>;
  groupBounds: Record<string, ContentBounds>;
  collapsedGroupNames: Set<string>;
  hiddenTableNames: Set<QualifiedName>;
  fkColumnsByTable: Map<QualifiedName, Set<string>>;
  showOnlyPkFk: boolean;
  /** Content bounding box, e.g. from `computeContentBounds` — tables only. */
  bounds: ContentBounds;
  palette: DbmlExportPalette;
  /** Margin (px) added around the union of table/group bounds. Default 24. */
  padding?: number;
}

/**
 * Renders the DBML diagram (group boxes, table cards, ref lines) to a
 * self-contained SVG string, sized to fit its content plus `padding`. Drawing
 * order matches the live editor's DOM order: groups behind tables, ref lines
 * on top of both (see dbml-editor.tsx — `EdgeLayer` is rendered last).
 */
export function renderDbmlDiagramSvg(params: RenderDbmlDiagramSvgParams): string {
  const {
    schema,
    positions,
    groupBounds,
    collapsedGroupNames,
    hiddenTableNames,
    fkColumnsByTable,
    showOnlyPkFk,
    bounds,
    palette,
    padding = 24,
  } = params;

  let minX = bounds.width > 0 || bounds.height > 0 ? bounds.minX : 0;
  let minY = bounds.width > 0 || bounds.height > 0 ? bounds.minY : 0;
  let maxX = minX + bounds.width;
  let maxY = minY + bounds.height;

  for (const group of schema.groups) {
    const gb = groupBounds[group.name];
    if (!gb) continue;
    const collapsed = collapsedGroupNames.has(group.name);
    const w = collapsed ? TABLE_WIDTH : gb.width;
    const h = collapsed ? GROUP_HEADER_HEIGHT : gb.height;
    minX = Math.min(minX, gb.minX);
    minY = Math.min(minY, gb.minY);
    maxX = Math.max(maxX, gb.minX + w);
    maxY = Math.max(maxY, gb.minY + h);
  }

  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}" font-family="${DBML_EXPORT_FONT_FAMILY}, sans-serif" font-size="11">`
  );

  // Groups — drawn behind tables, dashed box + uppercase label (group-box.tsx).
  for (const group of schema.groups) {
    const gb = groupBounds[group.name];
    if (!gb) continue;
    const collapsed = collapsedGroupNames.has(group.name);
    const w = collapsed ? TABLE_WIDTH : gb.width;
    const h = collapsed ? GROUP_HEADER_HEIGHT : gb.height;
    parts.push(
      `<rect x="${gb.minX}" y="${gb.minY}" width="${w}" height="${h}" rx="8" fill="${palette.card}" fill-opacity="0.2" stroke="${palette.mutedForeground}" stroke-opacity="0.4" stroke-dasharray="4 3"/>`
    );
    const label = collapsed ? `${group.name} (${group.tables.length})` : group.name;
    parts.push(
      `<text x="${gb.minX + 8}" y="${gb.minY + 11}" font-size="10" font-weight="600" letter-spacing="0.5" fill="${palette.mutedForeground}" dominant-baseline="central">${escapeXml(label.toUpperCase())}</text>`
    );
  }

  const tableByName = new Map(schema.tables.map((t) => [t.name, t]));

  // Tables.
  for (const table of schema.tables) {
    if (hiddenTableNames.has(table.name)) continue;
    const pos = positions[table.name];
    if (!pos) continue;
    const columns = visibleColumns(table, fkColumnsByTable.get(table.name) ?? new Set(), showOnlyPkFk);
    const cardHeight = TABLE_HEADER_HEIGHT + Math.max(1, columns.length) * TABLE_ROW_HEIGHT;
    const headerFill = table.headerColor ?? palette.card;
    const headerTextColor = table.headerColor
      ? (contrastTextColor(table.headerColor) ?? palette.cardForeground)
      : palette.cardForeground;

    parts.push(
      `<rect x="${pos.x}" y="${pos.y}" width="${TABLE_WIDTH}" height="${cardHeight}" rx="6" fill="${palette.card}" stroke="${palette.border}"/>`
    );
    // Header background is a plain (non-rounded) rect on top, same as the
    // live table-node.tsx — its header <div> has no rounding of its own.
    parts.push(
      `<rect x="${pos.x}" y="${pos.y}" width="${TABLE_WIDTH}" height="${TABLE_HEADER_HEIGHT}" fill="${headerFill}"/>`
    );
    parts.push(
      `<line x1="${pos.x}" y1="${pos.y + TABLE_HEADER_HEIGHT}" x2="${pos.x + TABLE_WIDTH}" y2="${pos.y + TABLE_HEADER_HEIGHT}" stroke="${palette.border}"/>`
    );
    parts.push(
      `<text x="${pos.x + 8}" y="${pos.y + TABLE_HEADER_HEIGHT / 2}" font-weight="600" fill="${headerTextColor}" dominant-baseline="central">${escapeXml(table.tableName)}</text>`
    );

    columns.forEach((col, i) => {
      const rowTop = pos.y + TABLE_HEADER_HEIGHT + i * TABLE_ROW_HEIGHT;
      const rowMidY = rowTop + TABLE_ROW_HEIGHT / 2;
      if (i > 0) {
        parts.push(
          `<line x1="${pos.x}" y1="${rowTop}" x2="${pos.x + TABLE_WIDTH}" y2="${rowTop}" stroke="${palette.border}" stroke-opacity="0.5"/>`
        );
      }
      const isFk = fkColumnsByTable.get(table.name)?.has(col.name) ?? false;
      if (col.pk) {
        parts.push(renderIcon("pk", pos.x + 8, rowMidY - ICON_SIZE / 2, palette.pk));
      } else if (isFk) {
        parts.push(renderIcon("fk", pos.x + 8, rowMidY - ICON_SIZE / 2, palette.mutedForeground));
      }
      const textX = pos.x + 8 + ICON_SIZE + 6;
      const maxNameWidth = TABLE_WIDTH - (textX - pos.x) - 8 - 60;
      parts.push(
        `<text x="${textX}" y="${rowMidY}" fill="${palette.cardForeground}" dominant-baseline="central">${escapeXml(truncate(col.name, maxNameWidth))}</text>`
      );
      parts.push(
        `<text x="${pos.x + TABLE_WIDTH - 8}" y="${rowMidY}" fill="${palette.mutedForeground}" text-anchor="end" dominant-baseline="central">${escapeXml(col.type)}</text>`
      );
    });
  }

  // Ref lines — drawn last so they sit on top of the tables (same DOM order
  // as dbml-editor.tsx, where EdgeLayer is rendered after the table cards).
  for (const ref of schema.refs) {
    if (ref.source.table === ref.target.table) continue;
    if (hiddenTableNames.has(ref.source.table) || hiddenTableNames.has(ref.target.table)) continue;
    const sourceTable = tableByName.get(ref.source.table);
    const targetTable = tableByName.get(ref.target.table);
    const sourcePos = positions[ref.source.table];
    const targetPos = positions[ref.target.table];
    if (!sourceTable || !targetTable || !sourcePos || !targetPos) continue;

    const sourceCols = visibleColumns(sourceTable, fkColumnsByTable.get(sourceTable.name) ?? new Set(), showOnlyPkFk);
    const targetCols = visibleColumns(targetTable, fkColumnsByTable.get(targetTable.name) ?? new Set(), showOnlyPkFk);
    const sourceY = sourcePos.y + columnAnchorY(sourceCols, ref.source.columns[0] ?? "");
    const targetY = targetPos.y + columnAnchorY(targetCols, ref.target.columns[0] ?? "");

    parts.push(
      `<path d="${computeRefEdgePath(sourcePos, sourceY, targetPos, targetY)}" fill="none" stroke="${palette.mutedForeground}" stroke-width="1.25"/>`
    );
  }

  parts.push("</svg>");
  return parts.join("");
}

/** Rough character-width estimate (11px sans) to keep a long column name from overrunning the type column. */
function truncate(text: string, maxWidthPx: number): string {
  const approxCharWidth = 6.2;
  const maxChars = Math.max(3, Math.floor(maxWidthPx / approxCharWidth));
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1)}…`;
}

/** Strips the `.dbml` extension so the default export filename is clean. */
export function stripDbmlExtension(fileName: string): string {
  return fileName.replace(/\.dbml$/i, "");
}
