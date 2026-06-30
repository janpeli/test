# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite + Electron hot reload)
npm run build      # tsc + Vite build + electron-builder (produces distributable)
npm run lint       # ESLint (zero warnings policy)
npm run preview    # Vite preview of the renderer only
```

There is no test runner in the repo. For non-trivial pure logic, extract a dependency-free `*.core.ts` module (no `@/…` app/store/Electron imports) so it can be verified in isolation without launching the GUI — transpile with the bundled esbuild (`./node_modules/.bin/esbuild file.core.ts --format=esm --outfile=/tmp/x.mjs`) and exercise it from a throwaway Node script. `src/lib/products/resolve-references.core.ts` (pure walk) vs `resolve-references.ts` (store-bound wrapper) is the reference split.

Verifying GUI behaviour means running the Electron app (`npm run dev`); there is no headless harness, so confirm UI/interaction changes with the user rather than asserting them done from code alone.

The `@` path alias resolves to `./src`.

## Architecture Overview

This is an **Electron + React + TypeScript** desktop application — a modeling tool for creating and editing YAML-based data models. Vite handles bundling for both processes.

### Two Processes

**Main process** (`electron/`): Node.js, handles filesystem and IPC.
- `electron/main.ts` — creates the BrowserWindow, installs devtools extensions, calls `setupIPCMain()`
- `electron/preload.ts` — sets up context bridges, exposes `window.project.*` to the renderer
- `electron/src/project/` — all IPC handlers (open folder dialog, read/write files, manage project structure)
- `electron/src/project/plugin-definitions.ts` — scans `data/plugins/` directory, copies/removes plugins per project

**Renderer process** (`src/`): React SPA.

### Plugin System

See `data/plugins/PLUGIN_GUIDE.md` for the full plugin authoring reference.

Plugins live in `data/plugins/<plugin-dir>/` and each has:
- `config.yaml` — declares `name`, `uuid`, `target_db`, `parser`, and `base_objects` (each with a `name`, `sufix`, `archetype`, and `definition` pointing to a JSON Schema file)
- The JSON Schema defines the form structure rendered in the editor

When a project is opened, its `plugins/` subdirectory is scanned. Plugin schemas are loaded and drive dynamic form generation via `src/lib/JSONSchemaToZod/` (JSON Schema → Zod → react-hook-form).

### State Management (`src/API/`)

Redux Toolkit slices, grouped by domain:

| Slice | Purpose |
|-------|---------|
| `editorAPI` | Open files, tabs, active editor, editor modes (SOURCE/FORM/MARKDOWN/CANVAS) |
| `editorForms` | Form data keyed by file ID — source of truth when saving in FORM mode |
| `formSync` | Per-file counter bumped on **external** writes to `editorForms` (sync, undo/redo); folded into each form's React `key` to remount it |
| `editorHistory` | Per-file FORM undo/redo stacks (`past`/`future` whole-form snapshots) |
| `projectAPI` | Current project path, `ProjectStructure` tree, loaded plugins |
| `mainSidebar` | Sidebar collapsed/expanded state |
| `modalAPI` | Which modal is open and its context ID |
| `activeContext` | Currently selected node in the project tree |
| `statusPanel` | Status panel visibility and content |
| `themeAPI` | UI theme |
| `gitAPI` | Read-only git state of the open project (branch, ahead/behind, working-tree status, commits, remotes) for the Repo panel |

Each domain also has an imperative API module (e.g. `editor-api.ts`, `project-api.ts`) that dispatches to the store directly — these are called from UI event handlers rather than dispatching actions manually.

### Live SOURCE↔FORM Sync & Undo/Redo (`editor-api.ts`)

Monaco `content` and parsed `editorForms[id]` are kept in step while editing — both panes stay live before save. All logic lives in `editor-api.ts`.

- **SOURCE→FORM** (`scheduleFormSyncFromContent`): Monaco's change handler debounces (250ms) then `applyContentToForm` re-parses YAML into `editorForms`. Invalid YAML mid-typing is ignored (returns false) until it parses again.
- **FORM→SOURCE** (`syncSourceFromForm`): form commits (`updateEditorFormData*`) re-serialize the form into `content`. Re-serializing **drops YAML comments/formatting** (same loss as on save).
- **Loop-safety:** SOURCE→FORM uses raw `updateFormData`; FORM→SOURCE dispatches `setFileContent` **without `fromSource`**, applied by Monaco via bracketed `pushEditOperations` (not `setValue()`, which would wipe its native undo stack) with `isApplyingExternalRef` set so the change event is suppressed.
- **`contentDirty`** (on `EditedFile`): set only by genuine Monaco edits (`setFileContent` `fromSource: true`), cleared by `markFormEdited`/`markFileSaved`. `saveEditedFile` reads it to persist whichever pane holds the latest edit, reconciling SOURCE content back into the form.
- **Undo/redo** (`undoForm`/`redoForm`, `editorHistory` slice): **FORM only** — Monaco owns SOURCE text undo natively. Bound to `mod+z`/`mod+shift+z` with `skipMonaco: true` in `registry.ts` so the shortcut doesn't fire while Monaco is focused. Snapshots are recorded on form commit; each field blur is one undo boundary.
- **Why forms remount:** react-hook-form reads `defaultValues` only at mount and some fields (TagField/ComboboxField) snapshot their value at mount, so `form.reset()` can't refresh them. External writes bump `formSync[id]`, folded into the form's React `key` (`EditorFormPanels`) to remount it. Never bump `formSync` on in-form edits (would remount mid-typing). Half-typed YAML can briefly reach fields, so guard against null/non-string values (see `tag-input.tsx`, `editor-form-error-boundary.tsx` `resetKey`).

### Theme System

Theme values: `"dark" | "light" | "system"`. Stored in `localStorage` (`vite-ui-theme`) and in the `themeAPI` Redux slice (`src/API/GUI-api/theme.slice.ts`).

**Pattern for third-party libraries that need live theme updates:** watch the `<html>` class via `MutationObserver` rather than the Redux selector — imperative libraries like Mermaid and Monaco can't subscribe to the store, so DOM observation is more direct.

```tsx
const [isDark, setIsDark] = useState(
  document.documentElement.classList.contains("dark")
);
useEffect(() => {
  const observer = new MutationObserver(() =>
    setIsDark(document.documentElement.classList.contains("dark"))
  );
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}, []);
```

This pattern is already used in `canvas-editor.tsx` (Mermaid themes `"dark"`/`"default"`) and `monaco-editor.tsx` (`monaco.editor.setTheme("vs-dark"/"vs")`).

### Editor Modes

`ContentEditor` renders all panes simultaneously, toggling visibility via `aria-hidden` and inline `width: 0`. When two or more views are active the panes split horizontally with a draggable resize bar.

- **SOURCE** — Monaco editor, raw file content
- **FORM** — Dynamic form generated from plugin JSON Schema. `RenderFormField` recurses through schema properties, routing to typed field components.
- **MARKDOWN** — `markdown-it` HTML preview; read-only
- **CANVAS** — Mermaid diagram preview (`mermaid` v11); live-renders the file content as a diagram. A `*.can.md` file holds **raw Mermaid source, not fenced markdown** — `canvas-editor.tsx` passes `content.trim()` straight to `mermaid.render()`. Anything that writes canvas content (e.g. a basic product's `*.can.njk` template, or drag-to-insert) must emit bare Mermaid compatible with the rest of the file (e.g. an `erDiagram` entity block), not a ```` ```mermaid ```` block.
- **PRODUCT** — Read-only Monaco view of a *product*: a Nunjucks template (declared on the object type in `config.yaml`) rendered against the object's data. See "Products" below.

