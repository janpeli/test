# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite + Electron hot reload)
npm run build      # tsc + Vite build + electron-builder (produces distributable)
npm run lint       # ESLint (zero warnings policy)
npm run preview    # Vite preview of the renderer only
```

There are no tests. The `@` path alias resolves to `./src`.

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
| `projectAPI` | Current project path, `ProjectStructure` tree, loaded plugins |
| `mainSidebar` | Sidebar collapsed/expanded state |
| `modalAPI` | Which modal is open and its context ID |
| `activeContext` | Currently selected node in the project tree |
| `statusPanel` | Status panel visibility and content |
| `themeAPI` | UI theme |

Each domain also has an imperative API module (e.g. `editor-api.ts`, `project-api.ts`) that dispatches to the store directly — these are called from UI event handlers rather than dispatching actions manually.

### Theme System

Theme values: `"dark" | "light" | "system"`. Stored in `localStorage` (`vite-ui-theme`) and in the `themeAPI` Redux slice (`src/API/GUI-api/theme.slice.ts`).

**Known issue:** `src/API/GUI-api/theme-api.ts` `setTheme()` calls the action creator but never dispatches it to the Redux store — so `selectTheme` stays at the initial (localStorage) value for the lifetime of the app. The CSS class on `<html>` (`"dark"` or `"light"`) is always correct because `AddThemeClassToRoot()` updates it directly.

**Pattern for third-party libraries that need live theme updates:** watch the `<html>` class via `MutationObserver` instead of reading the Redux selector.

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
- **CANVAS** — Mermaid diagram preview (`mermaid` v11); live-renders the file content as a diagram
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

**Canvas drag-to-insert (`src/lib/products/canvas-insert.ts`):** the treeview drag (`node-controller.ts` `handleDragStart`) sets a separate `application/x-model-object` payload (single node id) alongside the internal-reorder `custom/treeDraggNodes` key, so move behaviour is untouched. `canvas-editor.tsx` adds `onDragOver`/`onDrop`; on drop, `insertObjectIntoCanvas()` finds the object's **basic** product (`products[].basic === true`), resolves its context, renders it, and **appends** the Mermaid text via `setFileContent` (seeding an `erDiagram` header on an empty canvas). Object types with no basic product are a graceful no-op.

### File Lifecycle

1. User clicks a file in the sidebar tree → `openFileById()` in `editor-api.ts`
2. Renderer calls `window.project.getFileContent()` (IPC over context bridge)
3. File content added to `editorAPI.editors[n].editedFiles` as an `EditedFile`
4. When saving in FORM mode: `saveEditedFile()` serializes `editorForms[fileId]` back to YAML via the `yaml` library and writes via IPC

### IPC Pattern

Main process registers handlers in `setupIPCMain()` using `ipcMain.on(channel, ...)` / `event.reply(replyChannel, result)`. The context bridge (`electron/src/context-bridges/`) wraps these as promise-based `window.project.*` calls on the renderer side.

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
