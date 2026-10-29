import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useUI } from "../context/uiContext";
import { useDatosCitas } from "../hooks/useDatosCitas";
import { citas as citasApi } from "../services/entidades";
import { CITA_VACIA, ESTADOS_CITA, cuerpoCita, fechaISO, semanasDelMes } from "../utils/citas";
import CitaModal from "../components/citas/CitaModal";
import BotonRecordar from "../components/citas/BotonRecordar";
import ErrorBanner from "../components/common/ErrorBanner";
import "../components/citas/citas.css";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const dosDigitos = (n) => String(n).padStart(2, "0");
const quien = (c) => c.Contacto || c.ClienteNombre || "Sin contacto";
const paraEditar = (c) => ({ ...CITA_VACIA, ...Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v ?? ""])) });
const direccion = (c) => [c.Barrio, `${c.Calle || ""} ${c.Numeracion || ""}`.trim()].filter(Boolean).join(" · ") || "Propiedad sin datos";

function BadgeEstado({ estado }) {
  const e = ESTADOS_CITA[estado] || ESTADOS_CITA.Pendiente;
  return (
    <span className="cita-badge" style={{ background: e.bg, color: e.color }}>
      <i className={`fa ${e.icono} me-1`} />{estado}
    </span>
  );
}

function Citas() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { toast, confirmar } = useUI();
  const { citas, propiedades, clientes, agentes, cargando, error, recargar } = useDatosCitas();

  const hoy = fechaISO();
  const [mes, setMes] = useState(() => { const d = new Date(); return { anio: d.getFullYear(), mes: d.getMonth() }; });
  const [dia, setDia] = useState(hoy);
  const [modal, setModal] = useState(null);   // Datos iniciales del formulario

  const porDia = useMemo(() => {
    const m = {};
    citas.forEach((c) => { (m[c.Fecha] = m[c.Fecha] || []).push(c); });
    Object.values(m).forEach((l) => l.sort((a, b) => String(a.Hora).localeCompare(String(b.Hora))));
    return m;
  }, [citas]);

  const delDia = porDia[dia] || [];
  const proximas = useMemo(
    () => citas.filter((c) => c.Fecha >= hoy && (c.Estado === "Pendiente" || c.Estado === "Confirmada")).length,
    [citas, hoy]
  );

  function moverMes(delta) {
    setMes(({ anio, mes: m }) => {
      const d = new Date(anio, m + delta, 1);
      return { anio: d.getFullYear(), mes: d.getMonth() };
    });
  }
  function irAHoy() {
    const d = new Date();
    setMes({ anio: d.getFullYear(), mes: d.getMonth() });
    setDia(hoy);
  }

  function agregar() {
    const esAgente = agentes.some((a) => a.IdUsuario === usuario?.IdUsuario);
    setModal({ ...CITA_VACIA, Fecha: dia >= hoy ? dia : hoy, IdUsuario: esAgente ? usuario.IdUsuario : "" });
  }

  async function cambiarEstado(c, estado) {
    try {
      await citasApi.actualizar(c.IdCita, cuerpoCita({ ...c, Estado: estado }));
      toast(`Cita marcada como ${estado.toLowerCase()}`, "ok");
      recargar();
    } catch (err) {
      toast(err.message || "No se pudo actualizar la cita", "error");
    }
  }

  async function eliminar(c) {
    const ok = await confirmar({
      titulo: "¿Eliminar esta cita?",
      descripcion: `La cita con ${quien(c)} del ${c.Fecha.split("-").reverse().join("/")} a las ${c.Hora} se borra definitivamente. Si solo no se va a hacer, conviene marcarla como Cancelada.`,
      textoConfirmar: "Eliminar",
    });
    if (!ok) return;
    try {
      await citasApi.eliminar(c.IdCita);
      toast("Cita eliminada", "warn");
      recargar();
    } catch (err) {
      toast(err.message || "No se pudo eliminar la cita", "error");
    }
  }

  const semanas = semanasDelMes(mes.anio, mes.mes);
  const tituloDia = new Date(`${dia}T12:00:00`).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section id="citas" className="card-ghost mt-3">
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h5 className="mb-0"><i className="fa fa-calendar-alt me-2" />Citas</h5>
          <small className="text-muted">
            {cargando ? "Cargando..." : `${proximas} próxima${proximas !== 1 ? "s" : ""} pendiente${proximas !== 1 ? "s" : ""} o confirmada${proximas !== 1 ? "s" : ""}`}
          </small>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-light" style={{ border: "1px solid var(--border)" }} onClick={() => navigate("/app/consultas")}>
            <i className="fa fa-comments me-1" />Ver consultas
          </button>
          <button className="btn btn-condado" onClick={agregar} disabled={cargando}>
            <i className="fa fa-plus me-2" />Agregar cita
          </button>
        </div>
      </div>

      <ErrorBanner mensaje={error} onReintentar={recargar} />

      <div className="citas-layout">
        <div className="citas-calendario">
          <div className="citas-mes">
            <button className="btn btn-sm btn-light" onClick={() => moverMes(-1)} aria-label="Mes anterior"><i className="fa fa-chevron-left" /></button>
            <strong>{MESES[mes.mes]} {mes.anio}</strong>
            <button className="btn btn-sm btn-light" onClick={() => moverMes(1)} aria-label="Mes siguiente"><i className="fa fa-chevron-right" /></button>
            <button className="btn btn-sm btn-light ms-2" onClick={irAHoy}>Hoy</button>
          </div>
          <div className="citas-grilla">
            {DIAS.map((d) => <div key={d} className="citas-dia-nombre">{d}</div>)}
            {semanas.flat().map((n, i) => {
              if (!n) return <div key={`v${i}`} className="citas-celda vacia" />;
              const fecha = `${mes.anio}-${dosDigitos(mes.mes + 1)}-${dosDigitos(n)}`;
              const lista = porDia[fecha] || [];
              const clases = ["citas-celda", fecha === dia && "elegido", fecha === hoy && "hoy", fecha < hoy && "pasado"].filter(Boolean).join(" ");
              return (
                <button key={fecha} type="button" className={clases} onClick={() => setDia(fecha)}>
                  <span className="citas-num">{n}</span>
                  {lista.slice(0, 2).map((c) => {
                    const e = ESTADOS_CITA[c.Estado] || ESTADOS_CITA.Pendiente;
                    return (
                      <span key={c.IdCita} className="citas-chip" style={{ background: e.bg, color: e.color }}>
                        {c.Hora} {quien(c)}
                      </span>
                    );
                  })}
                  {lista.length > 2 && <span className="citas-mas">+{lista.length - 2} más</span>}
                </button>
              );
            })}
          </div>
          <div className="citas-leyenda">
            {Object.keys(ESTADOS_CITA).map((e) => <BadgeEstado key={e} estado={e} />)}
          </div>
        </div>

        <div className="citas-detalle">
          <h6 className="citas-detalle-titulo">{tituloDia}</h6>
          {cargando ? (
            <p className="text-muted">Cargando...</p>
          ) : delDia.length === 0 ? (
            <div className="citas-sin">
              <i className="fa fa-calendar-day fa-2x mb-2" />
              <p className="mb-2">No hay citas este día.</p>
              {dia >= hoy && <button className="btn btn-sm btn-condado" onClick={agregar}><i className="fa fa-plus me-1" />Agregar cita</button>}
            </div>
          ) : (
            delDia.map((c) => (
              <div key={c.IdCita} className="cita-card">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div className="cita-hora"><i className="fa fa-clock me-1" />{c.Hora}</div>
                  <BadgeEstado estado={c.Estado} />
                </div>
                <div className="cita-prop"><i className="fa fa-building me-1" />{direccion(c)}</div>
                <div className="cita-linea">
                  <i className="fa fa-user me-1" />{quien(c)}
                  {c.Telefono && <> · <a href={`tel:${c.Telefono}`}>{c.Telefono}</a></>}
                </div>
                <div className="cita-linea"><i className="fa fa-user-tie me-1" />{c.Agente || "Sin agente asignado"}</div>
                {c.IdConsulta && <div className="cita-linea"><i className="fa fa-comments me-1" />Agendada desde una consulta</div>}
                {c.Notas && <p className="cita-notas">{c.Notas}</p>}
                <div className="cita-acciones">
                  {(c.Estado === "Pendiente" || c.Estado === "Confirmada") && <BotonRecordar cita={c} />}
                  {c.Estado === "Pendiente" && (
                    <button className="btn btn-sm btn-light" onClick={() => cambiarEstado(c, "Confirmada")}><i className="fa fa-check me-1" />Confirmar</button>
                  )}
                  {(c.Estado === "Pendiente" || c.Estado === "Confirmada") && (
                    <>
                      <button className="btn btn-sm btn-light" onClick={() => cambiarEstado(c, "Realizada")}><i className="fa fa-check-double me-1" />Realizada</button>
                      <button className="btn btn-sm btn-light" onClick={() => cambiarEstado(c, "Cancelada")}><i className="fa fa-ban me-1" />Cancelar</button>
                    </>
                  )}
                  <button className="btn btn-sm btn-light" title="Editar" onClick={() => setModal(paraEditar(c))}><i className="fa fa-edit" /></button>
                  <button className="btn btn-sm btn-light text-danger" title="Eliminar" onClick={() => eliminar(c)}><i className="fa fa-trash" /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {modal && (
        <CitaModal
          inicial={modal}
          citas={citas}
          propiedades={propiedades}
          clientes={clientes}
          agentes={agentes}
          onCerrar={() => setModal(null)}
          onGuardado={recargar}
        />
      )}
    </section>
  );
}

export default Citas;
