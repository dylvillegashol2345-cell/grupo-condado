import { useMemo, useState } from "react";
import { contratos, operaciones, propiedades, clientes, propietarios } from "../services/entidades";
import { useCarga } from "../hooks/useCarga";
import { useUI } from "../context/uiContext";
import { useAuth } from "../context/authContext";
import { useActividad } from "../context/actividadContext";
import { validarContrato, validarContratoVenta } from "../utils/validaciones";
import { fechaCorta, diasRestantes } from "../utils/format";
import { localidadLabel } from "../utils/catalogos";
import { exportarContratoPDF } from "../utils/contratoPdf";
import { exportarExcel, COLUMNAS_EXCEL } from "../utils/excel";
import Paginacion from "../components/common/Paginacion";
import { paginar } from "../utils/paginacion";
import ContratoForm from "../components/contratos/ContratoForm";
import ContratoVentaForm from "../components/contratos/ContratoVentaForm";
import HistorialCobrosModal from "../components/contratos/HistorialCobrosModal";
import GeneradorContratoModal from "../components/contratos/GeneradorContratoModal";
import {
  datosIniciales, combinarConAnteriores, cargarDocumento, abrirContratoLocacion, abrirVentanaDocumento,
} from "../utils/contratoLocacion";
import SearchSelect from "../components/common/SearchSelect";
import Modal from "../components/common/Modal";
import ErrorBanner from "../components/common/ErrorBanner";
import EmptyState from "../components/common/EmptyState";
import { SkeletonFilas } from "../components/common/Loader";
import {
  CONTRATO_VACIO, formAContrato, contratoAForm, CONTRATO_VENTA_VACIO, formAVenta, ventaAForm,
  formatDireccion, contratosConOperacion, contratosDelUsuario, esVenta,
} from "../utils/contratos";

const PESTANAS = [
  { valor: "alquiler", label: "Alquileres", icono: "fa-key" },
  { valor: "venta", label: "Ventas", icono: "fa-home" },
  { valor: "todos", label: "Todos", icono: "fa-list" },
];

const ENCABEZADOS = {
  ninguno: { titulo: "Registrar Contrato", sub: "Seleccioná una operación para cargar el contrato correspondiente" },
  Alquiler: { titulo: "Contrato de Locación", sub: "Alquiler de inmueble · CCyCN" },
  Venta: { titulo: "Boleto de Compraventa", sub: "Compraventa de inmueble · CCyCN arts. 1170/1171" },
};

function TipoBadge({ venta }) {
  return venta ? (
    <span style={{ background: "#fce4ec", color: "#880e4f", fontSize: 11, fontWeight: 700, padding: ".2em .6em", borderRadius: 8 }}>
      <i className="fa fa-home me-1" />Venta
    </span>
  ) : (
    <span style={{ background: "#e3f2fd", color: "#1565c0", fontSize: 11, fontWeight: 700, padding: ".2em .6em", borderRadius: 8 }}>
      <i className="fa fa-key me-1" />Alquiler
    </span>
  );
}

function EstadoContrato({ fechaFin }) {
  const dias = diasRestantes(fechaFin);
  if (dias === null) return null;
  if (dias < 0) return <span className="tabla-badge tabla-badge-vencido">Vencido</span>;
  if (dias <= 30) return <span className="tabla-badge tabla-badge-alquiler">{dias}d</span>;
  return <span className="tabla-badge tabla-badge-ok">Vigente</span>;
}

function rellenar(form, cambios) {
  const conDato = Object.fromEntries(
    Object.entries(cambios).filter(([, v]) => (typeof v === "string" ? v.replace(/[\s,]/g, "") : v))
  );
  return { ...form, ...conDato };
}

