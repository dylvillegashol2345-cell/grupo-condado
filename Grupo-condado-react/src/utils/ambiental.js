export const CO2_POR_PANEL = 800;        // Kg de CO₂ al año que evita una propiedad con paneles
export const CO2_POR_AISLAMIENTO = 300;  // Kg al año por aislamiento térmico
export const CO2_POR_ARTICULO = 15;      // Kg por artículo que vuelve a circular en EcoMarket

const COLORES_ECO = ["#2e7d32", "#66bb6a", "#a5d6a7", "#e0e0e0"];
const COLORES_CATEGORIA = ["#2e7d32", "#00838f", "#1565c0", "#e65100", "#6a1b9a", "#37474f", "#f9a825"];

function pct(parte, total) {
  return total ? Math.round((parte / total) * 100) : 0;
}

export function metricasAmbientales(propiedades = [], ecoItems = []) {
  const total = propiedades.length;
  const conPaneles = propiedades.filter((p) => p.PanelesSolares).length;
  const conAislamiento = propiedades.filter((p) => p.AislamientoTermico).length;
  const publicados = ecoItems.length;
  const entregados = ecoItems.filter((i) => i.Estado === "Entregado").length;

  const co2Kg = conPaneles * CO2_POR_PANEL
    + conAislamiento * CO2_POR_AISLAMIENTO
    + publicados * CO2_POR_ARTICULO;

  const porClase = { A: 0, B: 0, C: 0, "Sin categoría": 0 };
  propiedades.forEach((p) => {
    const clase = p.CategoriaEco || "Sin categoría";
    porClase[clase] = (porClase[clase] || 0) + 1;
  });

  const porCategoria = {};
  ecoItems.forEach((i) => {
    const cat = i.Categoria || "Otros";
    porCategoria[cat] = (porCategoria[cat] || 0) + 1;
  });
  const categoriasOrdenadas = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);

  return {
    total,
    conPaneles,
    pctPaneles: pct(conPaneles, total),
    conAislamiento,
    pctAislamiento: pct(conAislamiento, total),
    publicados,
    entregados,
    co2Kg,
    co2Toneladas: (co2Kg / 1000).toFixed(1),
    sustentables: propiedades.filter((p) => p.CategoriaEco === "A" && p.PanelesSolares).slice(0, 6),
    recientesEco: ecoItems.slice(0, 8),
    graficoClase: {
      labels: ["Clase A 🌿", "Clase B", "Clase C", "Sin categoría"],
      datasets: [{
        data: [porClase.A, porClase.B, porClase.C, porClase["Sin categoría"]],
        backgroundColor: COLORES_ECO,
        borderColor: "#fff",
        borderWidth: 3,
        hoverOffset: 8,
      }],
    },
    graficoCategorias: {
      labels: categoriasOrdenadas.map(([k]) => k),
      datasets: [{
        label: "Artículos",
        data: categoriasOrdenadas.map(([, v]) => v),
        backgroundColor: COLORES_CATEGORIA.slice(0, categoriasOrdenadas.length),
        borderRadius: 8,
        borderWidth: 0,
      }],
    },
  };
}

export function fraseImpacto(m) {
  return `Con ${m.conPaneles} propiedades con paneles solares, ${m.conAislamiento} con `
    + `aislamiento térmico y ${m.publicados} artículos circulando en el EcoMarket, `
    + `Grupo Condado evitó aproximadamente ${m.co2Toneladas} toneladas de CO₂ este año.`;
}
