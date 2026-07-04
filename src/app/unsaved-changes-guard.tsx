import { useEffect } from "react";
import { hasUnsavedChanges } from "@/API/editor-api/editor-api";
import { canCloseWindow, openUnsavedChangesModal } from "@/API/GUI-api/modal-api";

/**
 * Headless component that blocks window close while any editor has unsaved
 * edits. Electron honors `beforeunload`, but blocking it never shows a native
 * prompt — it just silently cancels the close — so we raise our own confirm
 * modal instead. Mounted once inside the Redux Provider in App.tsx.
 */
export default function UnsavedChangesGuard() {
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (canCloseWindow() || !hasUnsavedChanges()) return;
      event.preventDefault();
      event.returnValue = false;
      openUnsavedChangesModal();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);
  return null;
}
