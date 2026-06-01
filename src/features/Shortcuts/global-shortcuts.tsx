import { useGlobalShortcuts } from "@/lib/shortcuts/use-global-shortcuts";

/**
 * Headless component that installs the global keyboard-shortcut listener.
 * Mounted once inside the Redux Provider in App.tsx.
 */
export default function GlobalShortcuts() {
  useGlobalShortcuts();
  return null;
}
