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
| `editorAPI` | Open files, tabs, active editor, editor mode (YAML/FORM/MARKDOWN) |
| `editorForms` | Form data keyed by file ID — source of truth when saving in FORM mode |
| `projectAPI` | Current project path, `ProjectStructure` tree, loaded plugins |
| `mainSidebar` | Sidebar collapsed/expanded state |
| `modalAPI` | Which modal is open and its context ID |
| `activeContext` | Currently selected node in the project tree |
| `statusPanel` | Status panel visibility and content |
| `themeAPI` | UI theme |

Each domain also has an imperative API module (e.g. `editor-api.ts`, `project-api.ts`) that dispatches to the store directly — these are called from UI event handlers rather than dispatching actions manually.

### Editor Modes

`ContentEditor` renders three editors simultaneously, toggling visibility via `aria-hidden` (YAML/FORM) or CSS `hidden` class (MARKDOWN):
- **YAML** — Monaco editor, raw YAML source
- **FORM** — Dynamic form generated from plugin JSON Schema. `RenderFormField` recurses through schema properties, routing to typed field components.
- **MARKDOWN** — MDXEditor (`@mdxeditor/editor`)

`EditorMode` type: `"YAML" | "FORM" | "MARKDOWN"`. Files with `.md`/`.markdown` suffix default to MARKDOWN mode.

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
