import { useContadorAnimado } from "../../hooks/useContadorAnimado";

function KpiCard({ icono, etiqueta, valor, detalle, tono = "proc", tendencia, colorValor, estiloIcono }) {
  const esNumero = typeof valor === "number";
  const animado = useContadorAnimado(esNumero ? valor : 0);

  return (
    <div className={`kpi-card kpi-${tono}`}>
      <div className="kpi-icon" style={estiloIcono}><i className={`fa ${icono}`} /></div>
      <div className="kpi-body">
        <span className="kpi-label">{etiqueta}</span>
        <span className="kpi-value" style={colorValor ? { color: colorValor } : undefined}>
          {esNumero ? animado.toLocaleString("es-AR") : valor}
        </span>
        {detalle !== undefined && <span className="kpi-sub">{detalle}</span>}
      </div>
      {typeof tendencia === "number" && (
        <div className="kpi-tend">
          {tendencia !== 0 && (
            <span style={{ color: tendencia > 0 ? "#2e7d32" : "#c62828", fontSize: 11, fontWeight: 700 }}>
              <i className={`fa fa-arrow-${tendencia > 0 ? "up" : "down"} me-1`} />
              {tendencia > 0 ? "+" : ""}{tendencia}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default KpiCard;