function Contratos() {
  const { toast, confirmar } = useUI();
  const { usuario, rol } = useAuth();
  const { registrar } = useActividad();
  const esCliente = rol === "Cliente";

  const [idOperacion, setIdOperacion] = useState("");
  const [tipoAlta, setTipoAlta] = useState(null);
  const [form, setForm] = useState(CONTRATO_VACIO);
  const [formVenta, setFormVenta] = useState(CONTRATO_VENTA_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [pestana, setPestana] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [generador, setGenerador] = useState(null);

  const { datos, cargando, error: errorCarga, recargar } = useCarga(async () => {
    const [cts, ops, props, clis, dueños] = await Promise.all([
      contratos.listar(),
      operaciones.listar(),
      esCliente ? Promise.resolve([]) : propiedades.listar(),
      clientes.listar(),
      esCliente ? Promise.resolve([]) : propietarios.listar(),
    ]);
    return {
      cts: contratosConOperacion(cts.sort((a, b) => Number(b.IdContrato) - Number(a.IdContrato)), ops),
      ops, props, clis, dueños,
    };
  }, [esCliente]);

  const { cts = [], ops = [], props = [], clis = [], dueños = [] } = datos || {};

  const propMap = useMemo(() => new Map(props.map((p) => [p.IdPropiedad, p])), [props]);
  const cliMap = useMemo(() => new Map(clis.map((c) => [c.IdCliente, c])), [clis]);

  const opcionesOperacion = useMemo(
    () => (esCliente ? [] : ops.map((o) => {
      const prop = propMap.get(o.IdPropiedad) || {};
      const cli = cliMap.get(o.IdCliente) || {};
      return {
        value: o.IdOperacion,
        tipo: o.Tipo,
        label: `${o.Tipo || "Operación"} · ${formatDireccion(prop)}`,
        sub: `${cli.Nombre || ""} ${cli.Apellido || ""} · ${fechaCorta(o.Fecha)}`,
      };
    })),
    [esCliente, ops, propMap, cliMap]
  );

  const propios = useMemo(
    () => (esCliente ? contratosDelUsuario(cts, clis, usuario) : cts),
    [esCliente, cts, clis, usuario]
  );

  const porTipo = useMemo(() => {
    if (pestana === "alquiler") return propios.filter((c) => c._tipoOp === "Alquiler");
    if (pestana === "venta") return propios.filter((c) => c._tipoOp === "Venta");
    return propios;
  }, [propios, pestana]);

  const filas = useMemo(() => porTipo.map((c) => {
    const venta = esVenta(c);
    const signo = (c.Moneda || "ARS") === "USD" ? "USD " : "$";
    const monto = venta
      ? (c.PrecioTotal ? `${signo}${Number(c.PrecioTotal).toLocaleString("es-AR")}` : "—")
      : (c.CanonMensual ? `${signo}${Number(c.CanonMensual).toLocaleString("es-AR")}/mes` : "—");
    return {
      c, venta, monto,
      partes: venta ? `${c.LocadorNombre || "—"} → ${c.LocatarioNombre || "—"}` : (c.LocatarioNombre || "—"),
    };
  }), [porTipo]);

  const visibles = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return filas;
    return filas.filter((f) =>
      [f.venta ? "Venta" : "Alquiler", f.partes, f.c.InmuebleDireccion, f.monto, fechaCorta(f.c.FechaInicio), fechaCorta(f.c.FechaFin)]
        .join(" ").toLowerCase().includes(q)
    );
  }, [filas, busqueda]);

  const pagVisibles = paginar(visibles, pagina);

  const contador = busqueda
    ? `${visibles.length} resultado${visibles.length !== 1 ? "s" : ""}`
    : `${filas.length} contrato${filas.length !== 1 ? "s" : ""}`;

  function contratosAnteriores(campo, valor) {
    return cts.filter((c) => {
      const op = ops.find((o) => Number(o.IdOperacion) === Number(c.IdOperacion));
      return op && Number(op[campo]) === Number(valor);
    });
  }

  function ultimoDato(anteriores, clave) {
    const c = anteriores.find((x) => String(x[clave] ?? "").replace(/[\s,]/g, ""));
    return c ? c[clave] : "";
  }

  function elegirOperacion(id) {
    setIdOperacion(id);
    const op = ops.find((o) => String(o.IdOperacion) === String(id));
    if (!op) { setTipoAlta(null); return; }
    setTipoAlta(op.Tipo === "Alquiler" || op.Tipo === "Venta" ? op.Tipo : null);

    const prop = propMap.get(op.IdPropiedad) || {};
    const cli = cliMap.get(op.IdCliente) || {};
    const dueño = prop.IdPropietario ? dueños.find((d) => Number(d.IdPropietario) === Number(prop.IdPropietario)) : null;
    const dePropiedad = contratosAnteriores("IdPropiedad", op.IdPropiedad);
    const deCliente = contratosAnteriores("IdCliente", op.IdCliente);

    const deAntes = Object.fromEntries(
      ["LocadorNombre", "LocadorDni", "LocadorDomicilio", "Banco", "Cbu", "Cuit", "Destino",
        "IndiceActualizacion", "ExpOrd", "ExpExt", "Municipalidad", "Servicios"]
        .map((k) => [k, ultimoDato(dePropiedad, k)])
    );
    const comunes = {
      InmuebleDireccion: formatDireccion(prop),
      InmuebleLocalidad: localidadLabel(prop.IdLocalidad),
      Moneda: prop.Moneda || "ARS",
      FechaInicio: new Date().toISOString().split("T")[0],
      LocatarioNombre: `${cli.Nombre || ""} ${cli.Apellido || ""}`.trim(),
      LocatarioDni: cli.DNI || "",
      LocatarioDomicilio: ultimoDato(deCliente, "LocatarioDomicilio") || cli.Localidad || "",
      ...(dueño ? {
        LocadorNombre: `${dueño.Nombre || ""} ${dueño.Apellido || ""}`.trim(),
        LocadorDni: dueño.DNI || "",
        LocadorDomicilio: `${dueño.Calle || ""} ${dueño.Numeracion || ""}, ${dueño.Localidad || ""}`.trim(),
      } : {}),
    };
    if (op.Tipo === "Alquiler") {
      setForm(rellenar(rellenar(CONTRATO_VACIO, deAntes), { ...comunes, CanonMensual: prop.Precio || 0 }));
    } else {
      setFormVenta(rellenar(rellenar(CONTRATO_VENTA_VACIO, deAntes), { ...comunes, SuperficieM2: prop.Superficie || "", PrecioTotal: prop.Precio || 0 }));
    }
  }

  async function crear() {
    const venta = tipoAlta === "Venta";
    const body = venta ? formAVenta(formVenta, idOperacion) : formAContrato(form, idOperacion);
    if (!body.IdOperacion) { toast("❌ Seleccioná una operación", "error"); return; }
    if (!body.FechaInicio) { toast("❌ Ingresá la fecha de inicio", "error"); return; }
    if (!body.FechaFin) { toast("❌ Ingresá la fecha de fin", "error"); return; }
    const problema = venta
      ? validarContratoVenta({ ...formVenta, IdOperacion: body.IdOperacion, PrecioTotal: Number(formVenta.PrecioTotal) || 0 })
      : validarContrato(body);
    if (problema) { toast("❌ " + problema, "error"); return; }

    setGuardando(true);
    try {
      await contratos.crear(body);
      toast(venta ? "✅ Contrato creado" : "✅ Contrato creado — completá los datos del contrato para generarlo", "ok");
      registrar("Contrato creado", body.InmuebleDireccion || (venta ? "Boleto de compraventa" : "Contrato de locación"), "fa-file-contract");
      if (venta) setFormVenta(CONTRATO_VENTA_VACIO); else setForm(CONTRATO_VACIO);
      elegirOperacion("");
      recargar();
      window.scrollTo({ top: 0, behavior: "smooth" });

      if (!venta) {
        const nuevo = (await contratos.listar())
          .filter((c) => Number(c.IdOperacion) === Number(body.IdOperacion))
          .sort((a, b) => Number(b.IdContrato) - Number(a.IdContrato))[0];
        if (nuevo) await abrirGenerador(nuevo, null);
      }
    } catch (err) {
      console.error(err);
      toast("❌ Error al guardar contrato: " + err.message, "error");
    } finally {
      setGuardando(false);
    }
  }

  function abrirEdicion(c) {
    const venta = esVenta(c);
    setEditando({
      id: c.IdContrato, venta, error: "",
      IdOperacion: c.IdOperacion ?? "",
      form: venta ? ventaAForm(c) : contratoAForm(c),
    });
  }

  async function guardarEdicion() {
    const body = {
      IdContrato: editando.id,
      ...(editando.venta ? formAVenta(editando.form, editando.IdOperacion) : formAContrato(editando.form, editando.IdOperacion)),
    };
    const problema = editando.venta ? validarContratoVenta(body) : validarContrato(body);
    if (problema) { setEditando({ ...editando, error: problema }); return; }
    try {
      await contratos.actualizar(editando.id, body);
      setEditando(null);
      recargar();
      toast("✏️ Contrato actualizado", "ok");
    } catch (err) {
      setEditando({ ...editando, error: err.message || "No se pudo actualizar" });
    }
  }

  function exportarXls() {
    try {
      exportarExcel(propios, COLUMNAS_EXCEL.contratosDetalle, "Contratos");
      toast("✅ Contratos exportado correctamente", "ok");
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function eliminar(c) {
    const ok = await confirmar({
      titulo: "¿Eliminar este registro?",
      descripcion: "¿Seguro que querés eliminar este contrato?",
      textoConfirmar: "Eliminar",
    });
    if (!ok) return;
    try {
      await contratos.eliminar(c.IdContrato);
      recargar();
      toast("Contrato eliminado", "warn");
    } catch (err) {
      toast(err.message || "No se pudo eliminar (puede tener pagos asociados)", "error");
    }
  }

  function inicialesDe(fila) {
    const op = ops.find((o) => Number(o.IdOperacion) === Number(fila.IdOperacion));
    const propiedad = op ? propMap.get(op.IdPropiedad) : null;
    return datosIniciales(fila, {
      propiedad,
      cliente: op ? cliMap.get(op.IdCliente) : null,
      propietario: propiedad ? dueños.find((x) => x.IdPropietario === propiedad.IdPropietario) : null,
    });
  }

  async function documentoAnterior(fila, campo) {
    const op = ops.find((o) => Number(o.IdOperacion) === Number(fila.IdOperacion));
    if (!op) return null;
    const candidatos = cts
      .filter((c) => Number(c.IdContrato) !== Number(fila.IdContrato))
      .filter((c) => {
        const o = ops.find((x) => Number(x.IdOperacion) === Number(c.IdOperacion));
        return o && Number(o[campo]) === Number(op[campo]);
      })
      .slice(0, 5);
    for (const c of candidatos) {
      const doc = await cargarDocumento(c.IdContrato);
      if (doc) return doc;
    }
    return null;
  }

  async function abrirGenerador(fila, guardado) {
    const [docPropiedad, docCliente] = await Promise.all([
      documentoAnterior(fila, "IdPropiedad"),
      documentoAnterior(fila, "IdCliente"),
    ]);
    const iniciales = combinarConAnteriores(inicialesDe(fila), docPropiedad, docCliente);
    setGenerador({ contrato: fila, guardado, iniciales });
  }

  async function exportarPdf(c) {
    const directo = esCliente || c._tipoOp === "Venta";
    const ventana = directo ? abrirVentanaDocumento() : null;
    if (directo && !ventana) {
      toast("❌ El navegador bloqueó la ventana emergente. Permitila para ver el contrato.", "error");
      return;
    }
    toast("⏳ Generando contrato...", "ok");
    try {
      const fila = await contratos.obtener(c.IdContrato);
      if (!fila) { ventana?.close(); toast("❌ No se encontró el contrato", "error"); return; }
      if (c._tipoOp === "Venta") { exportarContratoPDF({ ...fila, _tipoOp: c._tipoOp }, ventana); return; }

      const guardado = await cargarDocumento(c.IdContrato);
      if (esCliente) {
        abrirContratoLocacion(guardado || inicialesDe(fila), `Contrato de Locacion ${c.IdContrato}`, ventana);
        return;
      }
      await abrirGenerador(fila, guardado);
    } catch (err) {
      console.error(err);
      ventana?.close();
      toast("❌ Error al generar el contrato", "error");
    }
  }

  const encabezado = esCliente
    ? { titulo: "Mis contratos", sub: "" }
    : ENCABEZADOS[tipoAlta || "ninguno"];

  return (
    <section className="card-ghost mt-3" id="contratosForm">
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h5 className="mb-0"><i className="fa fa-file-contract me-2" /><span>{encabezado.titulo}</span></h5>
          {encabezado.sub && <small className="text-muted">{encabezado.sub}</small>}
        </div>
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Ley 27.551 · Arts. 1123 y ss. CCyCN</span>
          {!esCliente && (
            <button className="btn btn-light btn-sm" onClick={exportarXls} title="Exportar Excel">
              <i className="fa fa-file-excel me-1" style={{ color: "#2e7d32" }} />Excel
            </button>
          )}
        </div>
      </div>

      <ErrorBanner mensaje={errorCarga} onReintentar={recargar} />

      {!esCliente && (
        <>
          <div className="contrato-clausula mb-3">
            <div className="contrato-clausula-titulo"><span className="contrato-num">·</span>OPERACIÓN VINCULADA</div>
            <div className="row g-3 align-items-end">
              <div className="col-md-5">
                <label className="form-label">Seleccioná la operación</label>
                <SearchSelect
                  icono="fa-handshake"
                  value={idOperacion}
                  onChange={elegirOperacion}
                  opciones={opcionesOperacion}
                  placeholder="Buscar operación (alquiler o venta)..."
                />
              </div>
              {tipoAlta && (
                <div className="col-md-4"><div>
                  {tipoAlta === "Alquiler" ? (
                    <span style={{ background: "#e3f2fd", color: "#1565c0", fontSize: 13, fontWeight: 700, padding: ".4em 1em", borderRadius: 10 }}>
                      <i className="fa fa-key me-2" />Contrato de Locación
                    </span>
                  ) : (
                    <span style={{ background: "#fce4ec", color: "#880e4f", fontSize: 13, fontWeight: 700, padding: ".4em 1em", borderRadius: 10 }}>
                      <i className="fa fa-home me-2" />Boleto de Compraventa
                    </span>
                  )}
                </div></div>
              )}
            </div>
          </div>

          {tipoAlta && (
            <form className="contrato-form" onSubmit={(e) => e.preventDefault()}>
              {tipoAlta === "Venta"
                ? <ContratoVentaForm form={formVenta} onChange={setFormVenta} />
                : <ContratoForm form={form} onChange={setForm} />}
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-condado px-4" onClick={crear} disabled={guardando}>
                  {guardando
                    ? <><i className="fa fa-spinner fa-spin me-1" />Guardando...</>
                    : <><i className="fa fa-save me-2" />{tipoAlta === "Venta" ? "Guardar Boleto de Compraventa" : "Guardar Contrato de Locación"}</>}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      <hr />

      <div className="d-flex gap-3 mb-3 flex-wrap">
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
            placeholder="Buscar contratos..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          />
        </div>
        <span className="tabla-count">{cargando || !propios.length ? "" : contador}</span>
      </div>

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Tipo</th><th>Partes</th><th>Inmueble</th><th>Monto</th>
              <th>Inicio</th><th>Vencimiento</th><th>Estado</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <SkeletonFilas columnas={8} />
            ) : propios.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    icono="fa-file-contract"
                    titulo="Sin contratos"
                    descripcion={esCliente ? "No tenés contratos registrados." : "No hay contratos registrados aún."}
                  />
                </td>
              </tr>
            ) : (
              pagVisibles.map(({ c, venta, monto, partes }) => (
                <tr key={c.IdContrato} className="tabla-fila-moderna">
                  <td><TipoBadge venta={venta} /></td>
                  <td style={{ fontSize: 13 }}>{partes}</td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.InmuebleDireccion || "—"}</td>
                  <td style={{ fontWeight: 600, color: "var(--condado)" }}>{monto}</td>
                  <td>{fechaCorta(c.FechaInicio)}</td>
                  <td>{fechaCorta(c.FechaFin)}</td>
                  <td><EstadoContrato fechaFin={c.FechaFin} /></td>
                  <td className="tabla-acciones">
                    {esCliente ? (
                      <>
                        <button className="tabla-btn-edit" title="Ver historial de cobros" style={{ background: "#e3f2fd", color: "#1565c0" }} onClick={() => setHistorial(c)}>
                          <i className="fa fa-history" />
                        </button>
                        <button className="tabla-btn-pdf" title="PDF" onClick={() => exportarPdf(c)}>
                          <i className="fa fa-file-pdf" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="tabla-btn-edit" title="Ver historial de cobros" style={{ background: "#e3f2fd", color: "#1565c0" }} onClick={() => setHistorial(c)}>
                          <i className="fa fa-history" />
                        </button>
                        <button className="tabla-btn-edit" title="Editar" onClick={() => abrirEdicion(c)}>
                          <i className="fa fa-pen" />
                        </button>
                        <button className="tabla-btn-pdf" title="PDF" onClick={() => exportarPdf(c)}>
                          <i className="fa fa-file-pdf" />
                        </button>
                        <button className="tabla-btn-del" title="Eliminar" onClick={() => eliminar(c)}>
                          <i className="fa fa-trash" />
                        </button>
                      </>
                    )}
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
        titulo={editando?.venta ? "Editar Boleto de Compraventa" : "Editar Contrato"}
        onCerrar={() => setEditando(null)}
        ancho={960}
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
          <div className="contrato-form">
            {editando.error && <div className="alertaMsg alertaRoja">❌ {editando.error}</div>}
            <div className="contrato-clausula mb-3">
              <div className="contrato-clausula-titulo"><span className="contrato-num">·</span>OPERACIÓN VINCULADA</div>
              <div className="row g-3">
                <div className="col-md-6">
                  <SearchSelect
                    icono="fa-handshake"
                    value={editando.IdOperacion}
                    onChange={(v) => setEditando({ ...editando, IdOperacion: v })}
                    opciones={opcionesOperacion.filter((o) => o.tipo === (editando.venta ? "Venta" : "Alquiler"))}
                    placeholder="Buscar operación..."
                  />
                </div>
              </div>
            </div>
            {editando.venta
              ? <ContratoVentaForm form={editando.form} onChange={(f) => setEditando({ ...editando, form: f })} />
              : <ContratoForm form={editando.form} onChange={(f) => setEditando({ ...editando, form: f })} />}
          </div>
        )}
      </Modal>

      {historial && (
        <HistorialCobrosModal contrato={historial} onCerrar={() => setHistorial(null)} />
      )}

      {generador && (
        <GeneradorContratoModal
          contrato={generador.contrato}
          guardado={generador.guardado}
          iniciales={generador.iniciales}
          onCerrar={() => setGenerador(null)}
        />
      )}
    </section>
  );
}

export default Contratos;
