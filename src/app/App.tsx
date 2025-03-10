import Footer from "@/components/footer";
import Header from "@/components/header";
import MainArea from "@/components/main-area";
import { Provider } from "react-redux";
import { store } from "@/app/store";
import { TooltipProvider } from "@/components/ui/tooltip";
import Modals from "@/features/Modals/modals";

export default function App() {
  return (
    <>
      <Provider store={store}>
        <TooltipProvider>
          <Header />
          <MainArea />
          <Footer />
          <Modals />
        </TooltipProvider>
      </Provider>
    </>
  );
}
