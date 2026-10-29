import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./themeContext";

const CLAVE = "darkMode";

function ThemeProvider({ children }) {
  const [oscuro, setOscuro] = useState(() => localStorage.getItem(CLAVE) === "1");

  useEffect(() => {
    document.body.classList.toggle("dark-mode", oscuro);
    localStorage.setItem(CLAVE, oscuro ? "1" : "0");
  }, [oscuro]);

  const alternar = useCallback(() => setOscuro((v) => !v), []);

  const valor = useMemo(() => ({ oscuro, alternar }), [oscuro, alternar]);

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>;
}

export default ThemeProvider;
