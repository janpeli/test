import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { getThemeFromStorage } from "./theme-api";

export type Theme = "dark" | "light" | "system";

// Define a type for the slice state
interface ThemeState {
  theme: Theme;
}

// Define the initial state using that type
const initialState: ThemeState = {
  theme: getThemeFromStorage(),
};

export const themeSlice = createSlice({
  name: "theme",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
  },
});

export const { setTheme } = themeSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectTheme = (state: RootState) => state.themeAPI.theme;

export default themeSlice.reducer;
