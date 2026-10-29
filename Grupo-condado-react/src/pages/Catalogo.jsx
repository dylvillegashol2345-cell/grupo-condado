import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { propiedades } from "../services/entidades";
import { mapPropiedad } from "../services/propiedadesService";
import { useCarga } from "../hooks/useCarga";
import { useUI } from "../context/uiContext";
import CatalogoFiltros from "../components/propiedades/CatalogoFiltros";
import { FILTROS_CATALOGO_VACIOS, ORDENES, contarFiltrosActivos, filtrarCatalogo, ordenar } from "../utils/filtrosCatalogo";
import PropertyGrid from "../components/propiedades/PropertyGrid";
import MapaCatalogo from "../components/propiedades/MapaCatalogo";
import { obtenerCotizacion } from "../utils/cotizacion";
import BotonFavorito from "../components/propiedades/BotonFavorito";
import ErrorBanner from "../components/common/ErrorBanner";
import BarraComparador from "../components/propiedades/BarraComparador";
import ComparadorModal from "../components/propiedades/ComparadorModal";
import { useAuth } from "../context/authContext";
import { useFavoritos } from "../hooks/useFavoritos";
import { useComparador } from "../hooks/useComparador";
import { IMG_PROPIEDAD_FALLBACK } from "../utils/catalogos";
import { MIN_COMPARAR } from "../utils/comparador";

const estiloBadge = (bg) => ({
  background: bg, color: "white", fontSize: 10, fontWeight: 700,
  padding: ".1em .45em", borderRadius: 10, marginLeft: ".35rem",
});

function CardFavorita({ p, onQuitar }) {
  const navigate = useNavigate();
  return (
    <div className="prop-card" style={{ position: "relative", cursor: "pointer" }} onClick={() => navigate(`/app/propiedades/${p.id}`)}>
      <BotonFavorito activo onClick={onQuitar} />
      <div className="prop-card-img-wrap">
        <img src={p.image || IMG_PROPIEDAD_FALLBACK} className="prop-card-img" alt={p.barrio} />
        <span className="prop-card-tipo">{p.type || "Propiedad"}</span>
      </div>
      <div className="prop-card-body">
        <div className="prop-card-precio">{p.price}</div>
        <h3 className="prop-card-titulo">{p.barrio} · {`${p.calle} ${p.numeracion}`.trim()}</h3>
        <p className="prop-card-loc"><i className="fa fa-map-marker-alt me-1" />{p.localidad}</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          <i className="fa fa-ruler-combined me-1" />{p.surface || "—"} m²
        </p>
      </div>
    </div>
  );
}

