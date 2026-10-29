import { useEffect, useMemo, useState } from "react";
import { propietarios } from "../services/entidades";
import { useCarga } from "../hooks/useCarga";
import { useUI } from "../context/uiContext";
import { useActividad } from "../context/actividadContext";
import { validarPropietario, REGLAS_DOCUMENTO } from "../utils/validaciones";
import { soloLetras, soloDigitos, documento, email } from "../utils/restricciones";
import { TIPOS_DOCUMENTO } from "../utils/catalogos";
import { exportarExcel } from "../utils/excel";
import Modal from "../components/common/Modal";
import PeopleCard from "../components/common/PeopleCard";
import ErrorBanner from "../components/common/ErrorBanner";

const VACIO = {
  TipoDocumento: "DNI",
  DNI: "",
  Apellido: "",
  Nombre: "",
  Email: "",
  Calle: "",
  Numeracion: "",
  Localidad: "",
};

const COLORES = ["#6c2d20", "#1565c0", "#2e7d32", "#6a1b9a", "#e65100", "#00838f"];

const attrsDoc = (tipo) => {
  const regla = REGLAS_DOCUMENTO[tipo] || REGLAS_DOCUMENTO.DNI;
  return { inputMode: regla.soloNumeros ? "numeric" : "text" };
};

const COLUMNAS_EXPORT = [
  { titulo: "ID", campo: "IdPropietario" }, { titulo: "Apellido", campo: "Apellido" },
  { titulo: "Nombre", campo: "Nombre" }, { titulo: "Documento", campo: "DNI" },
  { titulo: "Email", campo: "Email" }, { titulo: "Calle", campo: "Calle" },
  { titulo: "Numeración", campo: "Numeracion" }, { titulo: "Localidad", campo: "Localidad" },
];

const iniciales = (o) => ((o.Nombre || "?")[0] + (o.Apellido || "?")[0]).toUpperCase();
const nombreCard = (o) => `${o.Apellido || ""}, ${o.Nombre || ""}`;
const filasCard = (o) => [
  { icono: "fa-id-card", texto: `${o.TipoDocumento || "DNI"} ${o.DNI || "—"}` },
  { icono: "fa-envelope", texto: o.Email || "—" },
  { icono: "fa-map-marker-alt", texto: `${o.Calle || ""} ${o.Numeracion || ""}, ${o.Localidad || ""}` },
];

const textoCard = (o) =>
  [iniciales(o), nombreCard(o), ...filasCard(o).map((f) => f.texto), "Editar"].join(" ");

