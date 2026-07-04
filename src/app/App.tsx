import Footer from "@/components/footer";
import Header from "@/components/header";
import MainArea from "@/components/main-area";
import { Provider } from "react-redux";
import { store } from "@/app/store";
import { TooltipProvider } from "@/components/ui/tooltip";
import Modals from "@/features/Modals/modals";
import GlobalShortcuts from "@/features/Shortcuts/global-shortcuts";
import CommandPalette from "@/features/CommandPalette/command-palette";
import UnsavedChangesGuard from "./unsaved-changes-guard";

export default function App() {
  return (
    <>
      <Provider store={store}>
        <TooltipProvider>
          <GlobalShortcuts />
          <UnsavedChangesGuard />
          <Header />
          <MainArea />
          <Footer />
          <Modals />
          <CommandPalette />
        </TooltipProvider>
      </Provider>
    </>
  );
}
