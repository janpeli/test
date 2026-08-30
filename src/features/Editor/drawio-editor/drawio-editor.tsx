import { useEffect, useRef, useState } from "react";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import {
  selectEditedFiles,
  selectOpenFileId,
} from "@/API/editor-api/editor-api.selectors";
import { activateInPool, holesToClipPath } from "./drawio-embed.core";
import { useOverlayCover } from "./use-overlay-cover";
import DrawioFrame from "./drawio-frame";

// Live drawio instances kept mounted per editor pane. Each one holds
// ~50–100 MB, so the pool is capped: activating a 5th diagram evicts the
// least-recently-used frame (its content is safe in the store via autosave;
// only that cold tab's viewport/undo reset on revisit).
const MAX_LIVE_FRAMES = 4;

type DrawioEditorProps = {
  editorIdx: number;
};

/**
 * The DRAWIO pane: manages the pool of per-file drawio iframes. All pooled
 * frames stay mounted with only the active file's frame visible — the same
 * always-mounted trick content-editor.tsx uses for panes — so switching tabs
 * between drawio files is an instant CSS swap that preserves each diagram's
 * viewport, selection, and undo stack.
 */
function DrawioEditor({ editorIdx }: DrawioEditorProps) {
  const openFileId = useAppSelectorWithParams(selectOpenFileId, { editorIdx });
  const editedFiles =
    useAppSelectorWithParams(selectEditedFiles, { editorIdx }) ?? [];

  const drawioFileIds = editedFiles
    .filter((file) => file.modes?.includes("DRAWIO"))
    .map((file) => file.id);

  const activeId =
    openFileId && drawioFileIds.includes(openFileId) ? openFileId : undefined;

  const [pool, setPool] = useState<string[]>([]);

  // Promote the active file in the LRU pool; drop frames whose tab closed.
  useEffect(() => {
    setPool((prev) => {
      const alive = prev.filter((id) => drawioFileIds.includes(id));
      const next = activeId
        ? activateInPool(alive, activeId, MAX_LIVE_FRAMES)
        : alive;
      return next.length === alive.length &&
        next.every((id, i) => id === alive[i])
        ? prev.length === alive.length
          ? prev
          : alive
        : next;
    });
    // drawioFileIds is derived per render; its join is a stable dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, drawioFileIds.join("\n")]);

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Electron paints the cross-origin drawio iframes above the app's portaled
  // menus/dialogs (out-of-process frames ignore z-index — see
  // use-overlay-cover.ts). While an open menu overlaps this pane, clip-path
  // punches a hole in the frame under the menu so it shows through and the
  // rest of the diagram stays visible; dialogs (full-screen backdrop) still
  // hide the frames entirely. Visibility keeps hidden frames alive.
  const containerRef = useRef<HTMLDivElement>(null);
  const { holes, hideAll } = useOverlayCover(containerRef, pool.length > 0);
  const clipPath = holesToClipPath(holes) ?? undefined;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-background"
    >
      {pool.map((fileId) => {
        const visible = fileId === activeId && !hideAll;
        return (
          <div
            key={fileId}
            // visibility (not display) keeps the hidden iframe laid out at
            // full pane size, so re-showing it needs no resize/refit.
            className={
              visible
                ? "absolute inset-0"
                : "absolute inset-0 invisible pointer-events-none"
            }
            style={visible ? { clipPath } : undefined}
            aria-hidden={!visible}
          >
            <DrawioFrame
              editorIdx={editorIdx}
              fileId={fileId}
              visible={visible}
              dark={isDark}
            />
          </div>
        );
      })}
    </div>
  );
}

export default DrawioEditor;
