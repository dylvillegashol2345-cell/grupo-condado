import { useState } from "react";
import AppRoutes from "./routes/AppRoutes";
import AuthProvider from "./context/AuthProvider";
import ThemeProvider from "./context/ThemeProvider";
import UIProvider from "./context/UIProvider";
import ActividadProvider from "./context/ActividadProvider";
import Splash from "./components/common/Splash";

function App() {
  const [splash, setSplash] = useState(true);

  return (
    <ThemeProvider>
      <UIProvider>
        <AuthProvider>
          <ActividadProvider>
            <AppRoutes />
            {splash && <Splash modo="inicio" onFin={() => setSplash(false)} />}
          </ActividadProvider>
        </AuthProvider>
      </UIProvider>
    </ThemeProvider>
  );
}

export default App;
