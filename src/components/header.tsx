import { ModeToggle } from "./mode-toggle";
import HeaderMenu from "@/features/HeaderMenu/header-menu";

const Header = () => {
  return (
    <div className="flex justify-between items-center h-10 border-b-1 border">
      <HeaderMenu />
      <ModeToggle></ModeToggle>
    </div>
  );
};

export default Header;
