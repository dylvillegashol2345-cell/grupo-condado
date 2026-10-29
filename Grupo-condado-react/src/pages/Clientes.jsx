import { useMemo, useState } from "react";
import { clientes } from "../services/entidades";
import { useCarga } from "../hooks/useCarga";
import { useUI } from "../context/uiContext";
import { useActividad } from "../context/actividadContext";
import { validarCliente } from "../utils/validaciones";
import { telSinPrefijo } from "../utils/format";
import { soloLetras, dni, telefono, email } from "../utils/restricciones";
import { exportarExcel } from "../utils/excel";
import Modal from "../components/common/Modal";
import PeopleCard from "../components/common/PeopleCard";
import ErrorBanner from "../components/common/ErrorBanner";

const VACIO = { Apellido: "", Nombre: "", DNI: "", Email: "", telefono: "", Localidad: "" };
const COLORES = ["#1565c0", "#6c2d20", "#2e7d32", "#6a1b9a", "#e65100", "#00838f"];

const COLUMNAS_EXPORT = [
  { titulo: "ID", campo: "IdCliente" }, { titulo: "Nombre", campo: "Nombre" },
  { titulo: "Teléfono", campo: "Telefono" },
];

const bordeTelefono = (el) => el?.style.setProperty("border-radius", "0 10px 10px 0", "important");

function aBody(f, id) {
  return {
    ...(id ? { IdCliente: id } : {}),
    Nombre: f.Nombre.trim(),
    Apellido: f.Apellido.trim(),
    DNI: f.DNI.trim(),
    Email: f.Email.trim(),
    Telefono: f.telefono ? "+54" + f.telefono : "",
    Localidad: f.Localidad.trim(),
  };
}

const nombreCard = (c) => `${c.Apellido ? c.Apellido + ", " : ""}${c.Nombre || "—"}`;
const filasCard = (c) => [
  c.DNI ? { icono: "fa-id-card", texto: `DNI ${c.DNI}` } : null,
  c.Email ? { icono: "fa-envelope", texto: c.Email } : null,
  { icono: "fa-phone", texto: c.Telefono || "Sin teléfono" },
  c.Localidad ? { icono: "fa-map-marker-alt", texto: c.Localidad } : null,
];

const textoCard = (c) =>
  [(c.Nombre || "?")[0], nombreCard(c), ...filasCard(c).map((f) => f?.texto), "Editar"].join(" ");

