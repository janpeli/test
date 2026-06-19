import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GitInfo } from "electron/src/project";

export interface GitAPIState {
  info: GitInfo | null;
  loading: boolean;
  error: string | null;
}

const initialState: GitAPIState = {
  info: null,
  loading: false,
  error: null,
};

export const gitAPISlice = createSlice({
  name: "gitAPI",
  initialState,
  reducers: {
    setGitInfo: (state, action: PayloadAction<GitInfo>) => {
      state.info = action.payload;
      state.loading = false;
      state.error = null;
    },
    setGitLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setGitError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearGitInfo: (state) => {
      state.info = initialState.info;
      state.loading = initialState.loading;
      state.error = initialState.error;
    },
  },
});

export default gitAPISlice.reducer;

export const { setGitInfo, setGitLoading, setGitError, clearGitInfo } =
  gitAPISlice.actions;
