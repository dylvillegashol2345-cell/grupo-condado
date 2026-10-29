import { createPortal } from "react-dom";
import { propiedades, contratos, pagos, operaciones, ecoItems } from "../../services/entidades";
import { useUI } from "../../context/uiContext";
import {
  reportePropiedadesDisponibles,
  reporteContratos,
  reportePagos,
  reporteOperaciones,
  reporteEcoMarket,
} from "../../utils/reportes";

const REPORTES = [
  {
    clave: "disponibles", icono: "fa-home",
    titulo: "Propiedades disponibles",
    desc: "Listado completo de propiedades en venta o alquiler disponibles hoy",
    cargar: () => propiedades.listar(), generar: reportePropiedadesDisponibles,
  },
  {
    clave: "contratos", icono: "fa-file-contract",
    titulo: "Contratos activos",
    desc: "Contratos vigentes con fechas de inicio y vencimiento",
    cargar: () => contratos.listar(), generar: reporteContratos,
  },
  {
    clave: "pagos", icono: "fa-money-bill",
    titulo: "Resumen de pagos",
    desc: "Cobros registrados con montos y contratos asociados",
    cargar: () => pagos.listar(), generar: reportePagos,
  },
  {
    clave: "operaciones", icono: "fa-handshake",
    titulo: "Operaciones realizadas",
    desc: "Ventas y alquileres concretados, ordenados por fecha",
    cargar: () => operaciones.listar(), generar: reporteOperaciones,
  },
  {
    clave: "ecomarket", icono: "fa-leaf", colorIcono: "#2e7d32",
    titulo: "Actividad EcoMarket",
    desc: "Artículos publicados, estado de entrega e impacto sustentable",
    cargar: () => ecoItems.listar(), generar: reporteEcoMarket,
  },
];

function ModalReportes({ abierto, onCerrar }) {
  const { toast } = useUI();

  async function generar(reporte) {
    try {
      toast("⏳ Generando reporte...", "info", 2000);
      const datos = await reporte.cargar();
      onCerrar();
      reporte.generar(datos);
    } catch (err) {
      console.error("Error generando reporte:", err);
      toast("❌ Error al generar el reporte", "error");
    }
  }

  if (!abierto) return null;

  return createPortal(
    <div style={{
      display: "flex", position: "fixed", inset: 0, zIndex: 9998,
      background: "rgba(0,0,0,.5)", backdropFilter: "blur(3px)",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "var(--surface)", borderRadius: 18, padding: "2rem 2.25rem",
        width: "100%", maxWidth: 480,
        boxShadow: "0 20px 50px rgba(0,0,0,.35)", animation: "modalIn .2s ease",
      }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 style={{ fontFamily: "'Playfair Display',serif", color: "var(--condado)", margin: 0 }}>
            <i className="fa fa-file-export me-2" />Exportar reporte
          </h5>
          <button onClick={onCerrar}
            style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "var(--text-muted)" }}>
            &times;
          </button>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
          Seleccioná el reporte que querés generar. Se abre como PDF listo para imprimir o guardar.
        </p>
        <div className="d-flex flex-column gap-2">
          {REPORTES.map((r) => (
            <button key={r.clave} className="btn btn-light text-start"
              style={{ border: "1px solid var(--border)", padding: ".75rem 1rem" }}
              onClick={() => generar(r)}>
              <i className={`fa ${r.icono} me-2`} style={{ color: r.colorIcono || "var(--condado)", width: 16 }} />
              <strong>{r.titulo}</strong>
              <span className="d-block" style={{ fontSize: 12, color: "var(--text-muted)", marginTop: ".15rem" }}>
                {r.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ModalReportes;