function Propietarios() {
  const { toast, confirmar } = useUI();
  const { registrar } = useActividad();
  const [formAbierto, setFormAbierto] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(null);

  const { datos, cargando, error: errorCarga, recargar } = useCarga(
    async () => (await propietarios.listar()).sort((a, b) => a.IdPropietario - b.IdPropietario),
    []
  );

  const lista = useMemo(() => datos || [], [datos]);

  useEffect(() => {
    if (!mensaje) return undefined;
    const t = setTimeout(() => setMensaje(""), 3000);
    return () => clearTimeout(t);
  }, [mensaje]);

  function set(clave, valor) {
    setForm((f) => ({ ...f, [clave]: valor }));
  }

  function toggleForm() {
    setFormAbierto((v) => !v);
    setForm(VACIO);
  }

  async function crear() {
    if (guardando) return;
    const problema = validarPropietario(form, lista, null);
    if (problema) { setMensaje(problema); return; }

    setGuardando(true);
    try {
      await propietarios.crear(form);
      toast("✅ Propietario creado", "ok");
      registrar("Propietario registrado", `${form.Apellido} ${form.Nombre}`, "fa-user");
      setForm(VACIO);
      recargar();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setMensaje(err.message || "No se pudo guardar el propietario");
    } finally {
      setGuardando(false);
    }
  }

  function cerrarEdicion() {
    setEditando(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardarEdicion() {
    const problema = validarPropietario(editando, lista, editando.IdPropietario);
    if (problema) { setEditando({ ...editando, _error: problema }); return; }
    try {
      await propietarios.actualizar(editando.IdPropietario, copiaEdicion(editando));
      cerrarEdicion();
      recargar();
      toast("✏️ Propietario actualizado", "ok");
    } catch (err) {
      setEditando({ ...editando, _error: err.message || "No se pudo actualizar" });
    }
  }

  async function eliminar(p) {
    const ok = await confirmar({
      titulo: "¿Eliminar este registro?",
      descripcion: "¿Seguro que querés eliminar este propietario?",
      textoConfirmar: "Eliminar",
    });
    if (!ok) return;
    try {
      await propietarios.eliminar(p.IdPropietario);
      recargar();
      toast("Propietario eliminado", "warn");
    } catch (err) {
      toast(err.message || "No se pudo eliminar (puede tener propiedades asociadas)", "error");
    }
  }

  function exportar() {
    try {
      exportarExcel(lista, COLUMNAS_EXPORT, "Propietarios");
      toast("✅ Propietarios exportado correctamente", "ok");
    } catch (err) {
      toast(err.message, "error");
    }
  }

  const q = busqueda.toLowerCase();

  return (
    <section className="mt-3" id="propietariosForm">
      {mensaje && <div className="alertaMsg alertaRoja">❌ {mensaje}</div>}

      <div className="people-section-header">
        <div>
          <h4 className="people-section-title"><i className="fa fa-user me-2" />Propietarios</h4>
          <p className="people-section-sub">Gestioná los dueños de las propiedades registradas</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-light btn-sm" onClick={exportar} title="Exportar Excel">
            <i className="fa fa-file-excel me-1" style={{ color: "#2e7d32" }} />Excel
          </button>
          <button className="people-btn-add" onClick={toggleForm}>
            <i className="fa fa-plus me-2" />Agregar propietario
          </button>
        </div>
      </div>

      <ErrorBanner mensaje={errorCarga} onReintentar={recargar} />

      {formAbierto && (
        <div id="formPropietarioWrap" className="people-form-wrap">
          <div className="people-form-title"><i className="fa fa-user-plus me-2" />Agregar propietario</div>
          <form id="formPropietario" className="row g-3" onSubmit={(e) => { e.preventDefault(); crear(); }}>
            <div className="col-md-2">
              <label className="wizard-label">Tipo documento</label>
              <select
                className="form-select wizard-input"
                value={form.TipoDocumento}
                onChange={(e) => setForm((f) => ({ ...f, TipoDocumento: e.target.value, DNI: documento(f.DNI, e.target.value) }))}
              >
                {TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="wizard-label">Documento</label>
              <input
                className="form-control wizard-input" {...attrsDoc(form.TipoDocumento)}
                value={form.DNI}
                onChange={(e) => set("DNI", documento(e.target.value, form.TipoDocumento))}
              />
            </div>
            <div className="col-md-2">
              <label className="wizard-label">Apellido</label>
              <input className="form-control wizard-input" value={form.Apellido}
                onChange={(e) => set("Apellido", soloLetras(e.target.value))} />
            </div>
            <div className="col-md-2">
              <label className="wizard-label">Nombre</label>
              <input className="form-control wizard-input" value={form.Nombre}
                onChange={(e) => set("Nombre", soloLetras(e.target.value))} />
            </div>
            <div className="col-md-4">
              <label className="wizard-label">Email</label>
              <input className="form-control wizard-input" type="email"
                value={form.Email} onChange={(e) => set("Email", email(e.target.value))} />
            </div>
            <div className="col-md-4">
              <label className="wizard-label">Calle</label>
              <input className="form-control wizard-input" value={form.Calle}
                onChange={(e) => set("Calle", soloLetras(e.target.value))} />
            </div>
            <div className="col-md-2">
              <label className="wizard-label">Numeración</label>
              <input className="form-control wizard-input" value={form.Numeracion} inputMode="numeric"
                onChange={(e) => set("Numeracion", soloDigitos(e.target.value, 6))} />
            </div>
            <div className="col-md-3">
              <label className="wizard-label">Localidad</label>
              <input className="form-control wizard-input" value={form.Localidad}
                onChange={(e) => set("Localidad", soloLetras(e.target.value))} />
            </div>
            <div className="col-12 d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-light" onClick={toggleForm}>Cancelar</button>
              <button type="submit" className="btn btn-condado" disabled={guardando}>
                {guardando
                  ? <><i className="fa fa-spinner fa-spin me-1" />Guardando...</>
                  : <><i className="fa fa-save me-1" />Guardar propietario</>}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="people-search-bar">
        <div className="tabla-search-input">
          <i className="fa fa-search" />
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Buscar por nombre, DNI o localidad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <span className="tabla-count">
          {datos ? `${lista.length} propietario${lista.length !== 1 ? "s" : ""}` : ""}
        </span>
      </div>

      <div id="gridPropietarios" className="people-grid">
        {cargando ? (
          <div className="d-flex justify-content-center p-4">
            <i className="fa fa-spinner fa-spin fa-2x" style={{ color: "var(--condado)" }} />
          </div>
        ) : datos && lista.length === 0 ? (
          <div className="empty-state col-12">
            <i className="fa fa-user" />
            <h6>Sin propietarios</h6>
            <p>Aún no hay propietarios registrados. Usá el botón &quot;Agregar&quot; para comenzar.</p>
          </div>
        ) : (
          lista.map((o, i) => textoCard(o).toLowerCase().includes(q) && (
            <PeopleCard
              key={o.IdPropietario}
              idCard={`pcard-${o.IdPropietario}`}
              iniciales={iniciales(o)}
              nombre={nombreCard(o)}
              color={COLORES[i % COLORES.length]}
              filas={filasCard(o)}
              tituloEditar="Editar propietario"
              tituloEliminar="Eliminar propietario"
              onEditar={() => setEditando(copiaEdicion(o))}
              onEliminar={() => eliminar(o)}
            />
          ))
        )}
      </div>

      <Modal
        abierto={Boolean(editando)}
        titulo="Editar Propietario"
        onCerrar={cerrarEdicion}
        ancho={700}
        pie={
          <>
            <button className="btn btn-light" onClick={cerrarEdicion}>Cancelar</button>
            <button className="btn btn-condado" onClick={guardarEdicion}>
              <i className="fa fa-save me-1" />Guardar cambios
            </button>
          </>
        }
      >
        {editando && (
          <>
            {editando._error && <div className="alertaMsg alertaRoja mb-3">❌ {editando._error}</div>}
            <div className="row g-3">
              <div className="col-md-4"><label className="form-label">DNI</label>
                <input className="form-control" value={editando.DNI} {...attrsDoc(editando.TipoDocumento)}
                  onChange={(e) => setEditando({ ...editando, DNI: documento(e.target.value, editando.TipoDocumento) })} /></div>
              <div className="col-md-4"><label className="form-label">Apellido</label>
                <input className="form-control" value={editando.Apellido}
                  onChange={(e) => setEditando({ ...editando, Apellido: soloLetras(e.target.value) })} /></div>
              <div className="col-md-4"><label className="form-label">Nombre</label>
                <input className="form-control" value={editando.Nombre}
                  onChange={(e) => setEditando({ ...editando, Nombre: soloLetras(e.target.value) })} /></div>
              <div className="col-md-4"><label className="form-label">Email</label>
                <input className="form-control" type="email" value={editando.Email}
                  onChange={(e) => setEditando({ ...editando, Email: email(e.target.value) })} /></div>
              <div className="col-md-4"><label className="form-label">Calle</label>
                <input className="form-control" value={editando.Calle}
                  onChange={(e) => setEditando({ ...editando, Calle: soloLetras(e.target.value) })} /></div>
              <div className="col-md-2"><label className="form-label">N°</label>
                <input className="form-control" value={editando.Numeracion} inputMode="numeric"
                  onChange={(e) => setEditando({ ...editando, Numeracion: soloDigitos(e.target.value, 6) })} /></div>
              <div className="col-md-4"><label className="form-label">Localidad</label>
                <input className="form-control" value={editando.Localidad}
                  onChange={(e) => setEditando({ ...editando, Localidad: soloLetras(e.target.value) })} /></div>
            </div>
          </>
        )}
      </Modal>
    </section>
  );
}

function copiaEdicion(o) {
  return {
    IdPropietario: o.IdPropietario,
    TipoDocumento: o.TipoDocumento || "DNI",
    DNI: o.DNI || "",
    Apellido: o.Apellido || "",
    Nombre: o.Nombre || "",
    Email: o.Email || "",
    Calle: o.Calle || "",
    Numeracion: o.Numeracion || "",
    Localidad: o.Localidad || "",
  };
}

export default Propietarios;
