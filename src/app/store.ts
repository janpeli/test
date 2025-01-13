import { configureStore } from "@reduxjs/toolkit";
import { mainSidebarSlice } from "@/API/GUI-api/main-sidebar.slice";
import { projectAPISlice } from "@/API/project-api/project-api.slice";
import { editorAPISlice } from "@/API/editor-api/editor-api.slice";
import { themeSlice } from "@/API/GUI-api/theme.slice";
// ...

export const store = configureStore({
  reducer: {
    mainSidebar: mainSidebarSlice.reducer,
    projectAPI: projectAPISlice.reducer,
    editorAPI: editorAPISlice.reducer,
    themeAPI: themeSlice.reducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
