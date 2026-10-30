import { useNavigate } from "react-router-dom";
import Modal from "../common/Modal";
import EcoBadge from "../common/EcoBadge";
import { IMG_PROPIEDAD_FALLBACK } from "../../utils/catalogos";
import { mejoresDe, esMejor } from "../../utils/comparador";
import { direccion } from "../../utils/format";
import "./ComparadorModal.css";

const BADGE_ESTADO = {
  Disponible: { bg: "#e8f5e9", color: "#2e7d32" },
  Alquilada:  { bg: "#e3f2fd", color: "#1565c0" },
};
const BADGE_OTRO = { bg: "#fce4ec", color: "#880e4f" };

const caract = (clave) => (p) => p.caract?.[clave] || "—";

const FILAS = [
  { label: "Foto", render: (p) => (
    <img src={p.image || IMG_PROPIEDAD_FALLBACK} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }} />
  ) },
  { label: "Dirección", render: (p) => direccion(p.barrio, p.calle, p.numeracion) },
  { label: "Localidad", render: (p) => p.localidad },
  { label: "Tipo",      render: (p) => p.type },
  { label: "Estado",    render: (p) => {
    const b = BADGE_ESTADO[p.estado] || BADGE_OTRO;
    return (
      <span style={{ background: b.bg, color: b.color, padding: ".2em .7em", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
        {p.estado || "—"}
      </span>
    );
  } },
  { label: "Precio", clave: "precio", render: (p) => <strong style={{ color: "#6c2d20", fontSize: 16 }}>{p.price}</strong> },
  { label: "Superficie", clave: "superficie", render: (p) => `${p.surface || "—"} m²` },
  { label: "Categoría Eco",   render: (p) => <EcoBadge clase={p.categoriaEco || "C"} /> },
  { label: "Paneles Solares", render: (p) => (p.paneles ? "✅ Sí" : "❌ No") },
  { label: "Aislamiento",     render: (p) => (p.aislamiento ? "✅ Sí" : "❌ No") },
  { label: "Dormitorios", render: caract("dormitorios") },
  { label: "Baños",       render: caract("banos") },
  { label: "Cochera",     render: caract("cochera") },
  { label: "Pileta",      render: caract("pileta") },
  { label: "Quincho",     render: caract("quincho") },
  { label: "Amoblado",    render: caract("amoblado") },
  { label: "Antigüedad",  render: caract("antiguedad") },
];

function ComparadorModal({ abierto, propiedades, onCerrar, onLimpiar }) {
  const navigate = useNavigate();
  const colW = Math.floor(100 / propiedades.length);
  const mejor = mejoresDe(propiedades);

  function verDetalle(id) {
    onCerrar();
    navigate(`/app/propiedades/${id}`);
  }

  const celda = {
    padding: ".6rem .85rem", fontSize: 13, textAlign: "center",
    borderRight: "1px solid var(--border)", width: `${colW}%`,
  };

  return (
    <Modal
      abierto={abierto}
      titulo={<><i className="fa fa-balance-scale me-2" />Comparar propiedades</>}
      onCerrar={onCerrar}
      ancho={700}
      pie={
        <>
          <button className="btn btn-light" onClick={onCerrar}>Cerrar</button>
          <button
            className="btn btn-light ms-2"
            style={{ borderColor: "#c62828", color: "#c62828" }}
            onClick={() => { onLimpiar(); onCerrar(); }}
          >
            <i className="fa fa-times me-1" />Limpiar selección
          </button>
        </>
      }
    >
      <div style={{ overflowX: "auto" }}>
        <table className="comparador-tabla" style={{ width: "100%", borderCollapse: "collapse", minWidth: propiedades.length * 220 }}>
          <tbody>
            {[...FILAS, { label: "Acción", render: (p) => (
              <button
                onClick={() => verDetalle(p.id)}
                style={{
                  background: "#6c2d20", color: "white", border: "none", borderRadius: 8,
                  padding: ".4rem .9rem", cursor: "pointer", fontSize: 12, width: "100%",
                }}
              >
                Ver detalle →
              </button>
            ) }].map((fila, i) => (
              <tr key={fila.label} style={{ background: i % 2 === 0 ? "var(--surface-2)" : "var(--surface)" }}>
                <td style={{
                  padding: ".6rem .85rem", fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
                  width: 110, borderRight: "1px solid var(--border)", whiteSpace: "nowrap",
                }}>
                  {fila.label}
                </td>
                {propiedades.map((p) => (
                  <td key={p.id} style={celda} className={esMejor(fila.clave, p, mejor) ? "valor-mejor" : undefined}>
                    {fila.render(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

export default ComparadorModal;