`EditorModeType`: `"SOURCE" | "FORM" | "MARKDOWN" | "PRODUCT" | "CANVAS"`

`createEditedFile()` in `editor-api.ts` assigns modes by file type:
- `*.can.md` — detected by `name.endsWith(".can")` → `["SOURCE", "CANVAS"]`
- `*.md` / `*.markdown` → `["SOURCE", "MARKDOWN"]`
- everything else → `["SOURCE", "FORM"]`, plus `"PRODUCT"` when the object type declares products

### Products

A **product** is a Nunjucks template bound to an object type; rendering it against an object's data produces a text artifact (e.g. Oracle table DDL). Authoring lives entirely in plugin files — see `data/plugins/PLUGIN_GUIDE.md` §1a. Object types declare `products[]` under their `base_object` in `config.yaml`; `loadPlugin()` (`electron/src/project/plugins.ts`) inlines each product's template source the same way it inlines `definition`/`template`.

Rendering runs in the **main process**, not the renderer: Nunjucks compiles templates with `eval`/`new Function`, which the renderer CSP (`script-src 'self'` in `index.html`) forbids. `electron/src/project/products.ts` holds the configured Nunjucks `Environment` (`autoescape: false`, `throwOnUndefined: false`, `trimBlocks`/`lstripBlocks` on) and `renderProduct()`, exposed over IPC as `window.project.renderProduct({ template, context })` (channel `render-product`).

