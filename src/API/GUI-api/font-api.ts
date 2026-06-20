import { store } from "@/app/store";
import { setFont as setFontReducer, AppFont } from "./font.slice";

/**
 * Applies the font choice as a class on <html>. `plex` adds `font-plex`
 * (overrides the --app-font-* vars in globals.css); `inter` removes it so the
 * default Inter/JetBrains stack applies. Mirrors the theme class pattern.
 */
export function AddFontClassToRoot(font: AppFont) {
  const root = window.document.documentElement;
  root.classList.toggle("font-plex", font === "plex");
}

export function getFontFromStorage(): AppFont {
  const storage = localStorage.getItem("vite-ui-font");
  return storage === "plex" ? "plex" : "inter";
}

export function setFont(font: AppFont) {
  localStorage.setItem("vite-ui-font", font);
  store.dispatch(setFontReducer(font));
  AddFontClassToRoot(font);
}
