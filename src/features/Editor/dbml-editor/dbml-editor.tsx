import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { store } from "@/app/store";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import {
  selectOpenFile,
  selectOpenFileContent,
  selectOpenFileId,
} from "@/API/editor-api/editor-api.selectors";
import { setFileContent } from "@/API/editor-api/editor-api.slice";
import { Button } from "@/components/ui/button";
import { parseDbml, fkColumnsByTable } from "@/lib/dbml/dbml-parser.core";
import { computeContentBounds, computeGroupBounds } from "@/lib/dbml/dbml-layout.core";
import { DbmlLayoutFile } from "@/lib/dbml/dbml-layout-file.core";
import {
  deriveLayoutState,
  hasUnsavedTableGap,
  layoutOrEmpty,
  resolvePositions,
} from "@/lib/dbml/dbml-layout-sync.core";
import { readDbmlLayout, writeDbmlLayout } from "@/lib/dbml/dbml-layout-store";
import { setTableHeaderColor } from "@/lib/dbml/dbml-source-edit.core";
import { insertObjectIntoDbml } from "@/lib/products/dbml-insert";
import TableNode from "./table-node";
import EdgeLayer from "./edge-layer";
import GroupBox from "./group-box";

// dataTransfer key set by the treeview when dragging an object (node-controller).
const MODEL_OBJECT_MIME = "application/x-model-object";

const MIN_SCALE = 0.1;
const MAX_SCALE = 3;
const ZOOM_STEP = 1.1;

const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

type DbmlEditorProps = {
  editorIdx: number;
};

