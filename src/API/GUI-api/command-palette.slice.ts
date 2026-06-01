import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";

interface CommandPaletteState {
  isOpen: boolean;
}

const initialState: CommandPaletteState = {
  isOpen: false,
};

export const commandPaletteSlice = createSlice({
  name: "commandPalette",
  initialState,
  reducers: {
    openCommandPalette: (state) => {
      state.isOpen = true;
    },
    closeCommandPalette: (state) => {
      state.isOpen = false;
    },
    toggleCommandPalette: (state) => {
      state.isOpen = !state.isOpen;
    },
  },
});

export const { openCommandPalette, closeCommandPalette, toggleCommandPalette } =
  commandPaletteSlice.actions;

export const selectCommandPaletteOpen = (state: RootState) =>
  state.commandPalette.isOpen;

export default commandPaletteSlice.reducer;
