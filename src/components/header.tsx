import ProjectPicker from "@/features/ProjectPicker/project-picker";
import { ThemePicker } from "@/features/ThemePicker/theme-picker";
import HeaderMenu from "@/features/HeaderMenu/header-menu";

export default function Header() {
  return (
    <header className="flex flex-row justify-between items-center h-10 border-b p-0 flex-shrink-0">
      <span className="h-9 flex flex-row justify-start items-center">
        <HeaderMenu />
        <ProjectPicker />
      </span>
      <ThemePicker />
    </header>
  );
}
