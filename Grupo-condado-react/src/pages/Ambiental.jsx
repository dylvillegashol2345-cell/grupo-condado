import { useMemo } from "react";
import { propiedades, ecoItems } from "../services/entidades";
import { useCarga } from "../hooks/useCarga";
import { metricasAmbientales, fraseImpacto } from "../utils/ambiental";
import { normalizarImagen } from "../utils/imagenes";
import Grafico from "../components/dashboard/Grafico";

const OPCIONES_DONA = {
  plugins: {
    legend: { position: "bottom", labels: { font: { size: 12 }, padding: 14, color: "#6b5b52" } },
    tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} propiedades` } },
  },
  cutout: "60%",
};

const OPCIONES_BARRAS = {
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1, color: "#a0918a" }, grid: { color: "#f0ebe8" } },
    x: { ticks: { color: "#6b5b52", font: { size: 11 } }, grid: { display: false } },
  },
};

const COLOR_ESTADO = { Entregado: "#2e7d32", Disponible: "#1565c0" };

const FILA = { display: "flex", alignItems: "center", gap: ".75rem", padding: ".6rem .5rem", borderBottom: "1px solid var(--border)" };
const TITULO_FILA = { fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

function Kpi({ color, icono, etiqueta, valor, sub, idValor }) {
  return (
    <div className="col-6 col-md-3">
      <div className="kpi-card" style={{ borderTop: `3px solid ${color}` }}>
        <span className="kpi-label"><i className={`fa ${icono} me-1`} />{etiqueta}</span>
        <span className="kpi-value" id={idValor} style={{ color }}>{valor}</span>
        <span className="kpi-sub">{sub}</span>
      </div>
    </div>
  );
}

function Ambiental() {
  const { datos, recargar } = useCarga(
    async () => {
      const [props, items] = await Promise.all([propiedades.listar(), ecoItems.listar()]);
      return { props, items };
    },
    []
  );

  const m = useMemo(
    () => (datos ? metricasAmbientales(datos.props, datos.items) : null),
    [datos]
  );

  return (
    <section className="card-ghost mt-3" id="ambientalSection">
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h5 className="mb-0"><i className="fa fa-seedling me-2" style={{ color: "#2e7d32" }} />Impacto Ambiental — Grupo Condado</h5>
        <button className="btn btn-light btn-sm" onClick={recargar} style={{ border: "1px solid var(--border)" }}>
          <i className="fa fa-sync me-1" />Actualizar
        </button>
      </div>

      <div className="row g-3 mb-4" id="ambientalKpis">
        <Kpi color="#2e7d32" icono="fa-recycle" etiqueta="Artículos donados" idValor="kpiDonados"
          valor={m ? m.publicados : "—"} sub={m ? `${m.entregados} entregados` : ""} />
        <Kpi color="#1565c0" icono="fa-solar-panel" etiqueta="Prop. con paneles" idValor="kpiPaneles"
          valor={m ? m.conPaneles : "—"} sub={m ? `${m.pctPaneles}% del catálogo` : ""} />
        <Kpi color="#00838f" icono="fa-wind" etiqueta="CO₂ estimado ahorrado" idValor="kpiCO2"
          valor={m ? `${m.co2Toneladas}t` : "—"} sub="kg/año estimado" />
        <Kpi color="#e65100" icono="fa-thermometer-half" etiqueta="Prop. con aislamiento" idValor="kpiAislamiento"
          valor={m ? m.conAislamiento : "—"} sub={m ? `${m.pctAislamiento}% del catálogo` : ""} />
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card-ghost">
            <h6 className="chart-title"><i className="fa fa-chart-pie me-2" style={{ color: "#2e7d32" }} />Categorías Eco del catálogo de propiedades</h6>
            <p className="chart-sub">Distribución de propiedades por clase energética</p>
            {m ? <Grafico tipo="doughnut" data={m.graficoClase} options={OPCIONES_DONA} alto={240} /> : <div style={{ height: 240 }} />}
          </div>
        </div>
        <div className="col-md-6">
          <div className="card-ghost">
            <h6 className="chart-title"><i className="fa fa-chart-bar me-2" style={{ color: "#00838f" }} />EcoMarket — Actividad por categoría</h6>
            <p className="chart-sub">Artículos publicados por categoría en el marketplace</p>
            {m ? <Grafico tipo="bar" data={m.graficoCategorias} options={OPCIONES_BARRAS} alto={240} /> : <div style={{ height: 240 }} />}
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-7">
          <div className="card-ghost">
            <h6 className="chart-title"><i className="fa fa-leaf me-2" style={{ color: "#2e7d32" }} />Últimas donaciones / artículos</h6>
            <div id="ambientalEcoLista" style={{ maxHeight: 320, overflowY: "auto" }}>
              {m && (m.recientesEco.length ? m.recientesEco.map((i) => (
                <div style={FILA} key={i.IdItem}>
                  <img
                    src={normalizarImagen(i.Imagen) || ""}
                    alt=""
                    style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, flexShrink: 0, display: i.Imagen ? undefined : "none" }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...TITULO_FILA, color: "var(--text-primary)" }}>{i.Titulo || "—"}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {i.Categoria || "—"} ·{" "}
                      <span style={{ color: COLOR_ESTADO[i.Estado] || "#e65100", fontWeight: 600 }}>{i.Estado || "—"}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: i.EsGratis ? "#2e7d32" : "#6c2d20" }}>
                    {i.EsGratis ? "🎁 Gratis" : "$" + Number(i.Precio || 0).toLocaleString("es-AR")}
                  </div>
                </div>
              )) : <p className="text-muted p-3 text-center">Sin artículos en EcoMarket aún.</p>)}
            </div>
          </div>
        </div>
        <div className="col-md-5">
          <div className="card-ghost">
            <h6 className="chart-title"><i className="fa fa-home me-2" style={{ color: "#1565c0" }} />Propiedades más sustentables</h6>
            <p className="chart-sub">Clase A con paneles solares y aislamiento</p>
            <div id="ambientalPropSust" style={{ maxHeight: 320, overflowY: "auto" }}>
              {m && (m.sustentables.length ? m.sustentables.map((p) => (
                <div style={FILA} key={p.IdPropiedad}>
                  <div style={{ width: 36, height: 36, background: "#e8f5e9", borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="fa fa-leaf" style={{ color: "#2e7d32", fontSize: 14 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={TITULO_FILA}>
                      {p.Barrio || ""} · {p.Calle || ""} {p.Numeracion || ""}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      ☀️ Paneles · 🌿 Clase A {p.AislamientoTermico ? "· 🌡️ Aislamiento" : ""}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, background: "#e8f5e9", color: "#2e7d32", padding: ".2em .6em", borderRadius: 8, fontWeight: 700 }}>ECO A</span>
                </div>
              )) : <p className="text-muted p-3 text-center">Sin propiedades Clase A con paneles aún.</p>)}
            </div>
          </div>
        </div>
      </div>

      <div
        id="ambientalMensaje"
        className="mt-4"
        style={{ background: "linear-gradient(135deg,#1b5e20,#2e7d32)", borderRadius: 16, padding: "1.5rem", color: "white", textAlign: "center" }}
      >
        <i className="fa fa-globe-americas fa-2x mb-2" style={{ display: "block", opacity: 0.8 }} />
        <strong style={{ fontSize: 16 }}>Grupo Condado comprometido con el planeta</strong>
        <p style={{ fontSize: 13, opacity: 0.85, marginTop: ".5rem", marginBottom: 0 }} id="ambientalFrase">
          {m ? fraseImpacto(m) : "Cargando datos ambientales..."}
        </p>
      </div>
    </section>
  );
}

export default Ambiental;
