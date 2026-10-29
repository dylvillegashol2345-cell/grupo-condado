import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ecoItems, ecoItemsDeUsuario, listarContactosEco } from "../services/entidades";
import { useCarga } from "../hooks/useCarga";
import { useAuth } from "../context/authContext";
import { normalizarImagen } from "../utils/imagenes";
import { CATEGORIAS_ECOMARKET } from "../utils/catalogos";
import { BADGE_BS_ECO, precioEco, IMG_ECO_CARD, bandejaUnificada } from "../utils/ecomarket";
import PublicarItemModal from "../components/ecomarket/PublicarItemModal";
import EmptyState from "../components/common/EmptyState";

const BADGE_FLOTANTE = {
  display: "inline-flex", position: "absolute", top: -8, right: -8,
  background: "#c62828", color: "white", fontSize: 10, fontWeight: 700,
  minWidth: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center",
  padding: "0 4px", boxShadow: "0 2px 6px rgba(0,0,0,.3)",
};

function SkeletonEco() {
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

function EcoMarket() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [badges, setBadges] = useState({ mensajes: 0, contactos: 0 });
  const [categoria, setCategoria] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const { datos, cargando, error, recargar } = useCarga(() => ecoItems.listar(), []);
  const lista = useMemo(() => datos || [], [datos]);

  const filtrada = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return lista.filter((i) => {
      if (categoria && i.Categoria !== categoria) return false;
      if (q && ![i.Titulo, i.Descripcion, i.Categoria, i.NombrePublicador].join(" ").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [lista, categoria, busqueda]);

  useEffect(() => {
    if (!usuario) return undefined;
    let cancelado = false;
    Promise.all([ecoItemsDeUsuario(usuario.IdUsuario), listarContactosEco()])
      .then(async ([mios, todos]) => {
        const idsMios = new Set(mios.map((i) => Number(i.IdItem)));
        const contactos = todos.filter((c) => idsMios.has(Number(c.IdItem))).length;
        const convs = await bandejaUnificada(todos, mios, usuario);
        const mensajes = convs.reduce((a, c) => a + c.sinLeer, 0);
        if (!cancelado) setBadges({ mensajes, contactos });
      })
      .catch(() => { });
    return () => { cancelado = true; };
  }, [usuario, lista]);

  return (
    <section className="card-ghost mt-3" id="ecomarketForm">
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h5 className="mb-0"><i className="fa fa-leaf me-2" />EcoMarket</h5>
        <div className="d-flex gap-2">
          <button
            className="btn btn-light btn-sm"
            style={{ border: "1px solid var(--border)", position: "relative" }}
            onClick={() => navigate("/app/ecomarket/mensajes")}
          >
            <i className="fa fa-comments me-1" />Conversaciones
            {badges.mensajes > 0 && <span style={BADGE_FLOTANTE}>{badges.mensajes}</span>}
          </button>
          <button
            className="btn btn-light btn-sm"
            style={{ border: "1px solid var(--border)", position: "relative" }}
            onClick={() => navigate("/app/ecomarket/mis-publicaciones")}
          >
            <i className="fa fa-user me-1" />Mis publicaciones
            {badges.contactos > 0 && <span style={BADGE_FLOTANTE}>{badges.contactos}</span>}
          </button>
          <button className="btn btn-condado btn-sm" onClick={() => setModalAbierto(true)}>
            <i className="fa fa-plus me-1" />Publicar artículo
          </button>
        </div>
      </div>

      <p className="text-muted" style={{ fontSize: 13, marginBottom: "1.25rem" }}>
        Reutilizá, regalá o vendé muebles, electrodomésticos y más entre la comunidad de Grupo Condado.
      </p>

      <div className="card-ghost mb-4" style={{ padding: "1rem 1.25rem" }}>
        <div className="d-flex align-items-center flex-wrap gap-3">
          <div className="tabla-search-input" style={{ maxWidth: 260 }}>
            <i className="fa fa-search" />
            <input
              type="text"
              className="form-control form-control-sm"
              value={busqueda}
              placeholder="Buscar artículo..."
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 200 }}
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {CATEGORIAS_ECOMARKET.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="row g-3" id="ecomarketLista">
        {cargando ? (
          <SkeletonEco />
        ) : error ? (
          <p className="text-danger">Error al cargar EcoMarket. Verificá que la API esté corriendo.</p>
        ) : filtrada.length === 0 ? (
          <div className="col-12">
            <EmptyState
              icono="fa-leaf"
              titulo="Sin artículos"
              descripcion="Todavía no hay nada publicado en EcoMarket. ¡Sé el primero!"
            />
          </div>
        ) : (
          filtrada.map((item) => (
            <div className="col-md-4" key={item.IdItem}>
              <div className="card h-100 shadow-sm" style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
                <img
                  src={normalizarImagen(item.Imagen) || IMG_ECO_CARD}
                  onError={(e) => { if (e.currentTarget.src !== IMG_ECO_CARD) e.currentTarget.src = IMG_ECO_CARD; }}
                  alt={item.Titulo}
                  style={{ height: 180, objectFit: "cover", width: "100%" }}
                  loading="lazy"
                />
                <div className="card-body d-flex flex-column" style={{ padding: "1rem" }}>
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h6 style={{ fontWeight: 700, margin: 0 }}>{item.Titulo}</h6>
                    <span className={`badge bg-${BADGE_BS_ECO[item.Estado] || "secondary"}`}>{item.Estado}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: ".2rem 0" }}>
                    <i className="fa fa-tag me-1" />{item.Categoria || "Otros"}
                  </p>
                  <p style={{ fontSize: 14, margin: ".4rem 0" }}>
                    {item.EsGratis
                      ? <span style={{ color: "#2e7d32", fontWeight: 700 }}>GRATIS</span>
                      : <b>{precioEco(item)}</b>}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: ".2rem 0" }}>
                    Publicado por {item.NombrePublicador || "usuario"}
                  </p>
                  <div className="mt-auto pt-2">
                    <button
                      className="btn btn-sm btn-condado w-100"
                      style={{ fontSize: 12 }}
                      onClick={() => navigate(`/app/ecomarket/${item.IdItem}`)}
                    >
                      <i className="fa fa-eye me-1" />Ver más
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {modalAbierto && (
        <PublicarItemModal onCerrar={() => setModalAbierto(false)} onPublicado={recargar} />
      )}
    </section>
  );
}

export default EcoMarket;
