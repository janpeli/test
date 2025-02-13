import { store } from "@/app/store";
import { closeModal, openModal } from "./modal.slice";

export const closeModals = () => store.dispatch(closeModal());

export const openModals = async (title: string, content: React.ReactNode) => {
  store.dispatch(openModal({ title, content }));
};
