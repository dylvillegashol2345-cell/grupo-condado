import { useMemo } from "react";
import { useCarga } from "./useCarga";
import { citas, propiedades, clientes, usuarios } from "../services/entidades";
import { mapPropiedad } from "../services/propiedadesService";

export function useDatosCitas() {
  const { datos, cargando, error, recargar } = useCarga(async () => {
    const [c, p, cl, u] = await Promise.all([
      citas.listar(),
      propiedades.listar().then((l) => l.map(mapPropiedad)),
      clientes.listar().catch(() => []),
      usuarios.listar().catch(() => []),
    ]);
    return { citas: c, propiedades: p, clientes: cl, agentes: u.filter((x) => x.Rol === "Administrador" || x.Rol === "Agente") };
  }, []);

  const vacio = useMemo(() => ({ citas: [], propiedades: [], clientes: [], agentes: [] }), []);
  return { ...(datos || vacio), cargando, error, recargar };
}
