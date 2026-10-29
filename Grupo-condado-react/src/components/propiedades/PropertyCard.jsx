import { useNavigate } from "react-router-dom";
import { IMG_PROPIEDAD_FALLBACK } from "../../utils/catalogos";
import EcoBadge from "../common/EcoBadge";
import BotonFavorito from "./BotonFavorito";

function PropertyCard({ propiedad, acciones, favorito, onFavorito, comparando, onComparar }) {
  const navigate = useNavigate();
  const p = propiedad;
  const verDetalle = () => navigate(`/app/propiedades/${p.id}`);

  const botonDetalle = (
    <button
      className="prop-card-btn"
      style={onComparar ? { flex: 1 } : undefined}
      onClick={(e) => { e.stopPropagation(); verDetalle(); }}
    >
      Ver detalles <i className="fa fa-arrow-right ms-1" />
    </button>
  );

  return (
    <div className="prop-card fade-in" style={{ position: "relative" }} onClick={verDetalle}>
      {onFavorito && <BotonFavorito activo={favorito} onClick={() => onFavorito(p.id)} />}

      <div className="prop-card-img-wrap">
        <img src={p.image || IMG_PROPIEDAD_FALLBACK} alt={p.type} className="prop-card-img" loading="lazy" />
        <span className="prop-card-tipo">{p.type}</span>
        {p.categoriaEco === "A" && (
          <span className="prop-card-eco"><i className="fa fa-leaf" /> Eco A</span>
        )}
      </div>

      <div className="prop-card-body">
        <div className="prop-card-precio">{p.price}</div>
        <h3 className="prop-card-titulo">{p.title}</h3>
        <p className="prop-card-loc">
          <i className="fa fa-map-marker-alt me-1" />{p.localidad}
        </p>

        {p.caracteristicas.length > 0 && (
          <div className="prop-card-caract">
            {p.caracteristicas.map((c, i) => (
              <span key={i}><i className={`fa ${c.icono} me-1`} />{c.texto}</span>
            ))}
          </div>
        )}

        <div className="prop-card-meta">
          <span><i className="fa fa-ruler-combined me-1" />{p.surface || "—"} m²</span>
          <EcoBadge clase={p.categoriaEco || "B"} />
          {p.paneles && <span><i className="fa fa-sun me-1" />Solar</span>}
        </div>

        {acciones ? (
          <div onClick={(e) => e.stopPropagation()}>{acciones}</div>
        ) : onComparar ? (
          <div style={{ display: "flex", gap: ".5rem", marginTop: ".5rem" }}>
            {botonDetalle}
            <button
              title={comparando ? "Quitar del comparador" : "Agregar al comparador"}
              onClick={(e) => { e.stopPropagation(); onComparar(p.id); }}
              style={{
                background: comparando ? "#6c2d20" : "var(--surface-2)",
                border: "1.5px solid",
                borderColor: comparando ? "#6c2d20" : "var(--border)",
                borderRadius: 8, padding: ".4rem .6rem", cursor: "pointer", fontSize: 13,
                color: comparando ? "white" : "var(--text-muted)",
                transition: "all .2s", flexShrink: 0,
              }}
            >
              <i className="fa fa-balance-scale" />
            </button>
          </div>
        ) : (
          botonDetalle
        )}
      </div>
    </div>
  );
}

export default PropertyCard;
