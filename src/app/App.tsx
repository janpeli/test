// import AppHeader from "../components/AppHeader";
// import MainArea from "../components/MainArea";
import { ModeToggle } from "@/components/mode-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

const App: React.FC = () => {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="flex justify-between items-center h-10 border-b-1 border">
          <Button variant={"ghost"} size={"sm"}>
            Secondary
          </Button>
          <ModeToggle></ModeToggle>
        </div>
      </ThemeProvider>
    </>
  );
};

export default App;
