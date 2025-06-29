import EditorForm from "./editor-form";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import {
  selectEditedFiles,
  selectOpenFileId,
  selectFileScrollPosition,
} from "@/API/editor-api/editor-api.selectors";
import { updateFileScrollPos } from "@/API/editor-api/editor-api";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useCallback } from "react";
import { ScrollPosition } from "@/API/editor-api/editor-api.slice";

type ContainerScrolPositions = {
  [fileId: string]: ScrollPosition;
};

type EditorFormPanelsProps = {
  editorIdx: number;
};

const EditorFormPanels = React.memo(function EditorFormPanels(
  props: EditorFormPanelsProps
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentFileIdRef = useRef<string | undefined>(undefined);
  const isRestoringScrollRef = useRef(false);
  const containerScrollPositionsRef = useRef<ContainerScrolPositions>({});

  const editedFiles = useAppSelectorWithParams(selectEditedFiles, {
    editorIdx: props.editorIdx,
  });

  const openFileID = useAppSelectorWithParams(selectOpenFileId, {
    editorIdx: props.editorIdx,
  });

  const scrollPosition = useAppSelectorWithParams(selectFileScrollPosition, {
    editorIdx: props.editorIdx,
  });

  // Restore scroll position
  const restoreScrollPosition = useCallback(() => {
    if (containerRef.current && scrollPosition && openFileID) {
      isRestoringScrollRef.current = true;
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (
          containerRef.current &&
          (containerRef.current.scrollTop !== scrollPosition.scrollTop ||
            containerRef.current.scrollLeft !== scrollPosition.scrollLeft)
        ) {
          containerRef.current.scrollTop = scrollPosition.scrollTop;
          containerRef.current.scrollLeft = scrollPosition.scrollLeft;
        }
        isRestoringScrollRef.current = false;
      });
    }
  }, [scrollPosition, openFileID]);

  // Handle file switching
  useEffect(() => {
    // Save scroll position of previous file immediately (no debounce)
    if (
      currentFileIdRef.current &&
      currentFileIdRef.current !== openFileID &&
      !isRestoringScrollRef.current
    ) {
      const oldFileId = currentFileIdRef.current;
      const containerScrollPositions =
        containerScrollPositionsRef.current[oldFileId];
      // Check if containerScrollPositions exists before accessing properties
      if (containerScrollPositions && oldFileId) {
        const scrollTop = containerScrollPositions.scrollTop;
        const scrollLeft = containerScrollPositions.scrollLeft;
        updateFileScrollPos(oldFileId, {
          scrollTop,
          scrollLeft,
        });
        console.log("handling switching from panels");
      }
    }

    // Update current file reference
    currentFileIdRef.current = openFileID;

    // Restore scroll position for new file
    if (openFileID && scrollPosition) {
      restoreScrollPosition();
    }
  }, [openFileID, restoreScrollPosition, scrollPosition]);

  // keeping always actual scroll walues for given fileID
  useEffect(() => {
    const container = containerRef.current;
    const containerScrollPositions = containerScrollPositionsRef.current;
    if (!container) return;
    // initialise container scrollpositin if it does not exists already
    if (openFileID && !containerScrollPositions[openFileID]) {
      containerScrollPositions[openFileID] = {
        scrollTop: 0,
        scrollLeft: 0,
      };
    }

    const handleScroll = () => {
      if (!isRestoringScrollRef.current && openFileID) {
        containerScrollPositions[openFileID].scrollTop = container.scrollTop;
        containerScrollPositions[openFileID].scrollLeft = container.scrollLeft;
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [openFileID]);

  return (
    <div ref={containerRef} className="flex-1 overflow-auto">
      {editedFiles?.map(
        (file) =>
          file.plugin_uuid && (
            <div
              key={file.id}
              className={cn(
                openFileID === file.id ? "flex flex-col" : "hidden"
              )}
            >
              <EditorForm
                editorIdx={props.editorIdx}
                fileId={file.id}
                key={file.id}
              />
            </div>
          )
      )}
    </div>
  );
});

EditorFormPanels.displayName = "EditorFormPanels";
export default EditorFormPanels;
