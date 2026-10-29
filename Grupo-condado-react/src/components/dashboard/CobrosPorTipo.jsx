import { importe } from "../../utils/cotizacion";

const CHIP = { fontSize: 11, padding: ".2em .6em", borderRadius: 8, fontWeight: 600 };

function Tarjeta({ color, icono, titulo, datos, chipBg, moneda }) {
  return (
    <div style={{ flex: 1, minWidth: 200, background: "var(--surface-2)", borderRadius: 12, padding: "1rem", borderTop: `3px solid ${color}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".75rem" }}>
        <i className={`fa ${icono}`} style={{ color, fontSize: 14 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{titulo}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{importe(datos.cobrado, moneda)}</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: ".25rem" }}>
        {datos.cantidad} cobro{datos.cantidad !== 1 ? "s" : ""} registrado{datos.cantidad !== 1 ? "s" : ""}
      </div>
      <div style={{ marginTop: ".75rem", display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
        <span style={{ ...CHIP, background: chipBg, color }}>✅ {datos.conCobros} con cobros</span>
        <span style={{ ...CHIP, background: "#fff3e0", color: "#e65100" }}>
          ⏳ {datos.pendientes} pendiente{datos.pendientes !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

function CobrosPorTipo({ cobranza, moneda = "ARS" }) {
  return (
    <div style={{ display: "flex", gap: "1rem", width: "100%", flexWrap: "wrap" }}>
      <Tarjeta color="#1565c0" icono="fa-key" titulo="Alquiler" datos={cobranza.alquiler} chipBg="#e3f0ff" moneda={moneda} />
      <Tarjeta color="#6c2d20" icono="fa-handshake" titulo="Venta" datos={cobranza.venta} chipBg="#fce4e4" moneda={moneda} />
      <div style={{ width: "100%", background: "var(--surface-2)", borderRadius: 12, padding: ".75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "4px solid #2e7d32" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Total cobrado</span>
        <span style={{ fontSize: 18, fontWeight: 800, color: "#2e7d32" }}>{importe(cobranza.totalCobrado, moneda)}</span>
      </div>
      <div style={{ width: "100%", fontSize: 12, color: "var(--text-muted)", marginTop: "-.5rem" }}>
        {cobranza.pct}% de los contratos tiene al menos un cobro · {cobranza.sinPago} sin cobros
      </div>
    </div>
  );
}

export default CobrosPorTipo;
