import MainSidebar from "@/features/MainSidebar/main-sidebar";
import RailMenu from "@/features/RailMenu/rail-menu";

export default function MainArea() {
  return (
    <div className="flex-1 flex flex-row">
      <RailMenu />
      <MainSidebar />
      <div className="flex-1"> MainArea something</div>
    </div>
  );
}
