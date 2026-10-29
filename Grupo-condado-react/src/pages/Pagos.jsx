import { useMemo, useRef, useState } from "react";
import { pagos, contratos, clientes, operaciones } from "../services/entidades";
import { useCarga } from "../hooks/useCarga";
import { pagosDelCliente } from "../utils/privacidad";
import { contratosConOperacion, contratosDelUsuario } from "../utils/contratos";
import { useUI } from "../context/uiContext";
import { useAuth } from "../context/authContext";
import { useActividad } from "../context/actividadContext";
import { fechaCorta, fechaInput, numero } from "../utils/format";
import { monto } from "../utils/restricciones";
import { exportarExcel, COLUMNAS_EXCEL } from "../utils/excel";
import SearchSelect from "../components/common/SearchSelect";
import { SelectorMoneda } from "../components/contratos/ContratoForm";
import Modal from "../components/common/Modal";
import Paginacion from "../components/common/Paginacion";
import { paginar } from "../utils/paginacion";
import ErrorBanner from "../components/common/ErrorBanner";
import EmptyState from "../components/common/EmptyState";
import { SkeletonFilas } from "../components/common/Loader";

const VACIO = { IdContrato: "", Moneda: "ARS", Monto: "", Fecha: "" };

function datosContrato(c) {
  if (!c) return { direccion: "Contrato sin datos", periodo: "", locatario: "" };
  return {
    direccion: c.InmuebleDireccion || (c.TipoContrato === "Venta" ? "Boleto de compraventa" : "Contrato de locación"),
    periodo: `${fechaCorta(c.FechaInicio)} al ${fechaCorta(c.FechaFin)}`,
    locatario: c.LocatarioNombre || "",
  };
}

