import { ECO_COLORES } from "../../utils/catalogos";

function EcoBadge({ clase, style }) {
  const c = ECO_COLORES[clase] || { bg: "#e0e0e0", text: "#555", label: `Clase ${clase || "—"}` };
  return (
    <span className="eco-badge-color" style={{ background: c.bg, color: c.text, ...style }}>
      <i className="fa fa-leaf me-1" />{c.label}
    </span>
  );
}

export default EcoBadge;
