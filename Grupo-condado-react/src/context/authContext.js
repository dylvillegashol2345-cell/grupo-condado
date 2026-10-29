import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

export const PERMISOS = {
  Administrador: [
    "inicio", "dashboard", "propiedades", "propietarios", "clientes",
    "operaciones", "contratos", "pagos", "consultas", "citas", "ecomarket",
    "usuarios", "ambiental", "perfil", "busqueda",
  ],
  Agente: [
    "inicio", "dashboard", "propiedades", "propietarios", "operaciones",
    "contratos", "pagos", "consultas", "citas", "ecomarket", "ambiental", "perfil", "busqueda",
  ],
  Cliente: [
    "inicio", "catalogo", "contratos", "pagos", "ecomarket", "consulta", "perfil",
  ],
  Invitado: ["inicio", "catalogo"],
};

export function puedeVer(rol, seccion) {
  const lista = PERMISOS[rol] || PERMISOS.Cliente;
  return Array.isArray(seccion) ? seccion.some((s) => lista.includes(s)) : lista.includes(seccion);
}