function Clientes() {
  const { toast, confirmar } = useUI();
  const { registrar } = useActividad();
  const [formAbierto, setFormAbierto] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(null);

  const { datos, cargando, error: errorCarga, recargar } = useCarga(
    async () => (await clientes.listar()).sort((a, b) => a.IdCliente - b.IdCliente),
    []
  );

  const lista = useMemo(() => datos || [], [datos]);

  function set(clave, valor) {
    setForm((f) => ({ ...f, [clave]: valor }));
  }

  function toggleForm() {
    setFormAbierto((v) => !v);
    setForm(VACIO);
  }

  async function crear() {
    if (guardando) return;
    const body = aBody(form);
    if (!body.Nombre) { toast("❌ Ingresá el nombre del cliente", "error"); return; }
    if (!body.Telefono) { toast("❌ Ingresá el teléfono", "error"); return; }
    const problema = validarCliente(body);
    if (problema) { toast("❌ " + problema, "error"); return; }

    setGuardando(true);
    try {
      await clientes.crear(body);
      toast("✅ Cliente creado", "ok");
      registrar("Cliente registrado", (body.Apellido ? body.Apellido + ", " : "") + body.Nombre, "fa-user-friends");
      recargar();
      toggleForm();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast("❌ " + (err.message || "No se pudo guardar el cliente"), "error");
    } finally {
      setGuardando(false);
    }
  }

  function cerrarEdicion() {
    setEditando(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardarEdicion() {
    const body = aBody(editando, editando.IdCliente);
    const problema = validarCliente(body);
    if (problema) { setEditando({ ...editando, _error: problema }); return; }
    try {
      await clientes.actualizar(editando.IdCliente, body);
      cerrarEdicion();
      recargar();
      toast("✏️ Cliente actualizado", "ok");
    } catch (err) {
      setEditando({ ...editando, _error: err.message || "No se pudo actualizar" });
    }
  }

  async function eliminar(c) {
    const ok = await confirmar({
      titulo: "¿Eliminar este registro?",
      descripcion: "¿Seguro que querés eliminar este cliente?",
      textoConfirmar: "Eliminar",
    });
    if (!ok) return;
    try {
      await clientes.eliminar(c.IdCliente);
      recargar();
      toast("Cliente eliminado", "warn");
    } catch (err) {
      toast(err.message || "No se pudo eliminar (puede tener operaciones asociadas)", "error");
    }
  }

  function exportar() {
    try {
      exportarExcel(lista, COLUMNAS_EXPORT, "Clientes");
      toast("✅ Clientes exportado correctamente", "ok");
    } catch (err) {
      toast(err.message, "error");
    }
  }

  function abrirEdicion(c) {
    setEditando({
      IdCliente: c.IdCliente,
      Apellido: c.Apellido || "",
      Nombre: c.Nombre || "",
      DNI: c.DNI || "",
      Email: c.Email || "",
      telefono: telSinPrefijo(c.Telefono),
      Localidad: c.Localidad || "",
    });
  }

  function setEdicion(clave, valor) {
    setEditando((e) => ({ ...e, [clave]: valor }));
  }

  const q = busqueda.toLowerCase();

  return (
    <section className="mt-3" id="clientesForm">
      <div className="people-section-header">
        <div>
          <h4 className="people-section-title"><i className="fa fa-users me-2" />Clientes</h4>
          <p className="people-section-sub">Personas interesadas en comprar o alquilar propiedades</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-light btn-sm" onClick={exportar} title="Exportar Excel">
            <i className="fa fa-file-excel me-1" style={{ color: "#2e7d32" }} />Excel
          </button>
          <button className="people-btn-add" onClick={toggleForm}>
            <i className="fa fa-plus me-2" />Agregar cliente
          </button>
        </div>
      </div>

      <ErrorBanner mensaje={errorCarga} onReintentar={recargar} />

      {formAbierto && (
        <div id="formClienteWrap" className="people-form-wrap">
          <div className="people-form-title"><i className="fa fa-user-plus me-2" />Agregar cliente</div>
          <form id="formCliente" className="row g-3" onSubmit={(e) => { e.preventDefault(); crear(); }}>
            <div className="col-md-3">
              <label className="wizard-label">Apellido</label>
              <input className="form-control wizard-input" value={form.Apellido}
                onChange={(e) => set("Apellido", soloLetras(e.target.value))} />
            </div>
            <div className="col-md-3">
              <label className="wizard-label">Nombre</label>
              <input className="form-control wizard-input" value={form.Nombre}
                onChange={(e) => set("Nombre", soloLetras(e.target.value))} />
            </div>
            <div className="col-md-2">
              <label className="wizard-label">DNI</label>
              <input className="form-control wizard-input" inputMode="numeric" value={form.DNI}
                onChange={(e) => set("DNI", dni(e.target.value))} />
            </div>
            <div className="col-md-4">
              <label className="wizard-label">Email</label>
              <input className="form-control wizard-input" type="email" value={form.Email}
                onChange={(e) => set("Email", email(e.target.value))} />
            </div>
            <div className="col-md-4">
              <label className="wizard-label">Teléfono</label>
              <div className="input-group">
                <span className="input-group-text" style={{ background: "var(--condado)", color: "white", fontWeight: 700, border: "none", borderRadius: "10px 0 0 10px" }}>+54</span>
                <input
                  ref={bordeTelefono}
                  className="form-control wizard-input" placeholder="11 dígitos" inputMode="numeric"
                  value={form.telefono}
                  onChange={(e) => set("telefono", telefono(e.target.value))}
                />
              </div>
            </div>
            <div className="col-md-4">
              <label className="wizard-label">Localidad</label>
              <input className="form-control wizard-input" value={form.Localidad}
                onChange={(e) => set("Localidad", soloLetras(e.target.value))} />
            </div>
            <div className="col-12 d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-light" onClick={toggleForm}>Cancelar</button>
              <button type="submit" className="btn btn-condado" disabled={guardando}>
                {guardando
                  ? <><i className="fa fa-spinner fa-spin me-1" />Guardando...</>
                  : <><i className="fa fa-save me-1" />Guardar cliente</>}
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
            placeholder="Buscar por nombre o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <span className="tabla-count">
          {datos ? `${lista.length} cliente${lista.length !== 1 ? "s" : ""}` : ""}
        </span>
      </div>

      <div id="gridClientes" className="people-grid">
        {cargando ? (
          <div className="d-flex justify-content-center p-4">
            <i className="fa fa-spinner fa-spin fa-2x" style={{ color: "var(--condado)" }} />
          </div>
        ) : datos && lista.length === 0 ? (
          <div className="empty-state col-12">
            <i className="fa fa-users" />
            <h6>Sin clientes</h6>
            <p>Aún no hay clientes registrados. Usá el botón &quot;Agregar&quot; para comenzar.</p>
          </div>
        ) : (
          lista.map((c, i) => textoCard(c).toLowerCase().includes(q) && (
            <PeopleCard
              key={c.IdCliente}
              iniciales={(c.Nombre || "?")[0].toUpperCase()}
              nombre={nombreCard(c)}
              color={COLORES[i % COLORES.length]}
              filas={filasCard(c)}
              onEditar={() => abrirEdicion(c)}
              onEliminar={() => eliminar(c)}
            />
          ))
        )}
      </div>

      <Modal
        abierto={Boolean(editando)}
        titulo="Editar Cliente"
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
              <div className="col-md-3"><label className="form-label">Apellido</label>
                <input className="form-control" value={editando.Apellido}
                  onChange={(e) => setEdicion("Apellido", soloLetras(e.target.value))} /></div>
              <div className="col-md-3"><label className="form-label">Nombre</label>
                <input className="form-control" value={editando.Nombre}
                  onChange={(e) => setEdicion("Nombre", soloLetras(e.target.value))} /></div>
              <div className="col-md-3"><label className="form-label">DNI</label>
                <input className="form-control" value={editando.DNI} inputMode="numeric"
                  onChange={(e) => setEdicion("DNI", dni(e.target.value))} /></div>
              <div className="col-md-3"><label className="form-label">Email</label>
                <input className="form-control" type="email" value={editando.Email}
                  onChange={(e) => setEdicion("Email", email(e.target.value))} /></div>
              <div className="col-md-4"><label className="form-label">Teléfono</label>
                <div className="input-group">
                  <span className="input-group-text" style={{ background: "var(--condado)", color: "white", fontWeight: 700, border: "none" }}>+54</span>
                  <input className="form-control" value={editando.telefono} inputMode="numeric"
                    onChange={(e) => setEdicion("telefono", telefono(e.target.value))} />
                </div>
              </div>
              <div className="col-md-4"><label className="form-label">Localidad</label>
                <input className="form-control" value={editando.Localidad}
                  onChange={(e) => setEdicion("Localidad", soloLetras(e.target.value))} /></div>
            </div>
          </>
        )}
      </Modal>
    </section>
  );
}

export default Clientes;
