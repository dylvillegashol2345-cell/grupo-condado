import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { propiedades } from "../services/entidades";
import { mapPropiedad } from "../services/propiedadesService";
import { useCarga } from "../hooks/useCarga";
import { useUI } from "../context/uiContext";
import PropiedadModal from "../components/propiedades/PropiedadModal";
import CatalogoFiltros from "../components/propiedades/CatalogoFiltros";
import { FILTROS_CATALOGO_VACIOS, ORDENES, contarFiltrosActivos, filtrarCatalogo, ordenar } from "../utils/filtrosCatalogo";
import MapaCatalogo from "../components/propiedades/MapaCatalogo";
import { obtenerCotizacion } from "../utils/cotizacion";
import ErrorBanner from "../components/common/ErrorBanner";
import EcoBadge from "../components/common/EcoBadge";
import BarraComparador from "../components/propiedades/BarraComparador";
import ComparadorModal from "../components/propiedades/ComparadorModal";
import { useComparador } from "../hooks/useComparador";
import { MIN_COMPARAR } from "../utils/comparador";
import { money, precio } from "../utils/format";

const IMG_DEFECTO = "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&q=60";
const BADGE_ESTADO = { Disponible: "success", Reservada: "warning", Vendida: "secondary", Alquilada: "info" };

function SkeletonAdmin() {
  return Array.from({ length: 3 }, (_, i) => (
    <div className="col-md-4" key={i}>
      <div className="skeleton-card">
        <div className="skeleton skeleton-img" />
        <div style={{ padding: "1rem" }}>
          <div className="skeleton skeleton-line w-60" />
          <div className="skeleton skeleton-line w-40" />
          <div className="skeleton skeleton-line w-80" />
          <div className="skeleton skeleton-btn" />
        </div>
      </div>
    </div>
  ));
}

