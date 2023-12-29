import MainSidebar from "@/features/MainSidebar/main-sidebar";
import RailMenu from "@/features/RailMenu/rail-menu";

export default function MainArea() {


  return (
    <div
      className="flex flex-row overflow-hidden flex-nowrap h-screen"
    >
      <RailMenu />
      <MainSidebar />
      <div className="flex-1"> MainArea something</div>
    </div>
  );
}
