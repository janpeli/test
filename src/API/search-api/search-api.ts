import { store } from "@/app/store";
import { SearchOptions } from "electron/src/project";
import {
  setSearchQuery,
  setSearchOptions,
  setSearchLoading,
  setSearchResults,
  setSearchError,
  clearSearchResults,
  clearSearch as clearSearchAction,
} from "./search.slice";
import { openFileById } from "../editor-api/editor-api";
import { addErrorMessage } from "../GUI-api/status-panel-api";

/** Updates the query text (bound to the search input). */
export const setQuery = (query: string) => {
  store.dispatch(setSearchQuery(query));
};

/** Merges a partial change into the search options (toggles, globs). */
export const setOptions = (options: Partial<SearchOptions>) => {
  store.dispatch(setSearchOptions(options));
};

/**
 * Monotonic run counter: responses are dropped unless they belong to the
 * latest runSearch call, so two searches in the same project resolving out of
 * order can't leave the older results on screen.
 */
let searchSeq = 0;

/**
 * A response is stale when a newer search started after it, or the open
 * project changed during the await (mirrors the `git-api` stale-response
 * guard) — either way it must not touch the store.
 */
const isStaleResponse = (seq: number, folderPath: string) =>
  seq !== searchSeq || store.getState().projectAPI.folderPath !== folderPath;

/**
 * Runs the search for the current query + options against the open project via
 * ripgrep (main process). An empty/whitespace query clears results. Stale
 * responses (superseded search or changed project) are dropped.
 */
export const runSearch = async () => {
  const { query, options } = store.getState().searchAPI;
  const folderPath = store.getState().projectAPI.folderPath;

  if (!folderPath || !query.trim()) {
    store.dispatch(clearSearchResults());
    return;
  }

  const seq = ++searchSeq;
  try {
    store.dispatch(setSearchLoading(true));
    const results = await window.project.searchProject({
      folderPath,
      query,
      options,
    });
    if (isStaleResponse(seq, folderPath)) return;
    store.dispatch(setSearchResults(results));
  } catch (error) {
    if (isStaleResponse(seq, folderPath)) return;
    const message = (error as Error).message;
    store.dispatch(setSearchError(message));
    addErrorMessage(`Search failed: ${message}`, "error");
  }
};

/** Opens a search result file (reuses the standard open flow, which focuses an
 * already-open tab instead of duplicating it). Results reflect the live disk,
 * so the file may be gone by click time — surface that instead of an
 * unhandled rejection. */
export const openSearchResult = (id: string) => {
  openFileById(id).catch((error) => {
    addErrorMessage(
      `Failed to open ${id}: ${(error as Error).message}`,
      "error"
    );
  });
};

/** Full reset — used when the project is closed. */
export const clearSearch = () => {
  store.dispatch(clearSearchAction());
};
