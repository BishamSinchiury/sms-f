import AppRouter from "@/router/index";
import { ToastProvider } from "@/components/ui/Toast";

const App = () => {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
};

export default App;