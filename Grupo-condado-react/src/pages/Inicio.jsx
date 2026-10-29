import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { propiedades } from "../services/entidades";
import { mapPropiedad } from "../services/propiedadesService";
import { useCarga } from "../hooks/useCarga";
import { useAuth } from "../context/authContext";
import { TIPOS, TIPOS_OPERACION, LOCALIDADES_ORDENADAS } from "../utils/catalogos";
import { saludo } from "../utils/format";
import PropertyGrid from "../components/propiedades/PropertyGrid";
import ErrorBanner from "../components/common/ErrorBanner";

const ACCESOS = {
  Administrador: [
    { icon: "fa-chart-pie", label: "Dashboard", path: "/app/dashboard" },
    { icon: "fa-building", label: "Propiedades", path: "/app/propiedades" },
    { icon: "fa-users", label: "Propietarios", path: "/app/propietarios" },
    { icon: "fa-user-friends", label: "Clientes", path: "/app/clientes" },
    { icon: "fa-handshake", label: "Operaciones", path: "/app/operaciones" },
    { icon: "fa-comments", label: "Consultas", path: "/app/consultas" },
  ],
  Agente: [
    { icon: "fa-chart-pie", label: "Dashboard", path: "/app/dashboard" },
    { icon: "fa-building", label: "Propiedades", path: "/app/propiedades" },
    { icon: "fa-handshake", label: "Operaciones", path: "/app/operaciones" },
    { icon: "fa-file-contract", label: "Contratos", path: "/app/contratos" },
    { icon: "fa-user-circle", label: "Mi perfil", path: "/app/perfil" },
  ],
  Cliente: [
    { icon: "fa-th-large", label: "Catálogo", path: "/app/catalogo" },
    { icon: "fa-envelope", label: "Hacer consulta", path: "/app/consulta" },
    { icon: "fa-file-contract", label: "Contratos", path: "/app/contratos" },
    { icon: "fa-money-bill", label: "Pagos", path: "/app/pagos" },
    { icon: "fa-user-circle", label: "Mi perfil", path: "/app/perfil" },
  ],
  Invitado: [
    { icon: "fa-th-large", label: "Ver catálogo", path: "/app/catalogo" },
    { icon: "fa-sign-in-alt", label: "Iniciar sesión", path: "/login" },
  ],
};

const DESCRIPCION_ROL = {
  Administrador: "Podés administrar propiedades, clientes, propietarios y operaciones.",
  Agente: "Podés gestionar propiedades, operaciones y contratos.",
  Cliente: "Explorá el catálogo y realizá tus consultas.",
  Invitado: "Estás viendo el catálogo como invitado. Para consultar por una propiedad necesitás iniciar sesión.",
};

const CUALQUIERA = "Cualquiera";

const VACIO = { localidad: "", tipo: "", operacion: "" };

