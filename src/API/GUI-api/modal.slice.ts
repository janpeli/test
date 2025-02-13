import { RootState } from "@/app/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ModalState = {
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
};

const initialState: ModalState = {
  isOpen: false,
  title: "",
  content: null,
};

export const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    openModal: (
      state,
      action: PayloadAction<{ title: string; content: React.ReactNode }>
    ) => {
      state.isOpen = true;
      state.title = action.payload.title;
      state.content = action.payload.content;
    },
    closeModal: (state) => {
      state.isOpen = false;
      state.title = "";
      state.content = null;
    },
  },
});

export const selectModalState = (state: RootState) => state.modalAPI;

export const { openModal, closeModal } = modalSlice.actions;
export default modalSlice.reducer;
