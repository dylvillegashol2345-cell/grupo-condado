import { createPortal } from "react-dom";

function ModalDebeLoguear({ onCancelar, onIniciarSesion }) {
  return createPortal(
    <div
      style={{
        display: "flex", position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(0,0,0,.5)", backdropFilter: "blur(3px)",
        alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        style={{
          background: "var(--surface)", borderRadius: 18, padding: "2rem 2.25rem",
          width: "100%", maxWidth: 380, textAlign: "center",
          boxShadow: "0 20px 50px rgba(0,0,0,.35)", animation: "modalIn .2s ease",
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: "var(--condado-light)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem",
        }}>
          <i className="fa fa-lock" style={{ fontSize: 22, color: "var(--condado)" }} />
        </div>
        <h5 style={{ fontFamily: "'Playfair Display',serif", color: "var(--condado)", marginBottom: ".4rem" }}>
          Iniciar sesión requerido
        </h5>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: "1.5rem" }}>
          Debés iniciar sesión para hacer una consulta.
        </p>
        <div style={{ display: "flex", gap: ".75rem", justifyContent: "center" }}>
          <button className="btn btn-light" style={{ border: "1.5px solid var(--border)", padding: ".55rem 1.4rem" }} onClick={onCancelar}>
            Cancelar
          </button>
          <button className="btn btn-condado" style={{ padding: ".55rem 1.4rem" }} onClick={onIniciarSesion}>
            <i className="fa fa-sign-in-alt me-2" />Iniciar sesión
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ModalDebeLoguear;