function Inicio() {
  const navigate = useNavigate();
  const { usuario, rol, invitado, cerrarSesion } = useAuth();
  const [busqueda, setBusqueda] = useState(VACIO);
  const [aplicado, setAplicado] = useState(null);

  const { datos, cargando, error, recargar } = useCarga(
    async () => (await propiedades.listar()).map(mapPropiedad),
    []
  );

  const lista = useMemo(() => datos || [], [datos]);

  const stats = useMemo(
    () => ({
      total: lista.length,
      disponibles: lista.filter((p) => p.estado === "Disponible").length,
      localidades: new Set(lista.map((p) => p.localidadId)).size,
    }),
    [lista]
  );

  const resultados = useMemo(() => {
    if (!aplicado) return null;
    return lista.filter((p) => {
      if (p.estado === "Vendida" || p.estado === "Alquilada") return false;
      const { tipo, localidad } = aplicado;
      if (tipo && tipo !== CUALQUIERA && String(p.tipoId) !== tipo) return false;
      if (localidad && localidad !== CUALQUIERA && String(p.localidadId) !== localidad) return false;
      return true;
    });
  }, [aplicado, lista]);

  const accesos = ACCESOS[rol] || ACCESOS.Cliente;
  const titulo = invitado ? "Bienvenido 👋" : `${saludo()}, ${usuario?.Nombre || ""} 👋`;

  return (
    <>
      <section className="hero-v3" id="heroSection">
        <div className="hero-v3-bg" />
        <div className="hero-v3-overlay" />

        <div className="hero-v3-content">
          <p className="hero-v3-eyebrow">
            <i className="fa fa-home me-2" />Grupo Condado — Gestión Inmobiliaria
          </p>

          <h1 className="hero-v3-title">
            Encontrá tu próximo<br />
            <span className="hero-v3-accent">hogar ideal.</span>
          </h1>
          <p className="hero-v3-sub">Descubrí inmuebles disponibles en toda la región.</p>

          <form
            className="hero-v3-searchbar"
            onSubmit={(e) => { e.preventDefault(); setAplicado(busqueda); }}
          >
            <div className="hero-v3-search-field">
              <label><i className="fa fa-map-marker-alt me-1" />Localidad</label>
              <select
                className="hero-v3-select"
                value={busqueda.localidad}
                onChange={(e) => setBusqueda({ ...busqueda, localidad: e.target.value })}
              >
                <option value="">Todas las localidades</option>
                <option value={CUALQUIERA}>Cualquiera</option>
                {LOCALIDADES_ORDENADAS.map(({ id, nombre }) => (
                  <option key={id} value={id}>{nombre}</option>
                ))}
              </select>
            </div>

            <div className="hero-v3-search-divider" />

            <div className="hero-v3-search-field">
              <label><i className="fa fa-home me-1" />Tipo</label>
              <select
                className="hero-v3-select"
                value={busqueda.tipo}
                onChange={(e) => setBusqueda({ ...busqueda, tipo: e.target.value })}
              >
                <option value="">Cualquier tipo</option>
                <option value={CUALQUIERA}>Cualquiera</option>
                {Object.entries(TIPOS).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </div>

            <div className="hero-v3-search-divider" />

            <div className="hero-v3-search-field">
              <label><i className="fa fa-tag me-1" />Operación</label>
              <select
                className="hero-v3-select"
                value={busqueda.operacion}
                onChange={(e) => setBusqueda({ ...busqueda, operacion: e.target.value })}
              >
                <option value="">Cualquiera</option>
                {[...TIPOS_OPERACION].reverse().map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="hero-v3-btn">
              <i className="fa fa-search me-2" />Buscar
            </button>
            <button
              type="button"
              className="hero-v3-btn-clear"
              onClick={() => { setBusqueda(VACIO); setAplicado(null); }}
            >
              <i className="fa fa-times" />
            </button>
          </form>

          <div className="hero-v3-stats" style={{ display: datos ? "flex" : "none" }}>
            <div className="hero-v3-stat"><span>{stats.total}</span><small>Propiedades</small></div>
            <div className="hero-v3-stat-sep" />
            <div className="hero-v3-stat"><span>{stats.disponibles}</span><small>Disponibles</small></div>
            <div className="hero-v3-stat-sep" />
            <div className="hero-v3-stat"><span>{stats.localidades}</span><small>Localidades</small></div>
          </div>
        </div>
      </section>

      <ErrorBanner mensaje={error} onReintentar={recargar} />

      <div id="bienvenida">
        <div className="bienvenida-card fade-in">
          <div className="bienvenida-icon"><i className="fa fa-building" /></div>
          <div className="bienvenida-texto">
            <h3>{titulo}</h3>
            <p>{DESCRIPCION_ROL[rol] || DESCRIPCION_ROL.Cliente}</p>
          </div>
        </div>

        <div className="accesos-rapidos">
          {accesos.map((a) => (
            <div
              key={a.path}
              className="acceso-card fade-in"
              onClick={() => {
                if (a.path === "/login") cerrarSesion();
                navigate(a.path);
              }}
            >
              <i className={`fa ${a.icon}`} />
              <span>{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      {resultados && (
        <div className="mt-3 fade-in" id="resultadosBusqueda">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h5 className="mb-0" style={{ fontFamily: "'Playfair Display', serif", color: "var(--condado)" }}>
              <i className="fa fa-search me-2" />Resultados
            </h5>
            <span className="badge" style={{ background: "var(--condado)", fontSize: 12 }}>
              {resultados.length} resultado{resultados.length !== 1 ? "s" : ""}
            </span>
          </div>
          <PropertyGrid
            id="gridResultados"
            propiedades={resultados}
            cargando={cargando}
            vacio={
              <div style={{ textAlign: "center", padding: "2rem", color: "#6b5b52" }}>
                <i className="fa fa-search fa-2x" style={{ marginBottom: ".75rem", display: "block" }} />
                Sin resultados para esa búsqueda. Probá con otros criterios.
              </div>
            }
          />
        </div>
      )}
    </>
  );
}

export default Inicio;
