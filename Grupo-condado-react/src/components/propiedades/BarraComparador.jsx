import { createPortal } from "react-dom";
import { MIN_COMPARAR } from "../../utils/comparador";

function BarraComparador({ ids, onQuitar, onLimpiar, onComparar }) {
  if (!ids.length) return null;

  const deshabilitado = ids.length < MIN_COMPARAR;

  return createPortal(
    <div
      id="comparadorBarra"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999,
        background: "var(--condado)", color: "white",
        padding: ".75rem 1.5rem", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: "1rem",
        boxShadow: "0 -4px 20px rgba(0,0,0,.2)",
        animation: "slideUp .3s ease",
      }}
    >
      <style>{"@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}"}</style>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <i className="fa fa-balance-scale" style={{ fontSize: 18, opacity: 0.8 }} />
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          Comparando {ids.length} propiedad{ids.length !== 1 ? "es" : ""}
        </span>
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          {ids.map((id, i) => (
            <span
              key={id}
              style={{
                background: "rgba(255,255,255,.2)", padding: ".25em .75em", borderRadius: 20,
                fontSize: 12, display: "flex", alignItems: "center", gap: ".4rem",
              }}
            >
              Propiedad {i + 1}
              <button
                onClick={() => onQuitar(id)}
                style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 0, fontSize: 11, opacity: 0.8 }}
              >
                <i className="fa fa-times" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: ".75rem", flexShrink: 0 }}>
        <button
          onClick={onLimpiar}
          style={{
            background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)",
            color: "white", borderRadius: 8, padding: ".4rem .9rem", cursor: "pointer", fontSize: 13,
          }}
        >
          Limpiar
        </button>
        <button
          onClick={onComparar}
          disabled={deshabilitado}
          style={{
            background: "white", color: "#6c2d20", border: "none", borderRadius: 8,
            padding: ".4rem 1.1rem", cursor: deshabilitado ? "not-allowed" : "pointer",
            fontSize: 13, fontWeight: 700, opacity: deshabilitado ? 0.5 : 1,
          }}
        >
          <i className="fa fa-balance-scale me-1" />Comparar
        </button>
      </div>
    </div>,
    document.body
  );
}

export default BarraComparador;
