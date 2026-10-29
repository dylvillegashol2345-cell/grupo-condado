import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { consultas } from "../services/entidades";
import { useCarga } from "../hooks/useCarga";
import { useAuth } from "../context/authContext";
import { useDatosCitas } from "../hooks/useDatosCitas";
import { citaDesdeConsulta, etiquetaPropiedad, propiedadDeConsulta, ESTADOS_CITA } from "../utils/citas";
import EmptyState from "../components/common/EmptyState";
import CitaModal from "../components/citas/CitaModal";

function Consultas() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [busqueda, setBusqueda] = useState("");
  const datosCitas = useDatosCitas();
  const [modalCita, setModalCita] = useState(null);

  const citaPorConsulta = useMemo(() => {
    const m = {};
    datosCitas.citas.forEach((c) => { if (c.IdConsulta) m[c.IdConsulta] = c; });
    return m;
  }, [datosCitas.citas]);

  function agendar(consulta) {
    const esAgente = datosCitas.agentes.some((a) => a.IdUsuario === usuario?.IdUsuario);
    setModalCita({ ...citaDesdeConsulta(consulta, datosCitas.propiedades, datosCitas.clientes), IdUsuario: esAgente ? usuario.IdUsuario : "" });
  }

  function propiedadTexto(c) {
    const p = propiedadDeConsulta(c.PropiedadInteres, datosCitas.propiedades);
    return p ? etiquetaPropiedad(p) : /^\d+$/.test(String(c.PropiedadInteres || "")) ? "—" : c.PropiedadInteres || "—";
  }

  const { datos, cargando, error, recargar } = useCarga(
    async () => (await consultas.listar()).sort((a, b) => new Date(b.Fecha || 0) - new Date(a.Fecha || 0)),
    []
  );

  const lista = useMemo(() => datos || [], [datos]);

  const filtrada = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((c) => (c.Nombre || "").toLowerCase().includes(q));
  }, [lista, busqueda]);

  function actualizar() {
    setBusqueda("");
    recargar();
    datosCitas.recargar();
  }

  function celdaCita(c) {
    const cita = citaPorConsulta[c.IdConsulta];
    if (cita) {
      const e = ESTADOS_CITA[cita.Estado] || ESTADOS_CITA.Pendiente;
      return (
        <button className="btn btn-sm" style={{ background: e.bg, color: e.color, fontSize: 12, fontWeight: 600 }}
          title={`Cita ${cita.Estado.toLowerCase()} — ver en Citas`} onClick={() => navigate("/app/citas")}>
          <i className="fa fa-calendar-check me-1" />{cita.Fecha.split("-").reverse().slice(0, 2).join("/")} {cita.Hora}
        </button>
      );
    }
    return (
      <button className="btn btn-sm btn-condado" style={{ fontSize: 12 }} disabled={datosCitas.cargando} onClick={() => agendar(c)}>
        <i className="fa fa-calendar-plus me-1" />Agendar cita
      </button>
    );
  }

  function contenido() {
    if (cargando) return <p className="text-muted" style={{ padding: "1rem" }}>Cargando...</p>;
    if (error) {
      return (
        <p className="text-danger" style={{ padding: "1rem" }}>
          Error al cargar consultas. Verificá que la API esté corriendo.
        </p>
      );
    }
    if (!lista.length) {
      return <EmptyState icono="fa-comments" titulo="Sin consultas" descripcion="Aún no hay consultas de clientes." />;
    }
    if (!filtrada.length) {
      return <EmptyState icono="fa-comments" titulo="Sin consultas" descripcion="No hay consultas que coincidan con la búsqueda." />;
    }
    return (
      <>
        <p className="text-muted" style={{ fontSize: 12, marginBottom: ".5rem" }}>
          {filtrada.length} consulta{filtrada.length !== 1 ? "s" : ""} — ordenadas por más reciente
        </p>
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Nombre</th><th>Teléfono</th>
                <th>Propiedad de interés</th><th>Mensaje</th><th>Fecha</th><th>Cita</th>
              </tr>
            </thead>
            <tbody>
              {filtrada.map((c, i) => (
                <tr key={c.IdConsulta ?? i}>
                  <td><strong>{c.Nombre || ""}</strong></td>
                  <td>{c.Telefono || "—"}</td>
                  <td>{propiedadTexto(c)}</td>
                  <td style={{ maxWidth: 300, whiteSpace: "normal" }}>{c.Mensaje || ""}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{c.Fecha ? String(c.Fecha).split("T")[0] : "—"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{celdaCita(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <section id="consultasAdmin" className="card-ghost mt-3">
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h5 className="mb-0"><i className="fa fa-comments me-2" />Consultas de clientes</h5>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <div style={{ position: "relative" }}>
            <i
              className="fa fa-search"
              style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                color: "#a0918a", fontSize: 13, pointerEvents: "none",
              }}
            />
            <input
              type="text"
              id="buscarConsultas"
              className="form-control form-control-sm"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ paddingLeft: 30, minWidth: 200 }}
            />
          </div>
          <button className="btn btn-light btn-sm" onClick={actualizar}>
            <i className="fa fa-sync me-1" />Actualizar
          </button>
        </div>
      </div>
      <div id="consultasAdminLista">{contenido()}</div>

      {modalCita && (
        <CitaModal
          inicial={modalCita}
          citas={datosCitas.citas}
          propiedades={datosCitas.propiedades}
          clientes={datosCitas.clientes}
          agentes={datosCitas.agentes}
          onCerrar={() => setModalCita(null)}
          onGuardado={datosCitas.recargar}
        />
      )}
    </section>
  );
}

export default Consultas;
