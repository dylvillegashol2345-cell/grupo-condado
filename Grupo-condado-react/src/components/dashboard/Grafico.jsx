import { useEffect, useRef } from "react";
import { useChartJs } from "../../hooks/useCdn";

function Grafico({ tipo, data, options, alto = 260 }) {
  const canvas = useRef(null);
  const chart = useRef(null);
  const listo = useChartJs();

  const opciones = useRef(options);
  const formaOpciones = JSON.stringify(options ?? {});

  useEffect(() => { opciones.current = options; });

  useEffect(() => {
    if (!listo || !canvas.current) return undefined;
    const Chart = window.Chart;

    if (chart.current) { chart.current.destroy(); chart.current = null; }

    chart.current = new Chart(canvas.current, {
      type: tipo,
      data,
      options: { responsive: true, maintainAspectRatio: false, ...opciones.current },
    });

    return () => {
      if (chart.current) { chart.current.destroy(); chart.current = null; }
    };
  }, [listo, tipo, data, formaOpciones]);

  return (
    <div style={{ position: "relative", height: alto }}>
      {listo ? <canvas ref={canvas} /> : <div className="mapa-placeholder">Cargando gráfico…</div>}
    </div>
  );
}

export default Grafico;