Renderer flow:
- Selectors (`editor-api.selectors.ts`): `selectOpenFileProducts` (resolves products via the file's `plugin_uuid` + `sufix`), `selectOpenFileActiveProduct` (defaults to the first product), and `selectOpenFileData` (the template context: **live `editorForms[fileId]` first**, falling back to `yaml.parse(content)` — so the view updates as the form is edited, before save).
- `product-editor.tsx` — read-only Monaco pane + copy button, rendered as a normal split pane in `content-editor.tsx`. It calls `resolveProductContext()` then `window.project.renderProduct` (debounced, race-guarded) whenever the template or data changes.
- The menubar (`content-editor-menubar.tsx`) renders PRODUCT as a **dropdown** (one mode, N products) rather than a toggle; selecting a product opens the pane / switches product / re-selecting the visible one hides it. The active product is stored per file as `EditedFile.activeProductName`.

**Reference resolution (`src/lib/products/resolve-references.ts` + pure `resolve-references.core.ts`):** `selectOpenFileData` returns the object's *own* data; `resolveProductContext()` then walks it (in the renderer) and resolves cross-file refs **one level deep** before rendering. The pure walk (`resolveReferences(data, load, opts)`) lives in `resolve-references.core.ts` with no app imports so it is unit-testable; the `.ts` wrapper supplies the store-bound `loadObjectData` loader and the dev warning — a `{ $reference: id }` node becomes the referenced object's data (so templates read `c.referenced_table.general.name`), a `{ $sub_reference: [..] }` node becomes its array. Reuses `getFileContentById` (prefers live `editorForms[id]`), guards cycles/missing files, and `console.warn`s on an unresolved ref in dev. Main's `renderProduct` stays a dumb template renderer.

**Canvas drag-to-insert (`src/lib/products/canvas-insert.ts`):** the treeview drag (`node-controller.ts` `handleDragStart`) sets a separate `application/x-model-object` payload (single node id) alongside the internal-reorder `custom/treeDraggNodes` key, so move behaviour is untouched. `canvas-editor.tsx` adds `onDragOver`/`onDrop`; on drop, `insertObjectIntoCanvas()` finds the object's **basic** product (`products[].basic === true`), resolves its context, renders it, and **appends** the Mermaid text via `setFileContent` (seeding the owning plugin's `default_canvas_type`, falling back to `erDiagram`, as the header on an empty canvas). Object types with no basic product are a graceful no-op.

**Default canvas type:** a plugin may declare a top-level `default_canvas_type` in `config.yaml` (a Mermaid diagram keyword, e.g. `erDiagram`). When a canvas (`*.can.md`) is created in a model belonging to that plugin, `createCanvasFileInParent()` (`project-api.ts`) seeds the file's first line with that keyword instead of the generic `CANVAS_INITIAL_CONTENT` flowchart placeholder. The field is optional on the `Plugin` interface (`electron/src/project/index.ts`) and is picked up automatically by `loadPlugin()`'s `yaml.parse` (no inlining needed since it is a scalar).

