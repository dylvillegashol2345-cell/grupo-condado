import { createPortal } from "react-dom";
import { useUI } from "../../context/uiContext";

function ConfirmDialog() {
  const { confirmacion } = useUI();
  if (!confirmacion) return null;

  const { titulo, descripcion, textoConfirmar, peligro, variante, resolver } = confirmacion;

  if (variante === "eliminar") {
    return createPortal(
      <div
        id="modalConfirmarEliminar"
        style={{
          display: "flex", position: "fixed", inset: 0, zIndex: 99998,
          background: "rgba(0,0,0,.55)", alignItems: "center", justifyContent: "center",
        }}
      >
        <div style={{
          background: "var(--surface)", borderRadius: 16, padding: "2rem", maxWidth: 420, width: "90%",
          boxShadow: "0 24px 80px rgba(0,0,0,.3)", textAlign: "center", animation: "modalIn .2s ease",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", background: "#ffebee", color: "#c62828",
            fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem",
          }}>
            <i className="fa fa-trash" />
          </div>
          <h4 style={{ fontFamily: "'Playfair Display',serif", color: "var(--text-primary)", marginBottom: ".5rem" }}>
            ¿Eliminar este registro?
          </h4>
          <p id="confirmarEliminarMsg" style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: "1.5rem" }}>
            {descripcion || "¿Estás seguro? Esta acción no se puede deshacer."}
          </p>
          <div style={{ display: "flex", gap: ".75rem", justifyContent: "center" }}>
            <button onClick={() => resolver(false)} className="btn btn-light" style={{ minWidth: 120 }}>Cancelar</button>
            <button
              id="btnConfirmarEliminar"
              className="btn"
              style={{ background: "#c62828", color: "white", minWidth: 120 }}
              onClick={() => resolver(true)}
            >
              <i className="fa fa-trash me-1" />Eliminar
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      id="modalConfirmarBorrado"
      style={{
        display: "flex", position: "fixed", inset: 0, zIndex: 9996,
        background: "rgba(0,0,0,.5)", backdropFilter: "blur(3px)",
        alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        style={{
          background: "var(--surface)", borderRadius: 18, padding: "2rem 2.25rem",
          width: "100%", maxWidth: 400, textAlign: "center",
          boxShadow: "0 20px 50px rgba(0,0,0,.3)", animation: "modalIn .2s ease",
        }}
      >
        <div id="modalBorradoIcono" style={{
          width: 60, height: 60, borderRadius: "50%",
          background: peligro ? "#fdecea" : "var(--condado-light)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem",
        }}>
          <i
            className={`fa ${peligro ? "fa-trash" : "fa-question"}`}
            style={{ fontSize: 22, color: peligro ? "#c62828" : "var(--condado)" }}
          />
        </div>

        <h5 id="modalBorradoTitulo" style={{ fontFamily: "'Playfair Display',serif", color: "var(--text-primary)", marginBottom: ".4rem" }}>
          {titulo || "¿Eliminar?"}
        </h5>
        <p id="modalBorradoDesc" style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: "1.5rem" }}>
          {descripcion || "Esta acción no se puede deshacer."}
        </p>

        <div style={{ display: "flex", gap: ".75rem", justifyContent: "center" }}>
          <button
            className="btn btn-light"
            style={{ border: "1.5px solid var(--border)", padding: ".55rem 1.4rem" }}
            onClick={() => resolver(false)}
          >
            Cancelar
          </button>
          <button
            id="modalBorradoConfirmar"
            className={peligro ? "btn" : "btn btn-condado"}
            style={peligro
              ? { background: "#c62828", color: "white", padding: ".55rem 1.4rem", border: "none" }
              : { padding: ".55rem 1.4rem" }}
            onClick={() => resolver(true)}
          >
            <i className={`fa ${peligro ? "fa-trash" : "fa-check"} me-2`} />
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmDialog;
