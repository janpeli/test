import ContentArea from "@/features/ContentArea/content-area";
import MainSidebar from "@/features/MainSidebar/main-sidebar";
import RailMenu from "@/features/RailMenu/rail-menu";

export default function MainArea() {
  return (
    <div className="flex flex-1 min-h-0">
      <RailMenu />
      <MainSidebar />
      <ContentArea />
    </div>
  );
}
