import { createPortal } from "react-dom";
import { useUI } from "../../context/uiContext";

const ICONOS = {
  ok: "fa-check-circle",
  error: "fa-times-circle",
  info: "fa-info-circle",
  warn: "fa-exclamation-triangle",
};

const ANIMACION_NOTIF = `
  @keyframes slideInRight {
    from { opacity:0; transform:translateX(40px); }
    to   { opacity:1; transform:translateX(0); }
  }
`;

function ToastNotif({ t, cerrar }) {
  return (
    <div
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        background: "var(--surface)", border: "1px solid var(--border)",
        borderLeft: `4px solid ${t.color}`, borderRadius: 12,
        padding: "1rem 1.25rem", minWidth: 280, maxWidth: 340,
        boxShadow: "0 8px 32px rgba(0,0,0,.18)",
        display: "flex", gap: ".75rem", alignItems: "flex-start",
        animation: "slideInRight .3s ease", cursor: "pointer",
        ...(t.saliendo ? { opacity: 0, transform: "translateX(20px)", transition: "all .3s" } : null),
      }}
      onClick={(e) => {
        if (e.target.closest("button")) return;
        t.onClick?.();
        cerrar();
      }}
    >
      <div style={{
        background: `${t.color}20`, color: t.color, width: 36, height: 36, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 15,
      }}>
        <i className={`fa ${t.icono}`} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: ".2rem" }}>{t.mensaje}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.desc}</div>
      </div>
      <button
        onClick={cerrar}
        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0, fontSize: 14 }}
      >
        <i className="fa fa-times" />
      </button>
    </div>
  );
}

function ToastStack() {
  const { toasts, cerrarToast } = useUI();
  if (!toasts.length) return null;

  const comunes = toasts.filter((t) => !t.desc);
  const notifs = toasts.filter((t) => t.desc);

  return createPortal(
    <>
      <div
        id="toastContainer"
        style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 9997, display: "flex", flexDirection: "column", gap: ".5rem",
          alignItems: "center", pointerEvents: "none",
        }}
      >
        {comunes.map((t) => (
          <div key={t.id} className={`toast-msg toast-${t.tipo}${t.saliendo ? " toast-out" : ""}`}>
            <i className={`fa ${ICONOS[t.tipo] || "fa-info-circle"}`} />
            {t.mensaje}
          </div>
        ))}
      </div>
      {notifs.length > 0 && <style>{ANIMACION_NOTIF}</style>}
      {notifs.map((t) => (
        <ToastNotif key={t.id} t={t} cerrar={() => cerrarToast(t.id)} />
      ))}
    </>,
    document.body
  );
}

export default ToastStack;
