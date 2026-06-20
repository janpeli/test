# Modeling App — Component Style Guide (shadcn/ui)

Everything needed to reproduce the mockup (`Modeling App - Form.dc.html` /
`Modeling App - Form Light.dc.html`) in a **shadcn/ui + Tailwind + Radix** codebase, in **both
light and dark**. It maps the mockup's design tokens onto shadcn's CSS-variable system, then
specs each region as concrete shadcn components with the exact overrides.

The shell is the familiar VS Code layout: **title bar → [activity rail · resizable Explorer ·
editor] → status bar**. The Explorer sidebar is **resizable** (drag handle between sidebar and
editor) — see §9.

---

## 0. Setup assumptions

- shadcn/ui installed, Tailwind configured, `cn()` helper available.
- The mockup palette is authored in `oklch`. **Latest shadcn** (`globals.css` is oklch-based,
  Tailwind v4) — drop the §1 block in as-is. **Older shadcn** (Tailwind v3, HSL triplets) —
  use the §1b HSL block instead; the values are equivalent.
- Dark mode via the `.dark` class on `<html>` (shadcn default; `next-themes` or a manual toggle).
- Components used: `resizable`, `scroll-area`, `input`, `button`, `toggle-group`, `tabs`,
  `select`, `badge`, `checkbox`, `breadcrumb`, `separator`, `tooltip`, `collapsible`, `table`,
  `sidebar` (optional). Install any you're missing: `npx shadcn@latest add resizable scroll-area
  toggle-group badge breadcrumb collapsible tooltip`.

---

## 1. Tokens — `globals.css` (oklch, latest shadcn)

These are the mockup's exact colors mapped to shadcn semantic names, plus a few custom vars the
app needs (editor surface, type colors, tree). `:root` = light, `.dark` = dark.

```css
:root {
  --radius: 0.375rem;               /* 6px — inputs, buttons, cards */

  /* shadcn semantic — LIGHT */
  --background: oklch(0.98 0 0);    /* app / title bar / rail */
  --foreground: oklch(0.27 0 0);
  --card: oklch(0.955 0 0);         /* panels: sidebar, tabs, toolbar, status bar */
  --card-foreground: oklch(0.27 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.27 0 0);
  --primary: oklch(0.52 0.19 250);  /* accent (selection, active, PK, branch) */
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.955 0 0);
  --secondary-foreground: oklch(0.27 0 0);
  --muted: oklch(0.955 0 0);
  --muted-foreground: oklch(0.46 0 0);
  --accent: oklch(0.93 0.045 250);  /* hover / selected-row tint */
  --accent-foreground: oklch(0.27 0 0);
  --destructive: oklch(0.58 0.20 25);
  --destructive-foreground: oklch(0.99 0 0);
  --border: oklch(0.87 0 0);
  --input: oklch(0.87 0 0);
  --ring: oklch(0.52 0.19 250);

  /* sidebar (shadcn Sidebar component tokens) */
  --sidebar: oklch(0.955 0 0);
  --sidebar-foreground: oklch(0.46 0 0);
  --sidebar-primary: oklch(0.52 0.19 250);
  --sidebar-primary-foreground: oklch(0.99 0 0);
  --sidebar-accent: oklch(0.93 0.045 250);
  --sidebar-accent-foreground: oklch(0.27 0 0);
  --sidebar-border: oklch(0.87 0 0);
  --sidebar-ring: oklch(0.52 0.19 250);

  /* custom (not part of shadcn) */
  --editor: oklch(1 0 0);           /* code / form canvas, inputs */
  --row-nested: oklch(0.965 0 0);   /* nested column rows */
  --border-subtle: oklch(0.91 0 0); /* row separators */
  --text-2: oklch(0.34 0 0);        /* nested names, chip text */
  --desc: oklch(0.50 0 0);          /* descriptions */
  --faint: oklch(0.55 0 0);         /* section labels, breadcrumb */
  --icon-faint: oklch(0.62 0 0);
  --grip: oklch(0.68 0 0);          /* drag handles */
  --accent-border: oklch(0.74 0.09 250); /* dashed "add" affordances */
  --type-struct: oklch(0.50 0.19 300);   /* STRUCT / ARRAY container types */
  --type-sql: oklch(0.48 0.11 195);       /* .sql accents */
}

