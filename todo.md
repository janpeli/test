
- 
❯ lets plan this feature, do not plan testing it by your self only do lint. i will test manualy:

---

## TODO: Extract a shared sidebar tree-panel component (code-review finding #4)

**Why:** `src/features/MainSidebar/main-sidebar-ai.tsx` is a near-verbatim copy of
`src/features/MainSidebar/main-sidebar-explorer.tsx` (~40 lines). `handleDblClick`,
`getNodeIcon`, the `Treeview` JSX wrapper, `onSelect`, `allowDragDrop`, and
`onNodesMove` are identical. Any future change to tree wiring has to be made in two
places and will drift.

**What differs between the two files (the ONLY things to parameterize):**
1. Structure selector: `selectProjectStructureforModels` (Explorer) vs
   `selectProjectStructureforAI` (AI).
2. `treeCallBack`: `set_MAIN_SIDEBAR_EXPLORER_TREE` vs `set_MAIN_SIDEBAR_AI_TREE`.
3. Header label: `"EXPLORER"` vs `"AI"`.
4. `nodeContextCommands`: AI adds one extra guard at the top —
   `if (node.parent === null) return [];` (the synthetic project-root container
   has no file ops of its own). Everything after that guard is identical.

**Everything else is identical** and belongs in the shared component:
`handleDblClick` (open leaf via `openFileById`), `getNodeIcon` (`FileIcon` from
store plugins), `onSelect={explorerOnSelect}`, `allowDragDrop={true}`,
`onNodesMove={moveProjectNode}`, and the `flex flex-col flex-1 ...` + `Separator`
+ conditional `Treeview` JSX.

**Plan:**
- Add `src/features/MainSidebar/main-sidebar-tree-panel.tsx` exporting a component
  with props roughly:
  ```ts
  type SidebarTreePanelProps = {
    label: string;
    structureSelector: (state: RootState) => (ProjectStructure & IData) | null;
    treeCallBack: (tree: TreeController) => void;
    // AI panel: suppress context menu on the synthetic root container.
    suppressRootCommands?: boolean;
  };
  ```
  Move `handleDblClick`, `getNodeIcon`, and the base `nodeContextCommands` body in.
  Build `nodeContextCommands` so it returns `[]` when
  `suppressRootCommands && node.parent === null`, else the existing folder/leaf logic.
- Rewrite `main-sidebar-explorer.tsx` as a thin wrapper:
  `<SidebarTreePanel label="EXPLORER" structureSelector={selectProjectStructureforModels} treeCallBack={set_MAIN_SIDEBAR_EXPLORER_TREE} />`.
- Rewrite `main-sidebar-ai.tsx` as:
  `<SidebarTreePanel label="AI" structureSelector={selectProjectStructureforAI} treeCallBack={set_MAIN_SIDEBAR_AI_TREE} suppressRootCommands />`.
- Use `useAppSelector(structureSelector)` and `useAppSelector(selectProjectPath)`
  inside the shared component (keep the `projectPath && structure ? <Treeview/> : null`
  gate — it's what drives mount/unmount on project open/close; don't change it).

**Out of scope / notes:**
- Do NOT fold in `main-sidebar-plugins.tsx`: its folders are read-only and its
  command/selector wiring differs more — keep it separate (can revisit later).
- `selectProjectStructureforModels` returns a store reference; `selectProjectStructureforAI`
  (via `buildAIStructure`) returns a fresh shallow copy. Both already work with the
  tree's mount-once `useMemo` + imperative `update_MAIN_SIDEBAR_*` refresh path — the
  refactor must NOT introduce a `key`/remount that breaks that.
- Pure-presentational refactor: no behavior change intended. Verify with `npm run lint`
  only (zero-warnings policy); user tests the UI manually.
