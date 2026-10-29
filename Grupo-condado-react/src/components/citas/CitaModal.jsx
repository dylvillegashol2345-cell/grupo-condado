import { useMemo, useState } from "react";
import Modal from "../common/Modal";
import SearchSelect from "../common/SearchSelect";
import { citas as citasApi } from "../../services/entidades";
import { useUI } from "../../context/uiContext";
import { ESTADOS_CITA, validarCita, cuerpoCita, fechaISO, etiquetaPropiedad } from "../../utils/citas";
import { nombre, telefonoCompleto } from "../../utils/restricciones";

function CitaModal({ inicial, citas, propiedades, clientes, agentes, onCerrar, onGuardado }) {
  const { toast } = useUI();
  const [c, setC] = useState(inicial);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const editando = Boolean(c.IdCita);
  const desdeConsulta = Boolean(c.IdConsulta);
  const clienteVinculado = c.IdCliente ? clientes.find((x) => String(x.IdCliente) === String(c.IdCliente)) : null;
  const set = (cambios) => { setC((x) => ({ ...x, ...cambios })); setError(""); };

  const opcionesPropiedad = useMemo(
    () => propiedades.map((p) => ({ value: p.id, label: etiquetaPropiedad(p), sub: `${p.localidad} · ${p.estado}` })),
    [propiedades]
  );
  const opcionesCliente = useMemo(
    () => clientes.map((cl) => ({
      value: cl.IdCliente,
      label: `${cl.Apellido || ""} ${cl.Nombre || ""}`.trim() || "Sin nombre",
      sub: cl.Telefono || cl.Email || "",
    })),
    [clientes]
  );

  function elegirCliente(id) {
    const cl = clientes.find((x) => String(x.IdCliente) === String(id));
    set({
      IdCliente: id,
      Contacto: c.Contacto || (cl ? `${cl.Nombre || ""} ${cl.Apellido || ""}`.trim() : ""),
      Telefono: c.Telefono || cl?.Telefono || "",
    });
  }

  async function guardar() {
    const problema = validarCita(c, citas);
    if (problema) { setError(problema); return; }
    setGuardando(true);
    try {
      if (editando) await citasApi.actualizar(c.IdCita, cuerpoCita(c));
      else await citasApi.crear(cuerpoCita(c));
      toast(editando ? "Cita actualizada" : `📅 Cita agendada el ${c.Fecha.split("-").reverse().join("/")} a las ${c.Hora}`, "ok");
      onGuardado();
      onCerrar();
    } catch (err) {
      setError(err.message || "No se pudo guardar la cita.");
    } finally {
      setGuardando(false);
    }
  }

  const pie = (
    <>
      <button className="btn btn-light" onClick={onCerrar}>Cancelar</button>
      <button className="btn btn-condado" onClick={guardar} disabled={guardando}>
        <i className="fa fa-calendar-check me-1" />{guardando ? "Guardando..." : editando ? "Guardar cambios" : "Agendar cita"}
      </button>
    </>
  );

  return (
    <Modal abierto titulo={editando ? "Editar cita" : "Agendar cita"} onCerrar={onCerrar} pie={pie} ancho={640}>
      {desdeConsulta && !editando && (
        <div className="alert alert-light py-2" style={{ fontSize: 13, border: "1px solid var(--border)" }}>
          <i className="fa fa-comments me-1" style={{ color: "var(--condado)" }} />
          Cita a partir de la consulta. Los datos ya vienen cargados: elegí día y hora.
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Día</label>
          <input type="date" className="form-control" value={c.Fecha} min={editando ? undefined : fechaISO()}
            onChange={(e) => set({ Fecha: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Hora</label>
          <input type="time" className="form-control" step="900" value={c.Hora} onChange={(e) => set({ Hora: e.target.value })} />
        </div>

        <div className="col-12">
          <label className="form-label">Propiedad</label>
          <SearchSelect icono="fa-building" value={c.IdPropiedad} onChange={(v) => set({ IdPropiedad: v })}
            opciones={opcionesPropiedad} placeholder="Buscar por barrio o calle..." />
        </div>

        {desdeConsulta ? (
          <div className="col-12">
            <div className="cita-con-quien">
              <i className="fa fa-user-check" />
              {clienteVinculado
                ? <span>Con <strong>{c.Contacto || "quien consultó"}</strong>, que ya es cliente registrado (<strong>{`${clienteVinculado.Apellido || ""} ${clienteVinculado.Nombre || ""}`.trim()}</strong>).</span>
                : <span>Con <strong>{c.Contacto || "quien consultó"}</strong>, quien hizo la consulta. Todavía no es cliente registrado: la cita queda a su nombre.</span>}
            </div>
          </div>
        ) : (
          <div className="col-12">
            <label className="form-label">Cliente</label>
            <SearchSelect icono="fa-user" value={c.IdCliente} onChange={elegirCliente}
              opciones={opcionesCliente} placeholder="Buscar cliente..." />
            <small className="text-muted" style={{ fontSize: 11 }}>
              Si todavía no es cliente, dejalo vacío y completá su nombre y teléfono abajo.
            </small>
          </div>
        )}
        <div className="col-md-6">
          <label className="form-label">{desdeConsulta ? "Nombre de quien consultó" : "Contacto"}</label>
          <input className="form-control" value={c.Contacto} placeholder="Nombre de quien viene"
            onChange={(e) => set({ Contacto: nombre(e.target.value, 150) })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Teléfono</label>
          <input className="form-control" inputMode="tel" value={c.Telefono} placeholder="3512486533"
            onChange={(e) => set({ Telefono: telefonoCompleto(e.target.value) })} />
        </div>

        <div className="col-md-6">
          <label className="form-label">Agente a cargo</label>
          <select className="form-select" value={c.IdUsuario} onChange={(e) => set({ IdUsuario: e.target.value })}>
            <option value="">Sin asignar</option>
            {agentes.map((a) => <option key={a.IdUsuario} value={a.IdUsuario}>{a.NombreUsuario} ({a.Rol})</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Estado</label>
          <select className="form-select" value={c.Estado} onChange={(e) => set({ Estado: e.target.value })}>
            {Object.keys(ESTADOS_CITA).map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>

        <div className="col-12">
          <label className="form-label">Notas</label>
          <textarea className="form-control" rows={3} maxLength={500} value={c.Notas}
            placeholder="Ej: visita con la pareja, traer planos, llave en la portería..."
            onChange={(e) => set({ Notas: e.target.value })} />
        </div>
      </div>

      {error && <div className="alert alert-danger mt-3 mb-0 py-2" style={{ fontSize: 13 }}>{error}</div>}
    </Modal>
  );
}

export default CitaModal;
