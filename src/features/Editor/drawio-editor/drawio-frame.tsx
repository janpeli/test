import { useEffect, useRef, useState } from "react";
import { store } from "@/app/store";
import { setFileContent } from "@/API/editor-api/editor-api.slice";
import { saveEditedFile } from "@/API/editor-api/editor-api";
import { selectFileContent } from "@/API/editor-api/editor-api.selectors";
import { useAppSelectorWithParams } from "@/hooks/hooks";
import {
  DRAWIO_EMPTY_DIAGRAM,
  buildDrawioUrl,
  createEchoGuard,
  isParsableXml,
  makeLoadAction,
  parseEmbedMessage,
} from "./drawio-embed.core";

const SOURCE_SYNC_DEBOUNCE_MS = 250;

type DrawioFrameProps = {
  editorIdx: number;
  fileId: string;
  visible: boolean;
  dark: boolean;
};

const parseXml = (text: string) => {
  const doc = new DOMParser().parseFromString(text, "text/xml");
  return { hasError: !!doc.querySelector("parsererror") };
};

/**
 * One live drawio instance bound to a single file for its whole lifetime.
 * Runs the embed-mode handshake (init → load) and the live two-way sync:
 * drawio autosave/save → store `setFileContent`, SOURCE edits → debounced
 * `load` back into the iframe. Loop-safety via the echo guard (see
 * drawio-embed.core.ts). The pool (drawio-editor.tsx) keeps frames mounted
 * across tab switches so viewport/undo survive — the embed protocol has no
 * way to export or restore them.
 */
function DrawioFrame({ editorIdx, fileId, visible, dark }: DrawioFrameProps) {
  const content = useAppSelectorWithParams(selectFileContent, {
    editorIdx,
    fileId,
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const guardRef = useRef(createEchoGuard());
  const readyRef = useRef(false);
  const contentRef = useRef(content);
  contentRef.current = content;
  const debounceRef = useRef<number | undefined>(undefined);

  // drawio's ui theme is a load-time URL parameter, so a theme change means a
  // reload. Only the visible frame reloads immediately; hidden frames keep the
  // stale theme until they next become visible (avoids N simultaneous reloads).
  const [appliedDark, setAppliedDark] = useState(dark);
  useEffect(() => {
    if (visible && appliedDark !== dark) {
      readyRef.current = false;
      setAppliedDark(dark); // changes the iframe key → fresh boot → init → load
    }
  }, [visible, dark, appliedDark]);

  const postToIframe = (message: string) => {
    iframeRef.current?.contentWindow?.postMessage(message, "*");
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const msg = parseEmbedMessage(event.data);
      if (!msg) return;
      const guard = guardRef.current;

      switch (msg.event) {
        case "init": {
          readyRef.current = true;
          const current = contentRef.current;
          const xml =
            current && current.trim().length > 0
              ? current
              : DRAWIO_EMPTY_DIAGRAM;
          guard.notePush(xml);
          postToIframe(makeLoadAction(xml));
          break;
        }
        case "autosave":
        case "save": {
          if (typeof msg.xml === "string" && guard.shouldWriteToStore(msg.xml)) {
            guard.noteReceive(msg.xml);
            // No `fromSource`: Monaco applies it as an external edit (bracketed
            // pushEditOperations, change event suppressed) and isDirty is set.
            store.dispatch(setFileContent({ fileId, content: msg.xml }));
          }
          // drawio's own Ctrl+S — persist through the app's save path so both
          // save gestures converge.
          if (msg.event === "save") void saveEditedFile(fileId);
          break;
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [fileId]);

  // SOURCE → DRAWIO: push store-content changes (Monaco edits, undo, git
  // checkout, …) into the iframe, debounced like the SOURCE→FORM sync, and
  // skipped while the XML is half-typed.
  useEffect(() => {
    if (!readyRef.current) return;
    if (typeof content !== "string") return;
    if (!guardRef.current.shouldPushToIframe(content)) return;

    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const latest = contentRef.current;
      if (typeof latest !== "string") return;
      if (!guardRef.current.shouldPushToIframe(latest)) return;
      if (!isParsableXml(latest, parseXml)) return;
      guardRef.current.notePush(latest);
      postToIframe(makeLoadAction(latest));
    }, SOURCE_SYNC_DEBOUNCE_MS);
    return () => window.clearTimeout(debounceRef.current);
  }, [content]);

  return (
    <iframe
      // Key on the applied theme: swapping it boots a fresh drawio with the
      // matching ui, which re-runs the init→load handshake.
      key={appliedDark ? "dark" : "light"}
      ref={iframeRef}
      src={buildDrawioUrl({ dark: appliedDark })}
      title="drawio diagram editor"
      className="h-full w-full border-0"
    />
  );
}

export default DrawioFrame;
