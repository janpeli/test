import { store } from "@/app/store";
import {
  addErrorListMessage,
  addOutputListMessage,
  setActiveList,
  togglePanel,
} from "./status-panel.slice";

export const setActivePanel = (list: "Output" | "Error") => {
  store.dispatch(setActiveList(list));
};

export const toggleStatusPanel = () => {
  store.dispatch(togglePanel());
};

export const addErrorMessage = (
  message: string,
  type: "info" | "warning" | "error" = "warning"
) => {
  store.dispatch(addErrorListMessage({ type, message }));
};

export const addOutputMessage = (message: string) => {
  store.dispatch(addOutputListMessage(message));
};