function Pagos() {
  const { toast, confirmar } = useUI();
  const { usuario, rol } = useAuth();
  const { registrar } = useActividad();
  const esCliente = rol === "Cliente";

  const [form, setForm] = useState(VACIO);
  const [mensaje, setMensaje] = useState("");
  const timerMensaje = useRef(null);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroContrato, setFiltroContrato] = useState("");
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState(null);

  const { datos, cargando, error: errorCarga, recargar } = useCarga(async () => {
    const [pgs, cts, ops, clis] = await Promise.all([
      pagos.listar(),
      contratos.listar(),
      esCliente ? operaciones.listar() : Promise.resolve([]),
      esCliente ? clientes.listar() : Promise.resolve([]),
    ]);
    const ordenados = pgs.sort((a, b) =>
      String(fechaCorta(b.Fecha)).localeCompare(String(fechaCorta(a.Fecha))) || Number(b.IdPago) - Number(a.IdPago));
    return { pgs: ordenados, cts, ops, clis };
  }, [esCliente]);

  const { pgs: todos = [], cts = [], ops = [], clis = [] } = datos || {};

  const pgs = useMemo(() => {
    if (!esCliente) return todos;
    const mios = contratosDelUsuario(contratosConOperacion(cts, ops), clis, usuario);
    return pagosDelCliente(todos, mios);
  }, [esCliente, todos, cts, ops, clis, usuario]);

  const opcionesContrato = useMemo(
    () => cts.map((c) => ({
      value: c.IdContrato,
      label: `${c.LocatarioNombre || "Sin locatario"} · ${c.InmuebleDireccion || "—"}`,
      sub: `${fechaCorta(c.FechaInicio)} al ${fechaCorta(c.FechaFin)}`,
    })),
    [cts]
  );

  const contratoPorId = useMemo(() => new Map(cts.map((c) => [Number(c.IdContrato), c])), [cts]);

  const contratosConPagos = useMemo(() => {
    const cantidad = new Map();
    pgs.forEach((p) => cantidad.set(Number(p.IdContrato), (cantidad.get(Number(p.IdContrato)) || 0) + 1));
    return [...cantidad.keys()]
      .map((id) => ({ id, ...datosContrato(contratoPorId.get(id)), inicio: contratoPorId.get(id)?.FechaInicio || "", pagos: cantidad.get(id) }))
      .sort((a, b) => String(b.inicio).localeCompare(String(a.inicio)));
  }, [pgs, contratoPorId]);

  const filtrada = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pgs.filter((p) => {
      if (filtroContrato && Number(p.IdContrato) !== Number(filtroContrato)) return false;
      if (!q) return true;
      const c = datosContrato(contratoPorId.get(Number(p.IdContrato)));
      return [c.direccion, c.periodo, c.locatario, p.Moneda || "ARS",
        Number(p.Monto || 0).toLocaleString("es-AR"), fechaCorta(p.Fecha)]
        .join(" ").toLowerCase().includes(q);
    });
  }, [pgs, busqueda, filtroContrato, contratoPorId]);

  const visibles = paginar(filtrada, pagina);

  const totales = filtrada.reduce((t, p) => {
    t[p.Moneda === "USD" ? "USD" : "ARS"] += Number(p.Monto) || 0;
    return t;
  }, { ARS: 0, USD: 0 });

  function exportar() {
    try {
      const filas = filtrada.map((p) => {
        const c = datosContrato(contratoPorId.get(Number(p.IdContrato)));
        return { ...p, Contrato: `${c.direccion} (${c.periodo})`, Locatario: c.locatario };
      });
      exportarExcel(filas, COLUMNAS_EXCEL.pagosDetalle, esCliente ? "Mis pagos" : "Cobros");
      toast("✅ Exportado correctamente", "ok");
    } catch (err) {
      toast(err.message, "error");
    }
  }

  function buscar(texto) {
    setBusqueda(texto);
    setPagina(1);
  }

  function elegirContrato(id) {
    setFiltroContrato(id);
    setPagina(1);
  }

  async function crear() {
    const body = {
      Monto: form.Monto || "",
      Fecha: form.Fecha || "",
      IdContrato: form.IdContrato || "",
      Moneda: form.Moneda,
    };
    if (!body.IdContrato) { toast("❌ Seleccioná un contrato", "error"); return; }
    if (!body.Monto || Number(body.Monto) <= 0) { toast("❌ Ingresá un monto válido", "error"); return; }
    if (!body.Fecha) { toast("❌ Ingresá la fecha del pago", "error"); return; }
    body.Monto = Number(body.Monto);
    body.IdContrato = Number(body.IdContrato);

    setGuardando(true);
    try {
      await pagos.crear(body);
      toast("✅ Pago creado", "ok");
      registrar("Pago registrado", "$" + Number(body.Monto || 0).toLocaleString("es-AR"), "fa-money-bill");
      setForm(VACIO);
      setPagina(1);
      recargar();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      clearTimeout(timerMensaje.current);
      setMensaje("❌ Error al guardar pago");
      timerMensaje.current = setTimeout(() => setMensaje(""), 3000);
    } finally {
      setGuardando(false);
    }
  }

  async function guardarEdicion() {
    const body = {
      IdPago: editando.IdPago,
      Monto: Number(editando.Monto) || 0,
      Fecha: editando.Fecha,
      IdContrato: Number(editando.IdContrato) || 0,
      Moneda: editando.Moneda || "ARS",
    };
    try {
      await pagos.actualizar(editando.IdPago, body);
      setEditando(null);
      recargar();
      toast("✏️ Pago actualizado", "ok");
    } catch (err) {
      toast(err.message || "No se pudo actualizar", "error");
    }
  }

  async function eliminar(p) {
    const ok = await confirmar({
      titulo: "¿Eliminar este registro?",
      descripcion: "¿Seguro que querés eliminar este pago?",
      textoConfirmar: "Eliminar",
    });
    if (!ok) return;
    try {
      await pagos.eliminar(p.IdPago);
      recargar();
      toast("Pago eliminado", "warn");
    } catch (err) {
      toast(err.message || "No se pudo eliminar el pago", "error");
    }
  }

  return (
    <section className="card-ghost mt-3" id="pagosForm">
      {mensaje && <div className="alertaMsg alertaRoja">{mensaje}</div>}
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h5 className="mb-0"><i className="fa fa-hand-holding-usd me-2" />{esCliente ? "Mis pagos" : "Registrar Cobro"}</h5>
          <small className="text-muted">
            {cargando ? "Cargando..." : `${filtrada.length} pago${filtrada.length !== 1 ? "s" : ""}${esCliente && !filtroContrato && contratosConPagos.length > 1 ? ` de tus ${contratosConPagos.length} contratos` : ""} · $${numero(totales.ARS)}${totales.USD ? ` · USD ${numero(totales.USD)}` : ""} en total`}
          </small>
        </div>
        {!esCliente && (
          <button className="btn btn-light btn-sm" onClick={exportar} title="Exportar Excel">
            <i className="fa fa-file-excel me-1" style={{ color: "#2e7d32" }} />Excel
          </button>
        )}
      </div>

      <ErrorBanner mensaje={errorCarga} onReintentar={recargar} />

      {!esCliente && (
        <form className="row g-3" onSubmit={(e) => e.preventDefault()}>
          <div className="col-md-4">
            <label className="form-label">Contrato vinculado</label>
            <SearchSelect
              icono="fa-file-contract"
              value={form.IdContrato}
              onChange={(v) => setForm({ ...form, IdContrato: v })}
              opciones={opcionesContrato}
              placeholder="Buscar contrato..."
            />
          </div>

          <div className="col-md-2">
            <label className="form-label">Moneda</label>
            <SelectorMoneda name="pMoneda" valor={form.Moneda} onChange={(m) => setForm({ ...form, Moneda: m })} />
          </div>

          <div className="col-md-2">
            <label className="form-label">{form.Moneda === "USD" ? "Monto (USD)" : "Monto ($)"}</label>
            <input
              className="form-control" type="text" inputMode="decimal" placeholder="0.00"
              value={form.Monto}
              onChange={(e) => setForm({ ...form, Monto: monto(e.target.value, true) })}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Fecha</label>
            <input className="form-control" type="date" value={form.Fecha} onChange={(e) => setForm({ ...form, Fecha: e.target.value })} />
          </div>
          <div className="col-12 text-end">
            <button className="btn btn-condado" type="button" onClick={crear} disabled={guardando}>
              {guardando
                ? <><i className="fa fa-spinner fa-spin me-1" />Guardando...</>
                : <><i className="fa fa-save me-1" />Guardar cobro</>}
            </button>
          </div>
          <div className="col-12" />
        </form>
      )}
      <hr />

      <div className="tabla-search-bar">
        <div className="tabla-search-input">
          <i className="fa fa-search" />
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder={esCliente ? "Buscar pagos..." : "Buscar cobros..."}
            value={busqueda}
            onChange={(e) => buscar(e.target.value)}
          />
        </div>
        {contratosConPagos.length > 1 && (
          <select
            className="form-select form-select-sm pagos-filtro-contrato"
            value={filtroContrato}
            onChange={(e) => elegirContrato(e.target.value)}
            aria-label="Filtrar por contrato"
          >
            <option value="">Todos los contratos ({contratosConPagos.length})</option>
            {contratosConPagos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.direccion} · {c.periodo}{!esCliente && c.locatario ? ` · ${c.locatario}` : ""} · {c.pagos} pago{c.pagos !== 1 ? "s" : ""}
              </option>
            ))}
          </select>
        )}
        <span className="tabla-count">
          {busqueda || filtroContrato ? `${filtrada.length} resultado${filtrada.length !== 1 ? "s" : ""}` : ""}
        </span>
      </div>

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Contrato</th><th>Moneda</th><th>Monto</th><th>Fecha</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <SkeletonFilas columnas={5} />
            ) : pgs.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icono="fa-money-bill"
                    titulo="Sin cobros"
                    descripcion={esCliente ? "No tenés cobros registrados." : "No hay cobros registrados aún."}
                  />
                </td>
              </tr>
            ) : (
              visibles.map((p) => {
                const usd = p.Moneda === "USD";
                const color = usd ? "#1565c0" : "#2e7d32";
                const c = datosContrato(contratoPorId.get(Number(p.IdContrato)));
                return (
                  <tr key={p.IdPago} className="tabla-fila-moderna">
                    <td>
                      <div><i className="fa fa-file-contract me-1" style={{ color: "var(--text-muted)" }} />{c.direccion}</div>
                      <small className="text-muted">
                        {c.periodo}{!esCliente && c.locatario ? ` · ${c.locatario}` : ""}
                      </small>
                    </td>
                    <td>
                      <span className="moneda-badge" style={{ background: usd ? "#e3f2fd" : "#e8f5e9", color }}>
                        {p.Moneda || "ARS"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.05rem", fontWeight: 700, color }}>
                        {usd ? "USD " : "$"}{Number(p.Monto || 0).toLocaleString("es-AR")}
                      </span>
                    </td>
                    <td>{fechaCorta(p.Fecha)}</td>
                    <td className="tabla-acciones">
                      {!esCliente && (
                        <>
                          <button className="tabla-btn-edit" onClick={() => setEditando({ ...p, Fecha: fechaInput(p.Fecha) })}>
                            <i className="fa fa-pen" />
                          </button>
                          <button className="tabla-btn-del" onClick={() => eliminar(p)}>
                            <i className="fa fa-trash" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Paginacion total={filtrada.length} pagina={pagina} onCambio={setPagina} />

      <Modal
        abierto={Boolean(editando)}
        titulo="Editar Pago"
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
            <div className="col-md-4">
              <label className="form-label">Monto</label>
              <input className="form-control" type="text" inputMode="decimal" value={editando.Monto ?? ""}
                onChange={(e) => setEditando({ ...editando, Monto: monto(e.target.value, true) })} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Fecha</label>
              <input className="form-control" type="date" value={editando.Fecha || ""}
                onChange={(e) => setEditando({ ...editando, Fecha: e.target.value })} />
            </div>
            <div className="col-12">
              <label className="form-label">Contrato</label>
              <SearchSelect
                icono="fa-file-contract"
                value={editando.IdContrato ?? ""}
                onChange={(v) => setEditando({ ...editando, IdContrato: v })}
                opciones={opcionesContrato}
                placeholder="Buscar contrato por locatario o dirección..."
              />
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

export default Pagos;