function Catalogo() {
  const { toast } = useUI();
  const { rol } = useAuth();
  const { favoritos, esFavorito, alternar: alternarFav, vaciar: vaciarFav } = useFavoritos();
  const { ids: idsCmp, enComparador, alternar: alternarCmp, limpiar: limpiarCmp } = useComparador();
  const [comparadorAbierto, setComparadorAbierto] = useState(false);
  const [vista, setVista] = useState("cards");
  const [mapaFiltrado, setMapaFiltrado] = useState(false);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [resumenVisible, setResumenVisible] = useState(false);
  const [orden, setOrden] = useState("");
  const [dolar, setDolar] = useState(null);
  useEffect(() => {
    let vivo = true;
    obtenerCotizacion().then((c) => { if (vivo && c) setDolar(c.valor); });
    return () => { vivo = false; };
  }, []);
  const [filtros, setFiltros] = useState(FILTROS_CATALOGO_VACIOS);
  const [toastFav, setToastFav] = useState({ texto: "", visible: false });
  const timerFav = useRef(null);

  const { datos, cargando, error, recargar } = useCarga(
    async () => (await propiedades.listar()).map(mapPropiedad),
    []
  );

  const todas = useMemo(() => datos || [], [datos]);
  const lista = useMemo(() => todas.filter((p) => p.estado === "Disponible"), [todas]);
  const filtradas = useMemo(() => ordenar(filtrarCatalogo(lista, filtros), orden, dolar), [lista, filtros, orden, dolar]);
  const activos = contarFiltrosActivos(filtros);

  const puedeFavoritos = rol === "Cliente";
  const favoritas = useMemo(() => todas.filter((p) => esFavorito(p.id)), [todas, esFavorito]);
  const enComparacion = useMemo(() => todas.filter((p) => idsCmp.includes(p.id)), [todas, idsCmp]);

  const favoritosHuerfanos = vista === "favoritos" && datos && favoritos.length > 0 && favoritas.length === 0;
  useEffect(() => {
    if (favoritosHuerfanos) vaciarFav();
  }, [favoritosHuerfanos, vaciarFav]);

  useEffect(() => () => clearTimeout(timerFav.current), []);

  function alternarFavorito(id) {
    setToastFav({ texto: esFavorito(id) ? "Quitado de favoritos" : "Agregado a favoritos ❤️", visible: true });
    clearTimeout(timerFav.current);
    timerFav.current = setTimeout(() => setToastFav((t) => ({ ...t, visible: false })), 2000);
    alternarFav(id);
  }

  function cambiarFiltros(nuevos) {
    setFiltros(nuevos);
    setResumenVisible(true);
  }

  function togglePanel() {
    if (!panelAbierto) setResumenVisible(true);
    setPanelAbierto((v) => !v);
  }

  function limpiar() {
    setFiltros(FILTROS_CATALOGO_VACIOS);
    setResumenVisible(false);
  }

  function verMapa(filtrado) {
    setMapaFiltrado(filtrado);
    setVista("mapa");
  }

  function aplicarAlMapa() {
    verMapa(true);
    toast(`🗺 Mapa actualizado — ${filtradas.length} propiedad${filtradas.length !== 1 ? "es" : ""} mostrada${filtradas.length !== 1 ? "s" : ""}`, "ok");
  }

  function vistaFavoritos() {
    if (favoritos.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <i className="fa fa-heart fa-3x" style={{ display: "block", marginBottom: "1rem", opacity: 0.2, color: "#e53935" }} />
          <strong>No tenés propiedades favoritas</strong><br />
          <small>Hacé clic en ❤️ en cualquier propiedad para guardarla acá.</small><br />
          <button
            onClick={() => setVista("cards")}
            style={{
              marginTop: "1rem", background: "#6c2d20", color: "white", border: "none",
              borderRadius: 8, padding: ".5rem 1.5rem", cursor: "pointer",
            }}
          >
            <i className="fa fa-th-large me-2" />Ver catálogo
          </button>
        </div>
      );
    }
    if (cargando) {
      return (
        <div className="d-flex justify-content-center p-4">
          <i className="fa fa-spinner fa-spin fa-2x" style={{ color: "#6c2d20" }} />
        </div>
      );
    }
    if (error) return <p className="text-danger p-3">Error al cargar favoritos.</p>;
    if (!favoritas.length) {
      return (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <i className="fa fa-heart fa-3x" style={{ display: "block", marginBottom: "1rem", opacity: 0.2 }} />
          <strong>No tenés propiedades favoritas</strong>
        </div>
      );
    }
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1.25rem" }}>
        {favoritas.map((p) => <CardFavorita key={p.id} p={p} onQuitar={() => alternarFavorito(p.id)} />)}
      </div>
    );
  }

  const sinResultados = (
    <div id="catalogoLista" className="mt-3">
      <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
        <i className="fa fa-search fa-2x" style={{ display: "block", marginBottom: ".75rem", opacity: 0.4 }} />
        No hay propiedades que coincidan con la búsqueda.<br />
        <button
          onClick={limpiar}
          style={{
            marginTop: ".75rem", background: "var(--condado)", color: "white", border: "none",
            borderRadius: 8, padding: ".5rem 1.25rem", cursor: "pointer", fontSize: 13,
          }}
        >
          Limpiar búsqueda
        </button>
      </div>
    </div>
  );

  return (
    <section className="mt-3" id="catalogoPropiedades">
      <div className="catalogo-header">
        <h5 style={{ fontFamily: "'Playfair Display', serif", color: "var(--condado)", fontSize: "1.4rem", margin: 0 }}>
          <i className="fa fa-home me-2" />Catálogo de Propiedades
        </h5>

        <div className="d-flex gap-2 align-items-center flex-wrap">
          <select
            id="catalogoOrden"
            className="catalogo-filtro-select"
            style={{ fontSize: 12, padding: ".38rem .75rem" }}
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
          >
            {ORDENES.map((o) => <option key={o.valor} value={o.valor}>{o.label}</option>)}
          </select>

          <button
            type="button"
            id="btnFiltros"
            className={`catalogo-filtros-btn${panelAbierto ? " active" : ""}`}
            onClick={togglePanel}
          >
            <i className="fa fa-search me-1" />Buscar
            {activos > 0 && <span style={estiloBadge("#c62828")}>{activos}</span>}
          </button>

          <div className="catalogo-toggle-bar">
            <button
              className={`catalogo-toggle-btn${vista === "cards" ? " active" : ""}`}
              onClick={() => setVista("cards")}
            >
              <i className="fa fa-th-large me-1" />Cards
            </button>
            <button
              className={`catalogo-toggle-btn${vista === "mapa" ? " active" : ""}`}
              onClick={() => verMapa(false)}
            >
              <i className="fa fa-map-marker-alt me-1" />Mapa
            </button>
            {puedeFavoritos && (
              <button
                className={`catalogo-toggle-btn${vista === "favoritos" ? " active" : ""}`}
                onClick={() => setVista("favoritos")}
              >
                <i className="fa fa-heart me-1" style={{ color: "#e53935" }} />Favoritos
                {favoritos.length > 0 && <span style={estiloBadge("#e53935")}>{favoritos.length}</span>}
              </button>
            )}
          </div>
        </div>
      </div>

      <ErrorBanner mensaje={error} onReintentar={recargar} />

      {panelAbierto && (
        <CatalogoFiltros
          filtros={filtros}
          onChange={cambiarFiltros}
          cantidad={filtradas.length}
          mostrarResumen={resumenVisible}
          onAplicarAlMapa={aplicarAlMapa}
          onLimpiar={limpiar}
        />
      )}

      {vista === "mapa" && <MapaCatalogo propiedades={mapaFiltrado ? filtradas : lista} />}

      {vista === "favoritos" && (
        <div id="favoritosEnCatalogo" className="mt-3">
          <div id="favoritosEnCatalogoLista">{vistaFavoritos()}</div>
        </div>
      )}

      {vista === "cards" && (
        !cargando && !filtradas.length ? sinResultados : (
          <div className="mt-3">
            <PropertyGrid
              id="catalogoLista"
              propiedades={filtradas}
              cargando={cargando}
              esFavorito={puedeFavoritos ? esFavorito : undefined}
              onFavorito={puedeFavoritos ? alternarFavorito : undefined}
              enComparador={enComparador}
              onComparar={alternarCmp}
            />
          </div>
        )
      )}

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

      {toastFav.texto && (
        <div
          id="toastFavorito"
          style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            background: "#6c2d20", color: "white", padding: ".6rem 1.4rem", borderRadius: 20,
            fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,.25)",
            transition: "opacity .3s", pointerEvents: "none", opacity: toastFav.visible ? 1 : 0,
          }}
        >
          {toastFav.texto}
        </div>
      )}
    </section>
  );
}

export default Catalogo;