.dark {
  /* shadcn semantic — DARK (shipped Theme A) */
  --background: oklch(0.205 0 0);
  --foreground: oklch(0.90 0 0);
  --card: oklch(0.185 0 0);
  --card-foreground: oklch(0.90 0 0);
  --popover: oklch(0.185 0 0);
  --popover-foreground: oklch(0.90 0 0);
  --primary: oklch(0.62 0.15 250);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.185 0 0);
  --secondary-foreground: oklch(0.90 0 0);
  --muted: oklch(0.185 0 0);
  --muted-foreground: oklch(0.66 0 0);
  --accent: oklch(0.30 0.04 250);
  --accent-foreground: oklch(0.90 0 0);
  --destructive: oklch(0.62 0.20 25);
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.30 0 0);
  --input: oklch(0.30 0 0);
  --ring: oklch(0.62 0.15 250);

  --sidebar: oklch(0.185 0 0);
  --sidebar-foreground: oklch(0.66 0 0);
  --sidebar-primary: oklch(0.62 0.15 250);
  --sidebar-primary-foreground: oklch(0.98 0 0);
  --sidebar-accent: oklch(0.30 0.04 250);
  --sidebar-accent-foreground: oklch(0.90 0 0);
  --sidebar-border: oklch(0.30 0 0);
  --sidebar-ring: oklch(0.62 0.15 250);

  --editor: oklch(0.165 0 0);
  --row-nested: oklch(0.18 0 0);
  --border-subtle: oklch(0.255 0 0);
  --text-2: oklch(0.82 0 0);
  --desc: oklch(0.60 0 0);
  --faint: oklch(0.52 0 0);
  --icon-faint: oklch(0.46 0 0);
  --grip: oklch(0.42 0 0);
  --accent-border: oklch(0.40 0.06 250);
  --type-struct: oklch(0.74 0.13 300);
  --type-sql: oklch(0.70 0.11 195);
}
```

### 1b. HSL fallback (older shadcn / Tailwind v3)

If your `globals.css` uses HSL triplets consumed via `hsl(var(--x))`, use these instead
(equivalent to the oklch above; space-separated, no `hsl()` wrapper, per shadcn convention):

```css
:root {                         .dark {
  --background: 0 0% 98%;         --background: 0 0% 17%;
  --foreground: 0 0% 27%;         --foreground: 0 0% 89%;
  --card: 0 0% 96%;               --card: 0 0% 15%;
  --popover: 0 0% 100%;           --popover: 0 0% 15%;
  --primary: 218 74% 53%;         --primary: 216 84% 62%;
  --primary-foreground: 0 0% 99%; --primary-foreground: 0 0% 98%;
  --muted: 0 0% 96%;              --muted: 0 0% 15%;
  --muted-foreground: 0 0% 46%;   --muted-foreground: 0 0% 63%;
  --accent: 223 70% 93%;          --accent: 226 28% 25%;
  --accent-foreground: 0 0% 27%;  --accent-foreground: 0 0% 89%;
  --border: 0 0% 84%;             --border: 0 0% 24%;
  --input: 0 0% 84%;              --input: 0 0% 24%;
  --ring: 218 74% 53%;            --ring: 216 84% 62%;
  /* custom */                    /* custom */
  --editor: 0 0% 100%;            --editor: 0 0% 13%;
  --row-nested: 0 0% 96%;         --row-nested: 0 0% 15%;
  --border-subtle: 0 0% 91%;      --border-subtle: 0 0% 21%;
  --text-2: 0 0% 34%;             --text-2: 0 0% 80%;
  --desc: 0 0% 50%;               --desc: 0 0% 56%;
  --faint: 0 0% 55%;              --faint: 0 0% 48%;
  --icon-faint: 0 0% 62%;         --icon-faint: 0 0% 43%;
  --grip: 0 0% 68%;               --grip: 0 0% 38%;
  --type-struct: 275 51% 50%;     --type-struct: 272 50% 69%;
  --type-sql: 190 68% 37%;        --type-sql: 188 61% 53%;
}                               }
```
(Sidebar `--sidebar*` tokens mirror `--card` / `--primary` / `--accent` / `--border` per the
oklch block.)

### 1c. Tailwind mapping

- **Tailwind v4:** add the customs to `@theme inline` so utilities exist:
  ```css
  @theme inline {
    --color-editor: var(--editor);
    --color-row-nested: var(--row-nested);
    --color-border-subtle: var(--border-subtle);
    --color-faint: var(--faint);
    --color-desc: var(--desc);
    --color-grip: var(--grip);
    --color-type-struct: var(--type-struct);
    --color-type-sql: var(--type-sql);
  }
  ```
  → `bg-editor`, `text-faint`, `text-type-struct`, etc.
- **Tailwind v3:** add under `theme.extend.colors`, e.g.
  `editor: "hsl(var(--editor))", faint: "hsl(var(--faint))", "type-struct": "hsl(var(--type-struct))"` …

---

## 2. Typography

```css
/* layout.tsx / globals.css */
--font-sans: "IBM Plex Sans", system-ui, sans-serif;
--font-mono: "IBM Plex Mono", ui-monospace, monospace;
```
- Base UI text 12–13px. Use `font-mono` for **all identifiers**: file names, tree nodes,
  breadcrumb, column names, types, line numbers, status bar.
- Section labels (`GENERAL`, `COLUMNS`, `EXPLORER`): `text-[10.5px] font-semibold tracking-[0.1em]
  uppercase text-faint`.
- Do **not** swap in Inter/Roboto. IBM Plex (or system) only.

---

## 3. Density (the sizing that makes it match)

Heights are exact — set them explicitly, don't rely on component defaults (shadcn defaults are
taller than this spartan layout).

| Region | Class hint |
|---|---|
| Title bar | `h-8` (32px) |
| Activity rail | `w-[52px]`, items `h-[52px]` |
| Explorer (default) | `w-[222px]`, min 180 / max 360 (resizable) |
| Explorer header | `h-7` (28px) |
| Search input | `h-[25px]` |
| Tree row | `h-6` (24px) |
| Editor tab strip | `h-[31px]` |
| Toolbar | `h-[30px]`, controls `h-[21px]` |
| Breadcrumb bar | `h-[22px]` |
| Status bar | `h-[22px]` |
| Form column row | `h-9` (36px) |

Radius 5–6px on inputs/buttons/cards; **0** on full-height chrome (rail, bars). Borders 1px
`border-border`; row separators `border-border-subtle`. Active states use a 2px inset accent bar
(`shadow-[inset_2px_0_0_hsl(var(--primary))]`; tab underline `inset_0_-2px_0`).

---

## 4. Shell layout

```tsx
<div className="flex h-screen flex-col bg-background text-foreground font-sans">
  <TitleBar />                              {/* h-8 */}
  <div className="flex flex-1 min-h-0">
    <ActivityRail />                        {/* w-[52px] */}
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      <ResizablePanel defaultSize={18} minSize={14} maxSize={30}>
        <ExplorerSidebar />                 {/* resizable */}
      </ResizablePanel>
      <ResizableHandle />                   {/* see §9 */}
      <ResizablePanel defaultSize={82}>
        <EditorArea />                      {/* tabs + toolbar + breadcrumb + body */}
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
  <StatusBar />                             {/* h-[22px] */}
