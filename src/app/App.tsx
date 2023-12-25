import Footer from "@/components/footer";
import Header from "@/components/header";
import MainArea from "@/components/main-area";
import { ThemeProvider } from "@/components/theme-provider";
import { Provider } from "react-redux";
import { store } from "@/app/store";

export default function App() {
  return (
    <>
      <Provider store={store}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <div className="fixed inset-0 flex flex-col h-screen w-screen">
            <Header />
            <MainArea />
            <Footer />
          </div>
        </ThemeProvider>
      </Provider>
    </>
  );
}
