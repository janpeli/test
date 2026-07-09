- [x] naplanovat feature textoveho vyhladavania
- [X] hooknut redo undo v mainbar
- [ ] premysliet linky medzi file - ci predsa nejst radsej funkcionalitou obsidian linkov 
- [ ] linkovanie medzi subormi niekde si cashovat spoje a potom ak sa zmeni linka tak automaticky updatnut
- [X] react window na treeview
- [ ] refresh na explorery
- [X] upravit reference picker

Identified during architecture review runs (2026-07-04), not done:
- [ ] manual GUI pass under Electron 42 (`npm run dev`): visual check of all panes + export-image save dialog end-to-end; launch the packaged AppImage once
- [ ] revert live-test edits in test_project `.../Hotel/room.ent.yaml` (added comments + "Bed Size")
- [X] replace placeholder window icon (electron-vite.svg) with a real app icon; add package.json description/author (removes electron-builder warnings)
- [ ] drop unused `vite-tsconfig-paths` dependency (`@` alias is set manually in vite.config.ts)
- [ ] electron-devtools-installer uses deprecated `session.loadExtension` (works in E42 with warnings) — replace with `session.extensions` API or drop when it breaks
- [ ] bump @reduxjs/toolkit 1.x→2.x together with react-redux 8→9
- [ ] Vite 6→8 + vite-plugin-electron 0.14→1.x migration (deliberately skipped during the Electron upgrade; own task)
- [ ] filesystem watcher for external changes — live tree/editor refresh; the mtime guard only covers the save path
- [ ] UX follow-ups if the two-button dialogs feel limiting: "Save all" in the close dialog, "Reload from disk" in the save-conflict dialog
- [ ] add `senderFrame` validation on IPC handlers if a second window or remote content is ever introduced
- [ ] replace timestamp editorIdx (`new Date().valueOf()` in `createEditor`) with a monotonic counter — collision-safe if a future path ever creates multiple panes in one synchronous tick
