import type { RootState } from "../../app/store";

export const selectGitInfo = (state: RootState) => state.gitAPI.info;

export const selectGitLoading = (state: RootState) => state.gitAPI.loading;

export const selectGitError = (state: RootState) => state.gitAPI.error;
