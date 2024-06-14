import { configureStore } from "@reduxjs/toolkit";
import { mainSidebarSlice } from "@/features/MainSidebar/main-sidebar.slice";
import { projectAPISlice } from "@/API/project-api/project-api.slice";
import { editorAPISlice } from "@/API/editor-api/editor-api.slice";
// ...

export const store = configureStore({
  reducer: {
    mainSidebar: mainSidebarSlice.reducer,
    projectAPI: projectAPISlice.reducer,
    editorAPI: editorAPISlice.reducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
