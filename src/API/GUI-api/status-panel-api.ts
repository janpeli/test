import { store } from "@/app/store";
import { setActiveList, togglePanel } from "./status-panel.slice";

export const setActivePanel = (list: "Output" | "Error") => {
  store.dispatch(setActiveList(list));
};

export const toggleStatusPanel = () => {
  store.dispatch(togglePanel());
};