</div>
```

---

## 5. Component specs

### Title bar
`h-8 px-2 flex items-center justify-between border-b border-border bg-background`.
Left: `MODELER` (`text-[11px] font-semibold text-primary`) + `File Edit View` as ghost
`Button size="sm"` (`h-6 px-1.5 text-xs text-muted-foreground`). Right: active filename
(`font-mono text-[11px] text-faint`) + theme-toggle icon button.

### Activity rail (custom, not a shadcn component)
`w-[52px] flex flex-col justify-between border-r border-border bg-background`. Each item:
```tsx
<button className={cn(
  "h-[52px] flex flex-col items-center justify-center gap-1 text-muted-foreground",
  active && "bg-sidebar-accent text-primary shadow-[inset_2px_0_0_hsl(var(--primary))]"
)}>
  <Icon className="size-[18px]" strokeWidth={1.8} />
  <span className="text-[9px] uppercase tracking-wide">Explorer</span>
</button>
```
Items: Explorer, Plugins, Repo, AI; Settings pinned bottom. Wrap each in shadcn `Tooltip`.
(Icon-only 40px-wide mode is a valid denser variant — drop the caption, center the icon.)

### Explorer sidebar
`bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col`.
- Header `h-7 px-2.5 flex items-center justify-between`: `EXPLORER` label + new-file / refresh
  icon buttons (`size-[13px] text-faint`).
- Search: shadcn `Input` overridden to `h-[25px] text-xs bg-editor` with a leading 13px search
  icon (absolute, `text-faint`).
- Tree: wrap in shadcn `ScrollArea`. Rows are custom (see §6 pattern — same as columns), `h-6
  font-mono text-[12.5px]`. Chevron `text-faint`; file dot 5px colored by type:
  `.tbl.yaml → bg-primary`, `.sql → bg-type-sql`, `.can.md → bg-muted-foreground`. Selected file
  row: `bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_hsl(var(--primary))]`.

### Editor tabs
`h-[31px] flex border-b border-border bg-card`. Active tab:
`bg-editor shadow-[inset_0_-2px_0_hsl(var(--primary))] text-foreground`; inactive `text-faint`.
Each: type dot + `font-mono text-xs` name + close `X` (`size-3 text-faint`).

### View toggle (SOURCE / FORM / PRODUCT) — `ToggleGroup`
Use `ToggleGroup type="single"` (or `Tabs`) styled as a segmented control:
```tsx
<ToggleGroup type="single" value={view} onValueChange={setView}
  className="h-[21px] rounded-[5px] border border-border overflow-hidden">
  <ToggleGroupItem value="source" className="h-[21px] px-2.5 text-[10.5px] font-medium
    tracking-wide rounded-none data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
    SOURCE
  </ToggleGroupItem>
  {/* FORM, PRODUCT (PRODUCT adds a caret + dropdown) */}
