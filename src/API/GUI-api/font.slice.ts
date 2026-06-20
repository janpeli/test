import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { getFontFromStorage } from "./font-api";

/** App UI font choice. `inter` = Inter + JetBrains Mono; `plex` = IBM Plex. */
export type AppFont = "inter" | "plex";

interface FontState {
  font: AppFont;
}

const initialState: FontState = {
  font: getFontFromStorage(),
};

export const fontSlice = createSlice({
  name: "font",
  initialState,
  reducers: {
    setFont: (state, action: PayloadAction<AppFont>) => {
      state.font = action.payload;
    },
  },
});

export const { setFont } = fontSlice.actions;

export const selectFont = (state: RootState) => state.fontAPI.font;

export default fontSlice.reducer;
