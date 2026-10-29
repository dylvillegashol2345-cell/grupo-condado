import { useMemo, useState } from "react";
import { usuarios, cambiarRol } from "../services/entidades";
import { useCarga } from "../hooks/useCarga";
import { useAuth } from "../context/authContext";
import { useUI } from "../context/uiContext";
import { ROLES } from "../utils/catalogos";
import EmptyState from "../components/common/EmptyState";

const COLOR_ROL = { Administrador: "#6c2d20", Agente: "#1565c0", Cliente: "#2e7d32" };

function Usuarios() {
  const { usuario: yo } = useAuth();
  const { toast, confirmar } = useUI();
  const [busqueda, setBusqueda] = useState(null);
  const [ocupado, setOcupado] = useState(null);

  const { datos, cargando, error, recargar } = useCarga(
    async () => (await usuarios.listar()).sort((a, b) => a.IdUsuario - b.IdUsuario),
    []
  );
  const lista = useMemo(() => datos || [], [datos]);

  const filtrada = useMemo(() => {
    const q = (busqueda || "").trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((u) =>
      [u.Nombre, u.Email, u.Rol].join(" ").toLowerCase().includes(q)
    );
  }, [lista, busqueda]);

  async function onCambiarRol(u, nuevoRol) {
    if (nuevoRol === u.Rol) return;
    setOcupado(u.IdUsuario);
    try {
      await cambiarRol(u.IdUsuario, nuevoRol);
      toast(`✅ Rol cambiado a ${nuevoRol}`, "ok");
      recargar();
    } catch {
      toast("❌ Error al cambiar rol", "error");
    } finally {
      setOcupado(null);
    }
  }

  async function eliminar(u) {
    const ok = await confirmar({
      variante: "borrado",
      titulo: "Eliminar usuario",
      descripcion: `¿Seguro que querés eliminar a "${u.Nombre || ""}"? Esta acción no se puede deshacer.`,
    });
    if (!ok) return;
    try {
      await usuarios.eliminar(u.IdUsuario);
      toast("Usuario eliminado", "warn");
      recargar();
    } catch {
      toast("❌ Error al eliminar", "error");
    }
  }

  let filas;
  if (cargando) {
    filas = (
      <tr><td colSpan={5} className="text-center p-4">
        <i className="fa fa-spinner fa-spin me-2" style={{ color: "var(--condado)" }} />Cargando...
      </td></tr>
    );
  } else if (error) {
    filas = <tr><td colSpan={5} className="text-center text-danger">Error al cargar usuarios</td></tr>;
  } else if (lista.length === 0) {
    filas = (
      <tr><td colSpan={5}>
        <EmptyState icono="fa-users" titulo="Sin usuarios" descripcion="No hay usuarios registrados." />
      </td></tr>
    );
  } else {
    filas = filtrada.map((u) => {
      const esYo = yo && yo.IdUsuario === u.IdUsuario;
      const color = COLOR_ROL[u.Rol];
      return (
        <tr key={u.IdUsuario} className="tabla-fila-moderna">
          <td>
            <div className="tabla-persona">
              <div className="tabla-avatar" style={{ background: `linear-gradient(135deg,${color || "#6c2d20"},#b35e4e)` }}>
                {(u.Nombre || "?")[0].toUpperCase()}
              </div>
              <div>
                <strong>{u.Nombre || "—"}</strong>{" "}
                {esYo && <small style={{ color: "var(--condado)", fontWeight: 600 }}>← vos</small>}
              </div>
            </div>
          </td>
          <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{u.Email || "—"}</td>
          <td>
            <span className="tabla-badge" style={{ background: `${color || "#888"}20`, color: color || "#888" }}>
              {u.Rol || "—"}
            </span>
          </td>
          <td>
            {esYo ? (
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Tu cuenta</span>
            ) : (
              <select
                className="form-select form-select-sm"
                style={{ maxWidth: 150, fontSize: 12 }}
                value={u.Rol || ""}
                disabled={ocupado === u.IdUsuario}
                onChange={(e) => onCambiarRol(u, e.target.value)}
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
          </td>
          <td className="tabla-acciones">
            {!esYo && (
              <button className="tabla-btn-del" title="Eliminar" onClick={() => eliminar(u)}>
                <i className="fa fa-trash" />
              </button>
            )}
          </td>
        </tr>
      );
    });
  }

  return (
    <section className="card-ghost mt-3" id="usuariosAdmin">
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h5 className="mb-0"><i className="fa fa-users-cog me-2" />Gestión de Usuarios</h5>
        <button className="btn btn-condado btn-sm" onClick={recargar}>
          <i className="fa fa-sync me-1" />Actualizar
        </button>
      </div>
      <p className="text-muted" style={{ fontSize: 13, marginBottom: "1.25rem" }}>
        Administrá los usuarios del sistema: cambiá roles o eliminá cuentas inactivas.
      </p>
      <div className="tabla-search-bar">
        <div className="tabla-search-input">
          <i className="fa fa-search" />
          <input
            type="text"
            id="buscar_usuarios"
            className="form-control form-control-sm"
            placeholder="Buscar usuarios..."
            value={busqueda || ""}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <span id="count_usuarios" className="tabla-count">
          {busqueda !== null && `${filtrada.length} resultado${filtrada.length !== 1 ? "s" : ""}`}
        </span>
      </div>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol actual</th>
              <th>Cambiar rol</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody id="listadoUsuarios">{filas}</tbody>
        </table>
      </div>
    </section>
  );
}

export default Usuarios;