function Propiedades() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast, confirmar } = useUI();

  const [filtros, setFiltros] = useState({ ...FILTROS_CATALOGO_VACIOS, texto: searchParams.get("q") || "" });
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [orden, setOrden] = useState("");
  const [dolar, setDolar] = useState(null);
  useEffect(() => {
    let vivo = true;
    obtenerCotizacion().then((c) => { if (vivo && c) setDolar(c.valor); });
    return () => { vivo = false; };
  }, []);
  const [vista, setVista] = useState("cards");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState(null);
  const { ids: idsCmp, enComparador, alternar: alternarCmp, limpiar: limpiarCmp } = useComparador();
  const [comparadorAbierto, setComparadorAbierto] = useState(false);

  const { datos, cargando, error, recargar } = useCarga(
    async () => (await propiedades.listar()).map(mapPropiedad),
    []
  );

  const lista = useMemo(() => datos || [], [datos]);
  const enComparacion = useMemo(() => lista.filter((p) => idsCmp.includes(p.id)), [lista, idsCmp]);

  const filtradas = useMemo(() => ordenar(filtrarCatalogo(lista, filtros, dolar), orden, dolar), [lista, filtros, orden, dolar]);
  const activos = contarFiltrosActivos(filtros);

  function limpiarFiltros() {
    setFiltros(FILTROS_CATALOGO_VACIOS);
  }

  const valorCartera = filtradas.reduce((a, p) => a + p.precioNum, 0);

  function abrirNueva() {
    setEnEdicion(null);
    setModalAbierto(true);
  }

  function abrirEdicion(p) {
    setEnEdicion(p.raw);
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function eliminar(p) {
    const ok = await confirmar({
      titulo: "¿Eliminar este registro?",
      descripcion: "¿Seguro que querés eliminar esta propiedad? Esta acción no se puede deshacer.",
      textoConfirmar: "Eliminar",
    });
    if (!ok) return;
    try {
      await propiedades.eliminar(p.id);
      recargar();
      toast("Propiedad eliminada", "warn");
    } catch (err) {
      toast(err.message || "No se pudo eliminar la propiedad", "error");
    }
  }

  let contenido;
  if (cargando) {
    contenido = <SkeletonAdmin />;
  } else if (!datos) {
    contenido = null;
  } else if (!datos.length) {
    contenido = <p className="text-muted">No hay propiedades registradas.</p>;
  } else if (!filtradas.length) {
    contenido = <p className="text-muted">Ninguna propiedad coincide con la búsqueda.</p>;
  } else {
    contenido = (
      <div className="row g-3">
        {filtradas.map((p) => (
          <div className="col-md-4" key={p.id}>
            <div className="card h-100 shadow-sm" style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
              <img src={p.image || IMG_DEFECTO} alt="" style={{ height: 195, objectFit: "cover", width: "100%" }} />
              <div className="card-body d-flex flex-column" style={{ padding: "1rem" }}>
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <h6 style={{ fontWeight: 700, margin: 0 }}>{p.type}</h6>
                  <span className={`badge bg-${BADGE_ESTADO[p.raw.Estado] || "secondary"}`}>{p.raw.Estado}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: ".2rem 0" }}>
                  📍 {p.title}
                </p>
                <p style={{ fontSize: 13, margin: ".2rem 0" }}>
                  💰 <b>{precio(p.raw.Precio, p.raw.Moneda)}</b> &nbsp;·&nbsp; 📐 {p.raw.Superficie || "—"} m²
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: ".2rem 0" }}>
                  <EcoBadge clase={p.categoriaEco || "B"} /> &nbsp;·&nbsp;{" "}
                  {p.publicada ? "✅ Publicada" : "⚠ No publicada"}
                </p>
                <div className="mt-auto pt-2 d-flex gap-2">
                  <button
                    className="btn btn-sm btn-light flex-grow-1"
                    style={{ border: "1px solid var(--border)", fontSize: 12 }}
                    onClick={() => navigate(`/app/propiedades/${p.id}`)}
                  >
                    <i className="fa fa-eye me-1" />Ver detalles
                  </button>
                  <button
                    className="btn btn-sm btn-condado flex-grow-1"
                    style={{ fontSize: 12 }}
                    onClick={() => abrirEdicion(p)}
                  >
                    <i className="fa fa-edit me-1" />Editar
                  </button>
                  <button
                    className={`btn btn-sm ${enComparador(p.id) ? "btn-condado" : "btn-light"}`}
                    style={{ border: "1px solid var(--border)", fontSize: 12 }}
                    title={enComparador(p.id) ? "Quitar del comparador" : "Agregar al comparador"}
                    onClick={() => alternarCmp(p.id)}
                  >
                    <i className="fa fa-balance-scale" />
                  </button>
                  <button className="btn btn-sm btn-danger" style={{ fontSize: 12 }} onClick={() => eliminar(p)}>
                    <i className="fa fa-trash" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section id="propiedadesForm" className="card-ghost mt-3" style={idsCmp.length ? { paddingBottom: 80 } : undefined}>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h5 className="mb-0"><i className="fa fa-building me-2" />Propiedades</h5>
          <small className="text-muted">
            {cargando
              ? "Cargando..."
              : `${filtradas.length} de ${lista.length} · ${money(valorCartera)} en cartera`}
          </small>
        </div>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <select
            className="catalogo-filtro-select"
            style={{ fontSize: 12, padding: ".38rem .75rem" }}
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
          >
            {ORDENES.map((o) => <option key={o.valor} value={o.valor}>{o.label}</option>)}
          </select>
          <div className="catalogo-toggle-bar">
            <button className={`catalogo-toggle-btn${vista === "cards" ? " active" : ""}`} onClick={() => setVista("cards")}>
              <i className="fa fa-th-large me-1" />Cards
            </button>
            <button className={`catalogo-toggle-btn${vista === "mapa" ? " active" : ""}`} onClick={() => setVista("mapa")}>
              <i className="fa fa-map-marker-alt me-1" />Mapa
            </button>
          </div>
          <button
            type="button"
            className={`catalogo-filtros-btn${panelAbierto ? " active" : ""}`}
            onClick={() => setPanelAbierto((v) => !v)}
          >
            <i className="fa fa-search me-1" />Buscar
            {activos > 0 && (
              <span
                style={{
                  background: "#c62828", color: "white", fontSize: 10, fontWeight: 700,
                  padding: ".1em .45em", borderRadius: 10, marginLeft: ".35rem",
                }}
              >
                {activos}
              </span>
            )}
          </button>
          <button id="btnAbrirCargaPropiedad" className="btn btn-condado" onClick={abrirNueva}>
            <i className="fa fa-plus me-2" />Cargar propiedad
          </button>
        </div>
      </div>

      <ErrorBanner mensaje={error} onReintentar={recargar} />

      {panelAbierto && (
        <CatalogoFiltros
          filtros={filtros}
          onChange={setFiltros}
          cantidad={filtradas.length}
          mostrarResumen
          onLimpiar={limpiarFiltros}
        />
      )}

      {vista === "mapa"
        ? <MapaCatalogo propiedades={filtradas} />
        : <div id="adminPropLista" className="row g-3">{contenido}</div>}
      <div id="propiedadesMsg" className="mt-2" />

      <BarraComparador
        ids={idsCmp}
        onQuitar={alternarCmp}
        onLimpiar={limpiarCmp}
        onComparar={() => setComparadorAbierto(true)}
      />

      {comparadorAbierto && enComparacion.length >= MIN_COMPARAR && (
        <ComparadorModal
          abierto
          propiedades={enComparacion}
          onCerrar={() => setComparadorAbierto(false)}
          onLimpiar={limpiarCmp}
        />
      )}

      {modalAbierto && (
        <PropiedadModal
          propiedad={enEdicion}
          onCerrar={cerrarModal}
          onGuardado={recargar}
        />
      )}
    </section>
  );
}

export default Propiedades;
