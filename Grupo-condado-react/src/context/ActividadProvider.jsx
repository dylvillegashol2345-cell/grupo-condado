import { useCallback, useMemo, useState } from "react";
import { ActividadContext } from "./actividadContext";

const MAXIMO = 10;

function ActividadProvider({ children }) {
  const [actividad, setActividad] = useState([]);

  const registrar = useCallback((accion, detalle, icono = "fa-circle") => {
    setActividad((prev) => [{ accion, detalle, icono, hora: new Date() }, ...prev].slice(0, MAXIMO));
  }, []);

  const limpiar = useCallback(() => setActividad([]), []);

  const valor = useMemo(() => ({ actividad, registrar, limpiar }), [actividad, registrar, limpiar]);

  return <ActividadContext.Provider value={valor}>{children}</ActividadContext.Provider>;
}

export default ActividadProvider;
