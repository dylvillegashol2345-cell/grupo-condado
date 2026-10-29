import { useEffect } from "react";
import { createPortal } from "react-dom";

function Modal({ abierto, titulo, onCerrar, children, pie, ancho = 700 }) {
  useEffect(() => {
    if (!abierto) return undefined;
    function onKey(e) { if (e.key === "Escape") onCerrar(); }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return createPortal(
    <div
      className="modal-edicion-backdrop"
      style={{ display: "flex" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div className="modal-edicion-box" style={{ maxWidth: ancho }} role="dialog" aria-modal="true">
        <div className="modal-edicion-header">
          <h5>{titulo}</h5>
          <button className="modal-edicion-close" onClick={onCerrar} aria-label="Cerrar">&times;</button>
        </div>
        <div className="modal-edicion-body">
          {children}
          {pie && <div className="modal-edicion-footer">{pie}</div>}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
