import { useMemo, useRef, useState } from "react";
import { operaciones, propiedades, clientes, usuarios } from "../services/entidades";
import { useCarga } from "../hooks/useCarga";
import { useUI } from "../context/uiContext";
import { useActividad } from "../context/actividadContext";
import { propiedadDisponible, estadoSegunOperacion } from "../utils/reglas";
import { direccion, fechaCorta, fechaInput } from "../utils/format";
import { formatDireccion } from "../utils/contratos";
import { exportarExcel, COLUMNAS_EXCEL } from "../utils/excel";
import SearchSelect from "../components/common/SearchSelect";
import Modal from "../components/common/Modal";
import ErrorBanner from "../components/common/ErrorBanner";
import Paginacion from "../components/common/Paginacion";
import { paginar } from "../utils/paginacion";
import { SkeletonFilas } from "../components/common/Loader";

const VACIO = { IdPropiedad: "", IdCliente: "", IdUsuario: "", Tipo: "Venta", Fecha: "" };

const PESTANAS = [
  { valor: "todas", label: "Todas", icono: "fa-list" },
  { valor: "alquiler", label: "Alquileres", icono: "fa-key" },
  { valor: "venta", label: "Ventas", icono: "fa-home" },
];

function validar(body) {
  if (body.IdPropiedad <= 0) return "Debe ingresar una propiedad";
  if (body.IdCliente <= 0)   return "Debe ingresar un cliente";
  if (body.IdUsuario <= 0)   return "Debe ingresar un usuario";
  if (!body.Fecha)           return "Debe ingresar una fecha";
  if (!body.Tipo)            return "Debe seleccionar el tipo de operación";
  return null;
}

function tipoCorto(idTipo) {
  return idTipo === 1 ? "Casa" : idTipo === 2 ? "Dpto" : idTipo === 3 ? "Lote" : "Terreno";
}

function TipoBadge({ tipo }) {
  return tipo === "Venta" ? (
    <span style={{ background: "#fce4ec", color: "#880e4f", fontSize: 11, fontWeight: 700, padding: ".2em .7em", borderRadius: 8 }}>
      <i className="fa fa-home me-1" />Venta
    </span>
  ) : (
    <span style={{ background: "#e3f2fd", color: "#1565c0", fontSize: 11, fontWeight: 700, padding: ".2em .7em", borderRadius: 8 }}>
      <i className="fa fa-key me-1" />Alquiler
    </span>
  );
}