function DbmlEditor({ editorIdx }: DbmlEditorProps) {
  const content = useAppSelectorWithParams(selectOpenFileContent, { editorIdx });
  const fileId = useAppSelectorWithParams(selectOpenFileId, { editorIdx });
  const openFile = useAppSelectorWithParams(selectOpenFile, { editorIdx });
  // DbmlEditor stays mounted (at zero width) for every open file, not just DBML
  // ones — see content-editor.tsx's "hidden panes stay mounted" note. Without
  // this guard it would re-parse a non-DBML file's raw content on every
  // keystroke for no reason.
  const isDbmlCapable = openFile?.modes?.includes("DBML") ?? false;

  const viewportRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);

  // Pan/zoom state lives in a ref and is written straight to the DOM so wheel
  // ticks and pointer moves don't trigger React re-renders (same pattern as
  // canvas-editor.tsx).
  const view = useRef({ scale: 1, x: 0, y: 0 });

  const { schema, error } = useMemo(
    () => (isDbmlCapable ? parseDbml(content ?? "") : { schema: null, error: null }),
    [content, isDbmlCapable]
  );

  // The persisted sidecar layout, ALWAYS stamped with the fileId it was read
  // for. Without the stamp, a tab switch flips `fileId`/`content` mid-render
  // while this state (reset only in an effect) still holds the previous
  // file's layout, so for one render the new schema gets paired with the old
  // positions — stacking every table and then persisting that stack over the
  // new file's real saved layout.
  const [loadedLayout, setLoadedLayout] = useState<{
    fileId: string;
    // null = no sidecar on disk yet (free to auto-layout), as distinct from
    // "not loaded yet", which is a stamp mismatch / no state at all.
    layout: DbmlLayoutFile | null;
  } | null>(null);

  // Single source of truth for "is this file's sidecar loaded, and what does
  // it say" — see dbml-layout-sync.core.ts. Deliberately not split into a
  // separate ready-boolean and layout-value pair: with two parallel consts, a
  // future addition that reads the layout value without also checking
  // readiness would silently reconflate "not loaded yet" with "loaded, and
  // genuinely empty", which is exactly the bug class this file's race-fix
  // closes (see resolvePositions below).
  const layoutState = useMemo(() => deriveLayoutState(fileId, loadedLayout), [fileId, loadedLayout]);
  // Read-only convenience view for call sites that don't care about that
  // distinction (a view toggle's default, a group's collapsed state) — see
  // layoutOrEmpty's own doc comment for which sites must branch on
  // `layoutState.ready` directly instead.
  const layout = useMemo(() => layoutOrEmpty(layoutState), [layoutState]);

  // Set by updateLayout whenever it commits a write for the file the load
  // effect below is currently fetching. Without this, a mutation (drag,
  // group collapse, view toggle) that lands between the disk read starting
  // and resolving gets silently reverted when that stale read resolves and
  // unconditionally overwrites `loadedLayout` with the pre-edit snapshot.
  const writtenSinceLoadStarted = useRef(false);

  useEffect(() => {
    if (!isDbmlCapable || !fileId) {
      setLoadedLayout(null);
      return;
    }
    let cancelled = false;
    writtenSinceLoadStarted.current = false;
    void readDbmlLayout(fileId).then((layout) => {
      if (!cancelled && !writtenSinceLoadStarted.current) {
        setLoadedLayout({ fileId, layout });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fileId, isDbmlCapable]);

  // Applies `updater` to the current layout and persists the result — the
  // single place every mutation (drag, group collapse, view toggle) goes
  // through, so none of them can accidentally drop another's fields.
  // Gated on `layoutState.ready`, not just `fileId`: until this file's own
  // sidecar has actually been read, there's no way to tell "nothing saved
  // yet" apart from "haven't loaded it yet", and treating the latter as the
  // former would persist an empty layout over the file's real saved
  // positions.
  const updateLayout = useCallback(
    (updater: (prev: DbmlLayoutFile) => DbmlLayoutFile) => {
      if (!fileId || !layoutState.ready) return;
      writtenSinceLoadStarted.current = true;
      setLoadedLayout((prev) => {
        // Re-derived from the latest `prev` (not the outer `layoutState`),
        // since this runs inside React's state updater and prev may have
        // moved on; only another file's layout can be in state here (see the
        // stamp note above) — never merge it into this file's sidecar.
        const base = layoutOrEmpty(deriveLayoutState(fileId, prev));
        const next = updater(base);
        void writeDbmlLayout(fileId, next);
        return { fileId, layout: next };
      });
    },
    [fileId, layoutState]
  );

  // See resolvePositions' own doc comment for the auto-layout-vs-placement
  // decision (dbml-layout-sync.core.ts) — a brand new file (nothing saved
  // yet) gets dagre's full relational auto-layout, while an existing layout
  // only has its gaps (tables added in SOURCE since the last save) filled in,
  // never re-run through dagre wholesale: dagre has no notion of "this node
  // is pinned", so a fresh full-schema run can (and did — see its own
  // regression test) place a new table exactly on top of an unrelated one
  // that kept its old saved spot.
  const positions = useMemo(() => {
    if (!schema) return {};
    return resolvePositions(schema, layoutState);
  }, [schema, layoutState]);

  // Camera fit-to-view deliberately uses the committed `positions`, not the
  // live drag overlay below — the camera shouldn't jump around mid-drag.
  const bounds = useMemo(
    () =>
      schema
        ? computeContentBounds(schema, positions)
        : { minX: 0, minY: 0, width: 0, height: 0 },
    [schema, positions]
  );
  const fkByTable = useMemo(
    () => (schema ? fkColumnsByTable(schema) : new Map<string, Set<string>>()),
    [schema]
  );

  // Persist as soon as the merged positions cover a table the saved layout
  // doesn't have yet (first-ever open, or a table added since the last save),
  // so the sidecar file stays a stable, reviewable superset instead of
  // silently drifting from what's actually on screen.
  useEffect(() => {
    if (!isDbmlCapable || !schema || !layoutState.ready || !fileId) return;
    if (!hasUnsavedTableGap(schema, layout.tables)) return;
    updateLayout((prev) => ({ ...prev, tables: positions }));
  }, [schema, layoutState, layout, positions, isDbmlCapable, fileId, updateLayout]);

  // Live delta while a drag is in progress — one table (dragging its header)
  // or every member of a group (dragging the group's header), all shifted by
  // the same (dx, dy) from where the gesture started. Overlaid on top of the
  // committed `positions` so ref lines AND group boxes track the drag in real
  // time (see groupBounds below — it deliberately reads this, not the
  // committed `positions`, or a dragged table would visually leave its
  // group's box until you release the drag).
  const [liveDrag, setLiveDrag] = useState<{ tableNames: string[]; dx: number; dy: number } | null>(
    null
  );
  const effectivePositions = useMemo(() => {
    if (!liveDrag) return positions;
    const next = { ...positions };
    for (const name of liveDrag.tableNames) {
      const base = positions[name];
      if (base) next[name] = { x: base.x + liveDrag.dx, y: base.y + liveDrag.dy };
    }
    return next;
  }, [positions, liveDrag]);

  const groupBounds = useMemo(
    () => (schema ? computeGroupBounds(schema, effectivePositions) : {}),
    [schema, effectivePositions]
  );

  // Commits a (possibly multi-table) drag delta to the persisted layout in
  // one write, rounding each landing position to whole pixels. Seeded from
  // `positions` (the full layout currently on screen — dagre's output when
  // nothing's saved yet, saved+placed otherwise), not `prev.tables`: on a
  // brand-new diagram prev.tables is still empty, and basing the write on it
  // would only persist the dragged table, leaving every other one to fall
  // into placeUnpositionedTables' stacking fallback on the next render.
  const commitDragDelta = useCallback(
    (tableNames: string[], dx: number, dy: number) => {
      updateLayout((prev) => {
        const nextTables = { ...positions };
        for (const name of tableNames) {
          const base = positions[name];
          if (base) nextTables[name] = { x: Math.round(base.x + dx), y: Math.round(base.y + dy) };
        }
        return { ...prev, tables: nextTables };
      });
    },
    [positions, updateLayout]
  );

  const handleDragMove = useCallback((tableName: string, dx: number, dy: number) => {
    setLiveDrag({ tableNames: [tableName], dx, dy });
  }, []);

  const handleDragEnd = useCallback(
    (tableName: string, dx: number, dy: number) => {
      setLiveDrag(null);
      commitDragDelta([tableName], dx, dy);
    },
    [commitDragDelta]
  );

  const groupMembers = useCallback(
    (groupName: string) => schema?.groups.find((g) => g.name === groupName)?.tables ?? [],
    [schema]
  );

  const handleGroupDragMove = useCallback(
    (groupName: string, dx: number, dy: number) => {
      setLiveDrag({ tableNames: groupMembers(groupName), dx, dy });
    },
    [groupMembers]
  );

  const handleGroupDragEnd = useCallback(
    (groupName: string, dx: number, dy: number) => {
      setLiveDrag(null);
      commitDragDelta(groupMembers(groupName), dx, dy);
    },
    [commitDragDelta, groupMembers]
  );

  const handleToggleGroupCollapse = useCallback(
    (groupName: string) => {
      updateLayout((prev) => {
        const collapsed = prev.groups?.[groupName]?.collapsed ?? false;
        return { ...prev, groups: { ...prev.groups, [groupName]: { collapsed: !collapsed } } };
      });
    },
    [updateLayout]
  );

  // headercolor is a real DBML table setting (not app-specific view state), so
  // it's written into the source itself, not the sidecar layout file — see
  // dbml-source-edit.core.ts.
  const handleHeaderColorChange = useCallback(
    (tableName: string, color: string) => {
      if (!fileId || !schema) return;
      const nextContent = setTableHeaderColor(content ?? "", schema, tableName, color);
      if (nextContent !== content) {
        store.dispatch(setFileContent({ fileId, content: nextContent }));
      }
    },
    [fileId, schema, content]
  );

  const showOnlyPkFk = layout.viewSettings?.showOnlyPkFk ?? false;
  const handleToggleShowOnlyPkFk = useCallback(() => {
    updateLayout((prev) => ({
      ...prev,
      viewSettings: { ...prev.viewSettings, showOnlyPkFk: !showOnlyPkFk },
    }));
  }, [updateLayout, showOnlyPkFk]);

  // Tables belonging to a collapsed group are hidden entirely (and their refs
  // with them — see EdgeLayer's hiddenTableNames prop).
  const hiddenTableNames = useMemo(() => {
    const hidden = new Set<string>();
    if (!schema) return hidden;
    for (const group of schema.groups) {
      if (layout.groups?.[group.name]?.collapsed) {
        for (const t of group.tables) hidden.add(t);
      }
    }
    return hidden;
  }, [schema, layout]);

  const [search, setSearch] = useState("");
  const searchLower = search.trim().toLowerCase();
  const matchesSearch = useCallback(
    (tableName: string, tableLabel: string): boolean | null => {
      if (!searchLower) return null;
      return (
        tableLabel.toLowerCase().includes(searchLower) ||
        tableName.toLowerCase().includes(searchLower)
      );
    },
    [searchLower]
  );

  const applyTransform = useCallback(() => {
    if (!transformRef.current) return;
    const { scale, x, y } = view.current;
    transformRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  }, []);

  // Reset the view so the diagram's bounding box is scaled to fit and centered.
  const fitToView = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const bw = bounds.width;
    const bh = bounds.height;
    if (!bw || !bh) {
      view.current = { scale: 1, x: 0, y: 0 };
      applyTransform();
      return;
    }
    const scale = clampScale(Math.min(vw / bw, vh / bh, 1) * 0.95);
    view.current = {
      scale,
      x: (vw - bw * scale) / 2 - bounds.minX * scale,
      y: (vh - bh * scale) / 2 - bounds.minY * scale,
    };
    applyTransform();
  }, [bounds, applyTransform]);

  const zoomAt = useCallback(
    (factor: number, cx: number, cy: number) => {
      const { scale, x, y } = view.current;
      const newScale = clampScale(scale * factor);
      if (newScale === scale) return;
      view.current = {
        scale: newScale,
        x: cx - (cx - x) * (newScale / scale),
        y: cy - (cy - y) * (newScale / scale),
      };
      applyTransform();
    },
    [applyTransform]
  );

  const zoomFromCenter = (factor: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    zoomAt(factor, viewport.clientWidth / 2, viewport.clientHeight / 2);
  };

  // Native non-passive wheel listener: React's onWheel is passive so it can't
  // preventDefault the page scroll.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      zoomAt(factor, e.clientX - rect.left, e.clientY - rect.top);
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  // Fit the camera once per file — right after BOTH the schema and the saved
  // layout are ready, so it fits the final merged bounds rather than a
  // transient auto-layout-only guess — and again whenever a table is ADDED
  // while the same file stays open, so a newly-added table (placed below
  // the existing content by placeUnpositionedTables) is brought into view
  // instead of landing outside the current viewport. Editing an EXISTING
  // table (same table names, just different columns/settings) must NOT
  // re-trigger this, or every keystroke would reset the user's pan/zoom.
  const firstFitDoneForFile = useRef<string | undefined>(undefined);
  const knownTableNames = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!isDbmlCapable || !schema || !layoutState.ready || !fileId) return;
    const currentNames = new Set(schema.tables.map((t) => t.name));

    if (firstFitDoneForFile.current !== fileId) {
      firstFitDoneForFile.current = fileId;
      knownTableNames.current = currentNames;
      fitToView();
      return;
    }

    const known = knownTableNames.current ?? new Set<string>();
    const hasNewTable = [...currentNames].some((name) => !known.has(name));
    knownTableNames.current = currentNames;
    if (hasNewTable) fitToView();
  }, [schema, layoutState, isDbmlCapable, fileId, fitToView]);

  // Click-drag panning via pointer capture.
  const drag = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: view.current.x,
      origY: view.current.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.style.cursor = "grabbing";
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    view.current.x = drag.current.origX + (e.clientX - drag.current.startX);
    view.current.y = drag.current.origY + (e.clientY - drag.current.startY);
    applyTransform();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    e.currentTarget.style.cursor = "grab";
  };

  // Drop target for objects dragged from the treeview: render the object's
  // basic DBML product and append it to the diagram (same pattern as
  // canvas-editor.tsx's drag-insert).
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes(MODEL_OBJECT_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const objectId = e.dataTransfer.getData(MODEL_OBJECT_MIME);
    if (!objectId || !fileId) return;
    e.preventDefault();
    void insertObjectIntoDbml(objectId, fileId);
  };

  return (
    <div
      ref={viewportRef}
      className="relative flex-1 overflow-hidden bg-background"
      style={{ cursor: "grab", userSelect: "none", WebkitUserSelect: "none" }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className="absolute top-2 left-2 z-10 flex flex-col items-start gap-2"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tables…"
              className="h-7 w-40 rounded-md border border-border bg-card pl-7 pr-2 text-[11px] text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <Button
            variant={showOnlyPkFk ? "default" : "outline"}
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={handleToggleShowOnlyPkFk}
            title="Show only primary/foreign key columns"
          >
            Keys only
          </Button>
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
            {error.line ? `Line ${error.line}: ` : ""}
            {error.message}
          </p>
        )}
      </div>

      <div ref={transformRef} style={{ transformOrigin: "0 0", position: "relative" }}>
        {schema?.groups.map((group) => {
          const groupBox = groupBounds[group.name];
          if (!groupBox) return null;
          return (
            <GroupBox
              key={group.name}
              name={group.name}
              bounds={groupBox}
              collapsed={layout.groups?.[group.name]?.collapsed ?? false}
              tableCount={group.tables.length}
              viewRef={view}
              onToggleCollapse={handleToggleGroupCollapse}
              onDragMove={handleGroupDragMove}
              onDragEnd={handleGroupDragEnd}
            />
          );
        })}
        {schema?.tables.map((table) => {
          if (hiddenTableNames.has(table.name)) return null;
          const position = effectivePositions[table.name];
          if (!position) return null;
          return (
            <TableNode
              key={table.name}
              table={table}
              position={position}
              fkColumns={fkByTable.get(table.name) ?? new Set()}
              showOnlyPkFk={showOnlyPkFk}
              matchesSearch={matchesSearch(table.name, table.tableName)}
              viewRef={view}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onHeaderColorChange={handleHeaderColorChange}
            />
          );
        })}
        {schema && (
          <EdgeLayer
            schema={schema}
            positions={effectivePositions}
            bounds={bounds}
            fkColumnsByTable={fkByTable}
            showOnlyPkFk={showOnlyPkFk}
            hiddenTableNames={hiddenTableNames}
          />
        )}
      </div>

      <div
        className="absolute bottom-4 right-4 z-10 flex flex-col gap-1"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Button
          variant="outline"
          size="icon"
          title="Zoom in"
          onClick={() => zoomFromCenter(ZOOM_STEP)}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          title="Zoom out"
          onClick={() => zoomFromCenter(1 / ZOOM_STEP)}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" title="Reset view" onClick={fitToView}>
          <Maximize className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default DbmlEditor;
