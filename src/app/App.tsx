// import AppHeader from "../components/AppHeader";
// import MainArea from "../components/MainArea";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

const App: React.FC = () => {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Header></Header>
      </ThemeProvider>
    </>
  );
};

export default App;