function Operaciones() {
  const { toast, confirmar } = useUI();
  const { registrar } = useActividad();
  const [form, setForm] = useState(VACIO);
  const [mensaje, setMensaje] = useState(null);
  const timerMensaje = useRef(null);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [pestana, setPestana] = useState("todas");
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState(null);

  const { datos, cargando, error: errorCarga, recargar } = useCarga(async () => {
    const [ops, props, clis, usus] = await Promise.all([
      operaciones.listar(),
      propiedades.listar(),
      clientes.listar(),
      usuarios.listar(),
    ]);
    return {
      ops: ops.sort((a, b) => Number(b.IdOperacion) - Number(a.IdOperacion)),
      props,
      clis,
      usus,
    };
  }, []);

  const { ops = [], props = [], clis = [], usus = [] } = datos || {};

  const mapaProps = useMemo(() => new Map(props.map((p) => [p.IdPropiedad, p])), [props]);
  const mapaClis = useMemo(() => new Map(clis.map((c) => [c.IdCliente, c])), [clis]);
  const mapaUsus = useMemo(() => new Map(usus.map((u) => [u.IdUsuario, u])), [usus]);

  const opcionesPropiedad = useMemo(
    () =>
      props
        .filter((p) => p.Estado === "Disponible")
        .map((p) => ({
          value: p.IdPropiedad,
          label: formatDireccion(p),
          sub: `${p.Estado} · $${Number(p.Precio || 0).toLocaleString("es-AR")} · ${tipoCorto(p.IdTipo)}`,
        })),
    [props]
  );

  const opcionesPropiedadTodas = useMemo(
    () => props.map((p) => ({
      value: p.IdPropiedad,
      label: formatDireccion(p),
      sub: `${p.Estado} · ${tipoCorto(p.IdTipo)}`,
    })),
    [props]
  );

  const opcionesCliente = useMemo(
    () => clis.map((c) => ({
      value: c.IdCliente,
      label: `${c.Apellido || ""} ${c.Nombre || ""}`.trim() || "Cliente sin nombre",
      sub: c.Telefono ? `Tel: ${c.Telefono}` : "",
    })),
    [clis]
  );

  const opcionesUsuario = useMemo(
    () => usus.map((u) => ({
      value: u.IdUsuario,
      label: u.Nombre || "Usuario sin nombre",
      sub: u.Rol || "",
    })),
    [usus]
  );

  const filas = useMemo(() => {
    const porTipo = pestana === "alquiler" ? ops.filter((o) => o.Tipo === "Alquiler")
      : pestana === "venta" ? ops.filter((o) => o.Tipo === "Venta")
      : ops;
    return porTipo.map((o) => {
      const prop = mapaProps.get(o.IdPropiedad) || {};
      const cli = mapaClis.get(o.IdCliente) || {};
      const usu = mapaUsus.get(o.IdUsuario) || {};
      return {
        o,
        prop: prop.Barrio ? direccion(prop.Barrio, prop.Calle, prop.Numeracion) : `Propiedad ${o.IdPropiedad || "—"}`,
        cli: cli.Nombre ? `${cli.Apellido || ""} ${cli.Nombre || ""}`.trim() : "—",
        usu: usu.Nombre || "—",
        fecha: fechaCorta(o.Fecha),
      };
    });
  }, [ops, pestana, mapaProps, mapaClis, mapaUsus]);

  const visibles = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return filas;
    return filas.filter((f) => [f.o.Tipo, f.prop, f.cli, f.usu, f.fecha].join(" ").toLowerCase().includes(q));
  }, [filas, busqueda]);

  const pagVisibles = paginar(visibles, pagina);

  const contador = busqueda
    ? `${visibles.length} resultado${visibles.length !== 1 ? "s" : ""}`
    : `${filas.length} operaci${filas.length !== 1 ? "ones" : "ón"}`;

  function set(clave, valor) {
    setForm((f) => ({ ...f, [clave]: valor }));
  }

  function mostrarMensaje(texto, lugar) {
    clearTimeout(timerMensaje.current);
    setMensaje({ texto, lugar });
    timerMensaje.current = setTimeout(() => setMensaje(null), 3000);
  }

  async function crear() {
    const body = {
      IdPropiedad: Number(form.IdPropiedad) || 0,
      IdCliente: Number(form.IdCliente) || 0,
      IdUsuario: Number(form.IdUsuario) || 0,
      Fecha: form.Fecha || "",
      Tipo: form.Tipo || "",
    };

    const problema = validar(body);
    if (problema) { mostrarMensaje("❌ " + problema, "form"); return; }

    const propiedad = mapaProps.get(body.IdPropiedad);
    if (!propiedadDisponible(propiedad)) {
      mostrarMensaje("❌ La propiedad ya no está disponible", "seccion");
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await operaciones.crear(body);
      if (typeof respuesta === "string" && respuesta.trim().toUpperCase() !== "OK") {
        throw new Error(respuesta);
      }

      const nuevoEstado = estadoSegunOperacion(body.Tipo);
      await propiedades.actualizar(body.IdPropiedad, { ...propiedad, Estado: nuevoEstado });

      const propTexto = opcionesPropiedad.find((o) => o.value === body.IdPropiedad)?.label || "la propiedad";
      const cliTexto = opcionesCliente.find((o) => o.value === body.IdCliente)?.label || "el cliente";
      toast(`✅ ${body.Tipo} registrada — "${propTexto}" pasó a estado ${nuevoEstado}`, "ok", 5000);
      registrar(`${body.Tipo} registrada`, `${propTexto} → ${cliTexto}`, "fa-handshake");

      setForm(VACIO);
      recargar();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      mostrarMensaje("❌ Error al guardar operación", "seccion");
    } finally {
      setGuardando(false);
    }
  }

  async function guardarEdicion() {
    const body = {
      IdOperacion: editando.IdOperacion,
      IdPropiedad: Number(editando.IdPropiedad),
      IdCliente: Number(editando.IdCliente),
      IdUsuario: Number(editando.IdUsuario),
      Fecha: editando.Fecha,
      Tipo: editando.Tipo,
    };
    try {
      await operaciones.actualizar(editando.IdOperacion, body);
      setEditando(null);
      recargar();
      toast("✏️ Operación actualizada", "ok");
    } catch (err) {
      toast(err.message || "No se pudo actualizar", "error");
    }
  }

  async function eliminar(o) {
    const ok = await confirmar({
      titulo: "¿Eliminar este registro?",
      descripcion: "¿Seguro que querés eliminar esta operación?",
      textoConfirmar: "Eliminar",
    });
    if (!ok) return;
    try {
      await operaciones.eliminar(o.IdOperacion);
      recargar();
      toast("Operación eliminada", "warn");
    } catch (err) {
      toast(err.message || "No se pudo eliminar (puede tener contratos asociados)", "error");
    }
  }

  function exportar() {
    try {
      exportarExcel(ops, COLUMNAS_EXCEL.operaciones, "Operaciones");
      toast("✅ Operaciones exportado correctamente", "ok");
    } catch (err) {
      toast(err.message, "error");
    }
  }

  const alerta = (lugar) =>
    mensaje?.lugar === lugar && <div className="alertaMsg alertaRoja">{mensaje.texto}</div>;

  return (
    <section className="card-ghost mt-3" id="operacionesForm">
      {alerta("seccion")}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0"><i className="fa fa-handshake me-2" />Registrar Operación</h5>
        <button className="btn btn-light btn-sm" onClick={exportar} title="Exportar Excel">
          <i className="fa fa-file-excel me-1" style={{ color: "#2e7d32" }} />Excel
        </button>
      </div>

      <ErrorBanner mensaje={errorCarga} onReintentar={recargar} />

      <form className="row g-3" onSubmit={(e) => e.preventDefault()}>
        <div className="col-md-4">
          <label className="form-label">Propiedad</label>
          <SearchSelect
            icono="fa-home"
            value={form.IdPropiedad}
            onChange={(v) => set("IdPropiedad", v)}
            opciones={opcionesPropiedad}
            placeholder="Buscar propiedad..."
          />
        </div>

        <div className="col-md-4">
          <label className="form-label">Cliente</label>
          <SearchSelect
            icono="fa-user"
            value={form.IdCliente}
            onChange={(v) => set("IdCliente", v)}
            opciones={opcionesCliente}
            placeholder="Buscar cliente..."
          />
        </div>

        <div className="col-md-4">
          <label className="form-label">Agente responsable</label>
          <SearchSelect
            icono="fa-user-tie"
            value={form.IdUsuario}
            onChange={(v) => set("IdUsuario", v)}
            opciones={opcionesUsuario}
            placeholder="Buscar agente..."
          />
        </div>

        <div className="col-md-3">
          <label className="form-label">Tipo de operación</label>
          <select className="form-select" value={form.Tipo} onChange={(e) => set("Tipo", e.target.value)}>
            <option value="Venta">Venta</option>
            <option value="Alquiler">Alquiler</option>
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label">Fecha</label>
          <input className="form-control" type="date" value={form.Fecha} onChange={(e) => set("Fecha", e.target.value)} />
        </div>

        <div className="col-12 text-end">
          <button className="btn btn-condado" type="button" onClick={crear} disabled={guardando}>
            {guardando
              ? <><i className="fa fa-spinner fa-spin me-1" />Guardando...</>
              : <><i className="fa fa-save me-1" />Guardar operación</>}
          </button>
        </div>
        <div className="col-12">{alerta("form")}</div>
      </form>

      <hr />

      <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
        {PESTANAS.map((p) => (
          <button
            key={p.valor}
            className={`btn btn-sm ${pestana === p.valor ? "btn-condado" : "btn-light"}`}
            style={pestana === p.valor ? undefined : { border: "1px solid var(--border)" }}
            onClick={() => { setPestana(p.valor); setPagina(1); }}
          >
            <i className={`fa ${p.icono} me-1`} />{p.label}
          </button>
        ))}
        <div className="tabla-search-input ms-auto">
          <i className="fa fa-search" />
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Buscar operaciones..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          />
        </div>
        <span className="tabla-count">{cargando ? "" : contador}</span>
      </div>

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Tipo</th><th>Propiedad</th><th>Cliente</th>
              <th>Agente</th><th>Fecha</th><th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <SkeletonFilas columnas={6} />
            ) : filas.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted p-4">
                  No hay operaciones de {pestana === "alquiler" ? "alquiler" : pestana === "venta" ? "venta" : "ningún tipo"} registradas
                </td>
              </tr>
            ) : (
              pagVisibles.map(({ o, prop, cli, usu, fecha }) => (
                <tr key={o.IdOperacion} className="tabla-fila-moderna">
                  <td><TipoBadge tipo={o.Tipo} /></td>
                  <td>
                    <i className="fa fa-home me-1" style={{ color: "var(--text-muted)", fontSize: 12 }} />
                    <span style={{ fontSize: 13 }}>{prop}</span>
                  </td>
                  <td>
                    <i className="fa fa-user me-1" style={{ color: "var(--text-muted)", fontSize: 12 }} />
                    <span style={{ fontSize: 13 }}>{cli}</span>
                  </td>
                  <td>
                    <i className="fa fa-user-tie me-1" style={{ color: "var(--text-muted)", fontSize: 12 }} />
                    <span style={{ fontSize: 13 }}>{usu}</span>
                  </td>
                  <td style={{ fontSize: 13 }}>{fecha}</td>
                  <td className="tabla-acciones">
                    <button className="tabla-btn-edit" onClick={() => setEditando({ ...o, Fecha: fechaInput(o.Fecha) })}>
                      <i className="fa fa-pen" />
                    </button>
                    <button className="tabla-btn-del" onClick={() => eliminar(o)}>
                      <i className="fa fa-trash" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Paginacion total={visibles.length} pagina={pagina} onCambio={setPagina} />

      <Modal
        abierto={Boolean(editando)}
        titulo="Editar Operación"
        onCerrar={() => setEditando(null)}
        ancho={700}
        pie={
          <>
            <button className="btn btn-light" onClick={() => setEditando(null)}>Cancelar</button>
            <button className="btn btn-condado" onClick={guardarEdicion}>
              <i className="fa fa-save me-1" />Guardar cambios
            </button>
          </>
        }
      >
        {editando && (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Propiedad</label>
              <SearchSelect
                icono="fa-home"
                value={editando.IdPropiedad ?? ""}
                onChange={(v) => setEditando({ ...editando, IdPropiedad: v })}
                opciones={opcionesPropiedadTodas}
                placeholder="Buscar propiedad..."
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Cliente</label>
              <SearchSelect
                icono="fa-user"
                value={editando.IdCliente ?? ""}
                onChange={(v) => setEditando({ ...editando, IdCliente: v })}
                opciones={opcionesCliente}
                placeholder="Buscar cliente..."
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Agente responsable</label>
              <SearchSelect
                icono="fa-user-tie"
                value={editando.IdUsuario ?? ""}
                onChange={(v) => setEditando({ ...editando, IdUsuario: v })}
                opciones={opcionesUsuario}
                placeholder="Buscar agente..."
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={editando.Tipo === "Alquiler" ? "Alquiler" : "Venta"}
                onChange={(e) => setEditando({ ...editando, Tipo: e.target.value })}>
                <option>Venta</option>
                <option>Alquiler</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Fecha</label>
              <input className="form-control" type="date" value={editando.Fecha || ""}
                onChange={(e) => setEditando({ ...editando, Fecha: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

export default Operaciones;
