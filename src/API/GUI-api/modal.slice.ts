import { RootState } from "@/app/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ModalState = {
  isOpen: boolean;
  type: string;
  id?: string;
  // Multi-item delete target (delete-confirm modal). Left undefined for every
  // other modal type, which keep using the single `id` field.
  ids?: string[];
};

const initialState: ModalState = {
  isOpen: false,
  type: "create-object",
};

export const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    openModal: (
      state,
      action: PayloadAction<{ type: string; id?: string; ids?: string[] }>
    ) => {
      state.isOpen = true;
      state.type = action.payload.type;
      state.id = action.payload.id;
      state.ids = action.payload.ids;
    },
    closeModal: (state) => {
      state.isOpen = false;
      state.type = "create-object";
      state.id = undefined;
      state.ids = undefined;
    },
  },
});

export const selectModalState = (state: RootState) => state.modalAPI;

export const { openModal, closeModal } = modalSlice.actions;
export default modalSlice.reducer;