</ToggleGroup>
```

### Toolbar buttons (`History`, save) — `Button variant="outline" size="sm"`
Override to `h-[21px] px-2 text-[11px] gap-1 text-muted-foreground`. Icons `size-[13px]`.

### Breadcrumb — shadcn `Breadcrumb`
`h-[22px] px-2.5 font-mono text-[11px]`. Separators `/` in `text-faint`; segments `text-faint`,
last (`BreadcrumbPage`) `text-muted-foreground`.

### Select (Materialization, type pickers) — shadcn `Select`
`SelectTrigger` → `h-[30px] text-[13px] bg-editor border-border rounded-[5px]`; values that are
identifiers use `font-mono`. `SelectContent` inherits `--popover`.

### Badges / pills — shadcn `Badge`
- **Tests:** `Badge variant="outline"` → `rounded-full px-2.5 py-1 text-xs font-mono text-text-2
  bg-background border-border`. `Add test` pill: `border-dashed border-accent-border text-primary`.
- **Type cell:** plain colored text, not a Badge — scalar in `text-primary`, container in
  `text-type-struct` with child count suffix (`STRUCT · 3`).

### Checkbox (PK) — shadcn `Checkbox`
Override to `size-[15px] rounded-[3px] data-[state=checked]:bg-primary
data-[state=checked]:text-primary-foreground border-border`.

### Status bar
`h-[22px] px-2.5 flex items-center justify-between border-t border-border bg-card font-mono
text-[10.5px] text-faint`. Left: branch (`GitBranch` icon + name in `text-primary`), error count,
column count. Right: language, encoding, `Ln/Col`, indent. `Separator orientation="vertical"`
(`h-3`) or fixed `gap-3.5` between groups.

---

## 6. FORM view + nested/expandable columns

Body: `ScrollArea`, `p-[20px_22px]`, inner `max-w-[760px]` with `space-y-6`.

- **GENERAL:** `grid grid-cols-2 gap-x-[18px] gap-y-3.5`. Fields are shadcn `Input` /
  `Select` at `h-[30px]`; Description spans `col-span-2`; identifier values `font-mono`.
- **COLUMNS:** label `COLUMNS · {n}` + `Add column` (`Button variant="outline" size="sm"
  h-6 text-primary border-accent-border`). The grid:

```
grid-template-columns: 28px 1.4fr 1.2fr 56px 1.6fr 28px;
/* drag | name | type | PK | description | delete */
```
Header row `h-[30px] bg-card` labels in `text-faint`; data rows `h-9 border-b border-border-subtle
font-mono text-[12.5px]`.

**Expandable nesting.** A `STRUCT` / `RECORD` / `ARRAY<STRUCT>` column is expandable; clicking its
chevron unpacks its child fields as indented sub-rows. A child can itself be structured → nests
arbitrarily deep. Implement with one row component recursing over a tree, controlled by
`Collapsible` state (or a local `expanded: Set<path>`), **flattening visible rows** so every row
shares the same grid and the columns stay aligned:

```tsx
function ColumnRow({ col, depth }: { col: Column; depth: number }) {
  const [open, setOpen] = useState(col.defaultOpen);
  const expandable = col.children?.length > 0;
  return (
    <>
      <div className={cn(
        "grid grid-cols-[28px_1.4fr_1.2fr_56px_1.6fr_28px] items-center h-9 px-1.5",
        "border-b border-border-subtle font-mono text-[12.5px]",
        depth > 0 && "bg-row-nested"
      )}>
        <GripVertical className="size-[13px] text-grip mx-auto" />
        <div className="flex items-center gap-1.5 min-w-0"
             style={{ paddingLeft: 4 + depth * 18 }}>
          {expandable
            ? <button onClick={() => setOpen(o => !o)} className="w-3.5 text-faint shrink-0">
                {open ? "▾" : "▸"}
              </button>
            : <span className="w-3.5 text-center text-icon-faint shrink-0">
                {depth > 0 ? "·" : ""}
              </span>}
          <span className={cn("truncate", depth > 0 ? "text-text-2" : "text-foreground")}>
            {col.name}
          </span>
        </div>
        <span className={cn("truncate", expandable ? "text-type-struct" : "text-primary")}>
          {expandable ? `${col.type} · ${col.children.length}` : col.type}
        </span>
        <div className="flex justify-center">
          <Checkbox checked={col.pk} className="size-[15px] rounded-[3px]" />
        </div>
        <span className="truncate font-sans text-desc">{col.description}</span>
        <button className="text-icon-faint mx-auto"><X className="size-[13px]" /></button>
      </div>
      {expandable && open && col.children.map(c =>
        <ColumnRow key={c.id} col={c} depth={depth + 1} />)}
    </>
  );
}
```
- Indent name cell by `4 + depth*18`px; always reserve the 3.5 (14px) chevron slot so names align.
- Nested rows: `bg-row-nested`. Container type text: `text-type-struct` + child count; scalars
  `text-primary`.
- Expansion is **UI-only** state keyed by stable column path — never mutates the model.

Reference tree: `order_id`(PK), `customer_id`, `order_total`, `ship_to: STRUCT{street,city,
region}`, `line_items: ARRAY<STRUCT>{product_id, qty, unit_price, discount: STRUCT{type, amount}}`,
`created_at`. (`line_items` → `discount` shows a table nested inside a column inside a column.)

---

## 7. Iconography
Lucide (ships with shadcn). Rail icons `size-[18px] strokeWidth={1.8}`; tool/tree icons
`size-[13px]`. Line icons only — no filled/multicolor. Suggested: `Boxes`(Explorer),
`Package`/`Blocks`(Plugins), `FolderGit2`(Repo), `Sparkles`(AI), `Settings`(Settings),
`GripVertical`, `ChevronDown`, `GitBranch`, `History`, `Save`, `X`, `Plus`, `Search`.

## 8. Dark/light toggle
All surfaces read from tokens, so toggling is just the `.dark` class on `<html>`
(`next-themes` `ThemeProvider` or a manual setter). No per-component theme branches — if you find
yourself writing `dark:` variants for color, add/rename a token instead.

---

## 9. Resizable sidebar (the new requirement)

Use shadcn `resizable` (wraps `react-resizable-panels`).

- **Default 222px.** `ResizablePanel` sizes are percentages; either compute the % from viewport
  or use the `defaultSize`/`minSize`/`maxSize` shown in §4 (≈18% / 14% / 30%). For pixel-exact
  control, set the panel's collapsed/expanded behavior via the panel ref and store the px size.
- **Min 180px / max ~360px.** Below min, optionally **collapse** the Explorer (panel
  `collapsible collapsedSize={0}`) and let the activity-rail Explorer icon toggle it back open.
- **Handle styling** — make it a hairline that brightens to the accent on hover/drag:
```tsx
<ResizableHandle className="w-px bg-border transition-colors
  hover:bg-primary data-[resize-handle-state=drag]:bg-primary
  focus-visible:bg-primary" />
```
  (Set `withHandle` if you want the visible grip dots; for this spartan look prefer the bare
  hairline.) Keep the cursor `col-resize`; the panels themselves keep `overflow-hidden` so the
  tree's own `ScrollArea` scrolls, not the panel.
- **Persist** the size to `localStorage` so it survives reload — `ResizablePanelGroup` accepts
  an `autoSaveId="modeler-shell"` which handles this for you.
- The activity rail is **outside** the `ResizablePanelGroup` (fixed `w-[52px]`); only Explorer ↔
  editor is resizable, matching the mockup.
