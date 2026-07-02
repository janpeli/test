import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SearchOptions, SearchResult } from "electron/src/project";

export interface SearchAPIState {
  query: string;
  options: SearchOptions;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  // True once a search has actually run, so the panel can tell "no results
  // found" apart from "not searched yet".
  hasSearched: boolean;
}

const initialState: SearchAPIState = {
  query: "",
  options: {
    caseSensitive: false,
    regex: false,
    wholeWord: false,
    include: "",
    exclude: "",
  },
  results: [],
  loading: false,
  error: null,
  hasSearched: false,
};

export const searchAPISlice = createSlice({
  name: "searchAPI",
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setSearchOptions: (
      state,
      action: PayloadAction<Partial<SearchOptions>>
    ) => {
      state.options = { ...state.options, ...action.payload };
    },
    setSearchLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      // Starting a new search drops a previous error so the panel shows
      // "Searching…" instead of the stale error while in flight.
      if (action.payload) state.error = null;
    },
    setSearchResults: (state, action: PayloadAction<SearchResult[]>) => {
      state.results = action.payload;
      state.loading = false;
      state.error = null;
      state.hasSearched = true;
    },
    setSearchError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.results = [];
      state.loading = false;
      state.hasSearched = true;
    },
    // Clears results/status but keeps the query + options (used when the query
    // is emptied — return to the pristine "type to search" state).
    clearSearchResults: (state) => {
      state.results = [];
      state.loading = false;
      state.error = null;
      state.hasSearched = false;
    },
    // Full reset, including query + options (used on project close).
    clearSearch: (state) => {
      state.query = initialState.query;
      state.options = { ...initialState.options };
      state.results = [];
      state.loading = false;
      state.error = null;
      state.hasSearched = false;
    },
  },
});

export default searchAPISlice.reducer;

export const {
  setSearchQuery,
  setSearchOptions,
  setSearchLoading,
  setSearchResults,
  setSearchError,
  clearSearchResults,
  clearSearch,
} = searchAPISlice.actions;
