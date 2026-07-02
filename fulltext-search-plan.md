# Full-text project search — implementation plan (ripgrep-based)

Add a **Search** rail button + sidebar panel that runs a full-text search across the
open project's files and lists matching files; clicking a result opens the file.
Matching is delegated to **ripgrep** (`@vscode/ripgrep`) so it scales to tens of
thousands of files — the same engine VS Code's "search in files" uses.

## Decisions (locked)

- **Results:** flat file list, each row = relative path + match count. Click opens the
  file at the top (no jump-to-line).
- **Match options:** case-sensitive toggle, regex, whole-word, include/exclude globs.
  Default = case-insensitive substring.
- **Scope:** all project-tree files on disk (mirror Explorer's traversal). Disk only —
  no live/unsaved editor content in v1.
- **Trigger:** on Enter / Search button (no search-as-you-type).
- Match count = total occurrences per file. Order = relative-path alphabetical.
  Cap total result files (e.g. 2000) to stay responsive.

## Why ripgrep (and not a JS walk or an index)

- Word-tokenized indexes (MiniSearch/FlexSearch/Lunr/SQLite FTS5) **can't do substring /
  regex / whole-word** grep semantics — wrong tool, ruled out.
- A pure-JS `fs` walk + regex works but scales poorly (no SIMD/mmap, GC pressure, main-
  thread blocking) and reimplements what `rg` gives free.
- `rg --count-matches` output (`path:count`, one line per matching file) is a **near
  drop-in for the locked UI**, computed in Rust across all cores. Options map to flags;
  binary detection is built in.

## Key integration facts (verified)

- A `ProjectStructure` file node's **`id` is its project-relative path with `/`**
  (`project.ts:244,265`). The search must emit ids in the same form so click-to-open
  reuses the existing flow with no new "open" IPC.
- `openFileById(id)` (`editor-api.ts:181`) already **dedups**: `addEditedFile`
  (`editor-api.reducers.ts:121`) focuses the open tab if present, else adds it. "Focus
  already-open tab" needs **no extra code**.
- Sidebar panels are always mounted, toggled via `hidden` (`main-sidebar.tsx`) — query +
  results persist across panel switches automatically.
- **Native-binary packaging precedent already exists** for `@resvg/resvg-js`:
  `external` in `vite.config.ts:20`, plus `files` + `asarUnpack` globs in
  `electron-builder.json5`. Reuse this pattern verbatim for `@vscode/ripgrep`.

### ripgrep behaviors to design around
- **Exit codes:** `0` = matches found, **`1` = no matches (NOT an error)**, `2` =
  real error (e.g. invalid regex, with detail on stderr). Treat `1` as empty results —
  same spirit as the git unborn-branch `.catch()` in `git.ts`.
- **Regex flavor:** Rust `regex` crate — **no backreferences/lookaround**. Identical to
  JS for substring/word/case; only exotic regex toggles differ. Note this in the UI.
- **Path output:** relative to `cwd`, OS separators → normalize `\`→`/` and strip a
  leading `./` so ids match `ProjectStructure`.
- **Don't use `--sort path`** (it forces single-threaded, killing the speed win) — sort
  the parsed results in JS instead.
- **Spawn with an arg array, no shell**, and pass the query via `-e <query>` so a query
  starting with `-` isn't read as a flag (no quoting/injection concerns).

---

## Phase 0 — Add the dependency + packaging

- `npm install @vscode/ripgrep@1.17.1` — **pin exactly, no caret** (its postinstall
  downloads a prebuilt `rg` into the package's own `bin/` and exposes `rgPath`).
  ⚠️ **Must NOT be 1.18.0+**: those are ESM-only (`"type":"module"`) and `require()`-ing
  them from the CommonJS Electron main bundle throws `ERR_REQUIRE_ESM` at startup. 1.17.1
  is the last CJS release. A `^`/`~` range that admits 1.18.0 crashes the app on install.
- `vite.config.ts` — add `'@vscode/ripgrep'` to the main build's `external` array
  (next to `'@resvg/resvg-js'`) so it's required from `node_modules`, not bundled.
- `electron-builder.json5` —
  - `files`: add `"node_modules/@vscode/**/*"`
  - `asarUnpack`: add `"node_modules/@vscode/**"`
- **Packaging caveat:** the postinstall downloads only the **host platform's** binary.
  Multi-OS installers need per-platform build runners (CI matrix), or pre-seeding the
  other platforms' binaries. Confirm during the first multi-platform build.

---

## Phase 1 — Main-process search backend

### 1a. `electron/src/project/search.core.ts` (pure, esbuild-testable — no app/electron imports)
Matching moves into `rg`, so the core now just builds args + parses output.

```ts
export interface SearchOptions {
  caseSensitive: boolean;
  regex: boolean;
  wholeWord: boolean;
  include: string;   // comma/space-separated globs, "" = all
  exclude: string;
}
export interface SearchResult { id: string; matchCount: number; } // id = project-relative path

// Split a user glob field into trimmed, non-empty patterns.
export function splitGlobList(input: string): string[];

// Assemble the ripgrep argument array (pure → assert exact array in tests).
//   --count-matches            (per-file occurrence counts)
//   --no-ignore --hidden       (mirror Explorer = raw fs, not .gitignore-filtered)
//   -g "!.git/**"              (always exclude the git dir)
//   -i        unless caseSensitive
//   -F        unless regex      (fixed-string = literal substring)
//   -w        if wholeWord
//   -g <glob> per include; -g "!"+<glob> per exclude
//   -e <query>                 (pattern, last)
//   .                          (search cwd)
export function buildRgArgs(query: string, opts: SearchOptions): string[];

// Parse `path:count` lines → results. Split on the LAST ':'; normalize '\'→'/';
// strip a leading './'. Ignore blank/malformed lines.
export function parseCountMatchesOutput(stdout: string): SearchResult[];
```

> Note: `-w` (word boundaries) and `-i` (case) compose with both `-F` and regex, so the
> core no longer hand-rolls `\b…\b` or JS `RegExp` flags — `rg` owns all matching.

### 1b. `electron/src/project/search.ts` (spawn wrapper)
```ts
export interface SearchProjectProps { folderPath: string; query: string; options: SearchOptions; }
export async function searchProject(props: SearchProjectProps): Promise<SearchResult[]>;
```
- Empty/whitespace query → `return []` without spawning.
- Resolve binary: `import { rgPath } from "@vscode/ripgrep"`, then in production rewrite
  `app.asar` → `app.asar.unpacked` (because of `asarUnpack`).
- `spawn(rgBinPath, buildRgArgs(query, options), { cwd: folderPath })`; collect stdout
  (line-buffered) + stderr.
- On close:
  - code `0` → `parseCountMatchesOutput(stdout)`, sort by `id`, slice to cap (≈2000) → resolve.
  - code `1` → resolve `[]` (no matches).
  - else → `reject(new Error(stderr || "ripgrep failed"))` (renderer surfaces it, incl. invalid regex).

### 1c. Wire IPC
- `electron/src/project/index.ts` — export `SearchProjectProps`/`SearchResult`/`SearchOptions`,
  import `searchProject`, register: `ipcMain.handle("search-project", (_, p: SearchProjectProps) => searchProject(p));`
- `electron/src/context-bridges/index.ts` — add to `window.project`:
  `searchProject: (props: SearchProjectProps) => ipcRenderer.invoke("search-project", props)`
  (import the prop type alongside the others).
- `src/index.d.ts` — add `searchProject: (props: SearchProjectProps) => Promise<SearchResult[]>;`
  (import the types; mirror `getGitInfo` at line 43).

### Verify Phase 1 (no GUI)
`esbuild search.core.ts --format=esm --outfile=/tmp/s.mjs` + throwaway Node script asserting:
- `buildRgArgs` produces the right flags for each option combo (default; case-sensitive;
  regex; whole-word; regex+whole-word; include `*.yaml`; exclude lists).
- `parseCountMatchesOutput` handles `path:count`, `./`-prefixed paths, backslash paths,
  and paths/counts robustly (split on last `:`), drops blanks.
- `splitGlobList` on comma/space/empty input.
Optionally, with `rg` on PATH, smoke-test `searchProject` against a temp dir (matches,
no-matches→[], invalid regex→throws).

---

## Phase 2 — Renderer state (`src/API/search-api/`)
Follow the `git-api/` triplet convention.

### 2a. `search.slice.ts` — `searchAPI`
State: `{ query: string; options: SearchOptions; results: SearchResult[]; loading: boolean; error: string | null; hasSearched: boolean }`.
Reducers: `setQuery`, `setOptions` (partial merge), `setResults` (also sets `hasSearched`),
`setLoading`, `setError`, `clearSearch` (reset to initial).
(`hasSearched` lets the panel distinguish "no results" from "not run yet".)

### 2b. `search-api.ts` (imperative)
- `runSearch()` — read `query`/`options`/`folderPath`; empty query → `clearSearch`; set
  loading; `await window.project.searchProject(...)`; **re-check `folderPath` after the
  await and drop stale responses** (copy the guard from `git-api.ts`); dispatch results;
  catch → `setError` + `addErrorMessage` (e.g. surfaces invalid-regex stderr).
- `openSearchResult(id)` → `openFileById(id)`.
- `clearSearch()` → dispatch `clearSearch`.

### 2c. `search-api.selectors.ts`
`selectSearchQuery`, `selectSearchOptions`, `selectSearchResults`,
`selectSearchLoading`, `selectSearchError`, `selectSearchHasSearched`.

### 2d. Register + clear
- `src/app/store.ts` — `searchAPI: searchAPISlice.reducer`.
- `src/API/project-api/project-api.ts:107` `closeProject()` — call `clearSearch()`
  next to `clearGitInfo()`.

---

## Phase 3 — UI

### 3a. Rail button — `src/features/RailMenu/rail-menu.tsx`
Add to `menuItems` (group 1): `{ name: "Search", icon: <Search className={iconCls} strokeWidth={1.8} />, menuGroup: 1 }`
(import `Search` from `lucide-react`). Active toggle is already generic.

### 3b. Panel registration — `src/features/MainSidebar/main-sidebar.tsx`
Add `Search: <MainSidebarSearch />` to the `menus` map; import the component.

### 3c. `src/features/MainSidebar/main-sidebar-search.tsx` (new)
Structure from `main-sidebar-repo.tsx` (header + scroll body), but **no fetch-on-mount**.
- **Search bar:** query `<input>` (Enter → `runSearch()`) + Search button; three toggle
  buttons bound to `setOptions` — `Aa` (caseSensitive), `.*` (regex), whole-word;
  collapsible include/exclude `<input>`s. Small hint that regex is Rust-flavored
  (no lookaround/backrefs).
- **Body:** `error` → inline message; `loading` → "Searching…"; `hasSearched &&
  results.length === 0` → "No results"; else map rows: relative path (id, basename
  emphasized) + match-count badge, `onClick={() => openSearchResult(r.id)}`.
  Consider `react-window` only if match counts can get large.

### Verify Phase 3 (GUI)
`npm run dev`; confirm with user: rail toggles panel; content search works; toggles
change results; invalid regex shows the rg error; click opens file (focuses tab if
already open); switching panels preserves results; closing project clears them.

---

## Touch-point checklist
### Phase 0 + 1 — DONE (verified: 13 core unit tests, full `tsc --noEmit`, ESLint clean, end-to-end wrapper test against real `rg`)
- [x] `npm install @vscode/ripgrep@1.17.1` — **pinned exactly** (no caret) in `dependencies`. ⚠️ 1.18.0+ is **ESM-only** (`"type":"module"`) and `require()`-ing it from the CommonJS Electron main bundle throws `ERR_REQUIRE_ESM` at startup. 1.17.1 is the last CJS release; its postinstall downloads the `rg` binary into the package's own `bin/` (no per-platform packages). A `^`/`~` range that allows 1.18.0 will crash the app on next install — keep the exact pin.
- [x] `vite.config.ts` (`external`)
- [x] `electron-builder.json5` (`files` + `asarUnpack`, `node_modules/@vscode/**`)
- [x] `electron/src/project/search.core.ts` (new, pure: `buildRgArgs`/`parseCountMatchesOutput`/`splitGlobList`)
- [x] `electron/src/project/search.ts` (new, spawn wrapper; exit 1 = empty, 2 = reject)
- [x] `electron/src/project/index.ts` (export types + `ipcMain.handle("search-project", …)`)
- [x] `electron/src/context-bridges/index.ts` (expose `searchProject`)
- [x] `src/index.d.ts` (type `searchProject` on `window.project`)

### Phase 2 + 3 — DONE & GUI-CONFIRMED (verified: `tsc --noEmit` exit 0, `npm run lint` zero warnings, full `vite build`; external require + IPC channel + preload bridge confirmed in the bundles; **Search panel confirmed working in `npm run dev`**).
- [x] `src/API/search-api/search.slice.ts` (`searchAPI`: query/options/results/loading/error/hasSearched; `clearSearchResults` vs full `clearSearch`)
- [x] `src/API/search-api/search-api.ts` (`runSearch` with stale-project guard, `setQuery`/`setOptions`/`openSearchResult`/`clearSearch`)
- [x] `src/API/search-api/search-api.selectors.ts`
- [x] `src/app/store.ts` (register `searchAPI`)
- [x] `src/API/project-api/project-api.ts` (`clearSearch()` in `closeProject`)
- [x] `src/features/RailMenu/rail-menu.tsx` (Search rail item, after Explorer)
- [x] `src/features/MainSidebar/main-sidebar.tsx` (panel registration)
- [x] `src/features/MainSidebar/main-sidebar-search.tsx` (new panel: query+Enter/button, case/word/regex toggles, collapsible include/exclude, file-list results)
- [x] `npm run lint` (zero-warnings policy)

## Out of scope (v1) / future
Jump-to-line + per-line previews (rg `--json` already exposes line/column, so this is a
backend-output upgrade, not a rearchitecture); search-as-you-type with cancellation
(kill the previous `rg` child on a new query); streaming/incremental result rendering;
unsaved-buffer content; replace-in-files.
