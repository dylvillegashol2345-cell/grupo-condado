import { createContext, useContext } from "react";

export const ActividadContext = createContext(null);

export function useActividad() {
  const ctx = useContext(ActividadContext);
  if (!ctx) throw new Error("useActividad debe usarse dentro de <ActividadProvider>");
  return ctx;
}