### Diagram Export (canvas)

The canvas menubar's export button (shown only when the CANVAS view is active) opens `modal-export-canvas.tsx` (PNG/SVG, transparent/white background, 1–4× scale, live preview).

- **One Mermaid config** for canvas, preview, and export: `src/lib/canvas/mermaid-init.ts` `initMermaid(isDark)` sets `htmlLabels:false` so labels render as native SVG `<text>`, not `<foreignObject>` — required because the rasteriser ignores `<foreignObject>`. This makes the export pixel-identical to the on-screen canvas.
- **Pure SVG helpers** live in `src/lib/canvas/export-image.core.ts` (no app/mermaid imports, esbuild-testable): `getDiagramSize`, `pinSvgSize`, `injectBackground`, `prepareSvgString`, `stripCanvasExtension`. `export-image.ts` adds the mermaid-bound `renderDiagramSvg` and re-exports the core.
- **Rasterisation runs in the main process** with `@resvg/resvg-js` (`exportImageFile` / `rasterizeSvgToPng` in `electron/src/project/project.ts`, IPC `export-image` → `window.project.exportImage`). resvg is headless (no BrowserWindow/canvas), so there's no screen-size clamp, paint-timing race, or transparency loss. PNG: `fitTo:{mode:"zoom",value:scale}` + `background`; SVG: written verbatim (renderer bakes size/background via `prepareSvgString`). Errors/success route to the status panel.
- `@resvg/resvg-js` ships a native `.node` binary: kept `external` in the main Vite build and packaged via `files`/`asarUnpack` in `electron-builder.json5`.

### Git Info (Repo panel)

Read-only git status for the open project, shown in the **Repo** sidebar panel (`src/features/MainSidebar/main-sidebar-repo.tsx`) and as the branch line of the project open/close button (`src/features/ProjectPicker/project-picker.tsx`).

- **Main process** (`electron/src/project/git.ts`): `getGitInfo(folderPath)` reads the repo via `simple-git` and returns a serializable `GitInfo` (plus `GitCommit`/`GitRemote`) — these shapes are deliberately **decoupled from simple-git's own types so the renderer never imports simple-git**. Exposed over IPC as `window.project.getGitInfo(folderPath)` (channel `get-git-info`). It is a **dumb reader; it never mutates the repository**. `simple-git` is pure JS, so unlike `@resvg/resvg-js` it stays **bundled** (not `external`) in the main Vite build.
- **`isRepo` / error semantics:** `isRepo: false` (with empty defaults) is returned **only** for a genuine non-repo folder — that is an expected state the renderer presents itself. A real git failure (git unavailable, locked index, permissions, corruption) is **re-thrown** so the renderer can surface it; do **not** collapse it into `isRepo: false`. `git.log()` is `.catch()`'d separately because it exits non-zero on an **unborn branch** (a fresh repo with no commits) — treat that as zero commits, not an error, otherwise a real repo gets mislabeled "not a repository".
- **State (`src/API/git-api/`):** the `gitAPI` slice holds `{ info, loading, error }`. Imperative API `git-api.ts`: `refreshGitInfo()` reads `projectAPI.folderPath`, fetches, and dispatches — and **re-checks `folderPath` after the `await`, dropping stale responses** so a slow fetch for a previous project can't overwrite the current one. `clearGitInfo()` runs on project close. Selectors in `git-api.selectors.ts` (`selectGitInfo`/`selectGitLoading`/`selectGitError`).
- **Single fetch owner:** every sidebar panel is **always mounted** (toggled via CSS `hidden`, never unmounted — see `main-sidebar.tsx`), so the Repo panel's `useEffect([projectFolder])` is the **one** place that calls `refreshGitInfo()` on project open/change. Other consumers (e.g. ProjectPicker) are **pure readers of the slice — do not add their own fetch**, or you reintroduce duplicate IPC round-trips. `openProject` deliberately does *not* fetch git info for the same reason.

### File Lifecycle

