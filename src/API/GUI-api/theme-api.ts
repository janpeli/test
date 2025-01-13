//localStorage.setItem(storageKey, theme);

import { setTheme as setThemeReducer, Theme } from "./theme.slice";

export function AddThemeClassToRoot(theme: Theme) {
  const root = window.document.documentElement;

  root.classList.remove("light", "dark");

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";

    root.classList.add(systemTheme);
    return;
  }

  root.classList.add(theme);
}

export function getThemeFromStorage() {
  const storage = localStorage.getItem("vite-ui-theme");
  const _theme = storage === "dark" || storage === "light" ? storage : "system";
  return _theme;
}

export function setTheme(theme: Theme) {
  localStorage.setItem("vite-ui-theme", theme);
  setThemeReducer(theme);
  AddThemeClassToRoot(theme);
}
