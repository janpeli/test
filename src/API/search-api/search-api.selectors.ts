import type { RootState } from "../../app/store";

export const selectSearchQuery = (state: RootState) => state.searchAPI.query;

export const selectSearchOptions = (state: RootState) =>
  state.searchAPI.options;

export const selectSearchResults = (state: RootState) =>
  state.searchAPI.results;

export const selectSearchLoading = (state: RootState) =>
  state.searchAPI.loading;

export const selectSearchError = (state: RootState) => state.searchAPI.error;

export const selectSearchHasSearched = (state: RootState) =>
  state.searchAPI.hasSearched;