1. User clicks a file in the sidebar tree → `openFileById()` in `editor-api.ts`
2. Renderer calls `window.project.getFileContent()` (IPC over context bridge)
3. File content added to `editorAPI.editors[n].editedFiles` as an `EditedFile`
4. When saving in FORM mode: `saveEditedFile()` serializes `editorForms[fileId]` back to YAML via the `yaml` library and writes via IPC

### IPC Pattern

Main process registers handlers in `setupIPCMain()` using `ipcMain.handle(channel, handler)` — handlers return a value or Promise directly. The context bridge (`electron/src/context-bridges/`) wraps these as `window.project.*` calls on the renderer side.

### UI Components

`src/components/ui/` contains shadcn-style components (Radix UI primitives + Tailwind). Custom additions:
- `treeview/` — file explorer tree with keyboard navigation and context menus
- `tag-input/` — multi-value tag input
- `reference-input.tsx` — cross-file reference picker
- `section.tsx` — collapsible section wrapper used in forms

### Treeview Architecture

The treeview deliberately breaks standard React patterns for fine-grained per-node render control. Understanding this is required to edit it correctly.

**Component hierarchy:**
```
Treeview.tsx (React.memo)
└── Tree.tsx → useTree() hook
    └── TreeContainer.tsx
        └── TreeRow.tsx[] (memoized per node)
            └── TreeNode.tsx → NodeContextMenu
```

**Key files:**
- `src/components/ui/treeview/tree/controllers/tree-controller.ts` — central state: selected, expanded, focused, dragged, visible nodes
- `src/components/ui/treeview/tree/controllers/node-controller.ts` — per-node state and event handlers
- `src/components/ui/treeview/tree/hooks.ts` — `useTree()` and `useNode()` hooks
- `src/components/ui/treeview/tree/tree-row.tsx` — memoized row, scroll-into-view logic
- `src/API/GUI-api/main-sidebar-api.ts` — global tree reference + `update_MAIN_SIDEBAR_EXPLORER_TREE()`

**The controller pattern — how state and rendering work:**

All tree state lives in `TreeController` and `NodeController` class instances, not in React state. React is only used as a render trigger via a dummy counter:

```typescript
// hooks.ts — controller is created ONCE; empty deps are intentional
const tree = useMemo(() => new TreeController(data, renders, setRenders), []);

// tree-controller.ts — forces a React re-render by incrementing the counter
private render() { this.setRenders(++this.renders); }
```

Each `NodeController` holds its own `setRenders` so it can re-render only its own `TreeRow` without touching siblings.

**Rule:** Never add `useState` or `useReducer` inside treeview components for tree-level state. Add state to `TreeController` or `NodeController` and call `this.render()` or `node.render()` to propagate it.

**How external code updates the tree:**

The controller is stored in a module-level global in `main-sidebar-api.ts`:
```typescript
export const MAIN_SIDEBAR_EXPLORER_TREE: { tree?: TreeController } = {};
```
`update_MAIN_SIDEBAR_EXPLORER_TREE()` reads `projectAPI.projectStructure` from the Redux store and calls `tree.updateTreeData()` directly — React props are not involved. This is called from `project-api.ts` after any file/folder create or delete IPC call.

**Rule:** To push a structural update into the tree from outside React, call `update_MAIN_SIDEBAR_EXPLORER_TREE()` (or add a similar method to `TreeController` and call it through the global reference). Do not try to pass new props down.

**Adding new context menu items:**

Context menu commands are supplied as the `nodeContextCommands` prop (a function `(node: NodeController) => Commands`). The prop is stored on the controller instance (`tree.nodeContextCommands`) and called at render time in `NodeContextMenu`. Add new items inside the callback at the usage site — `main-sidebar-explorer.tsx` for the project tree.

**Usage sites:**
- `src/components/main-sidebar/main-sidebar-explorer.tsx` — project file tree; double-click opens files, selection dispatches `activeContext`
- `src/components/main-sidebar/main-sidebar-plugins.tsx` — plugins tree (folders read-only)
- `src/components/ui/reference-input.tsx` — file picker dialog inside forms
