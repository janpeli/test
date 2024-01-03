import MainSidebar from "@/features/MainSidebar/main-sidebar";
import RailMenu from "@/features/RailMenu/rail-menu";
import { useEffect, useState } from "react";

export default function MainArea() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      className="flex flex-row overflow-hidden flex-nowrap"
      style={{
        width: windowSize.width,
        height: windowSize.height - 60,
      }}
    >
      <RailMenu />
      <MainSidebar />
      <div className="flex-1"> MainArea something</div>
    </div>
  );
}
