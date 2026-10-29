import { ECO_COLORES } from "./catalogos";
import { fechaCorta, diasRestantes } from "./format";

const TIPO_REPORTE = { 1: "Casa", 2: "Departamento", 3: "Lote", 4: "Terreno" };
const LOCALIDAD_REPORTE = {
  1: "Villa Maria", 2: "Córdoba Capital", 3: "Río Cuarto", 4: "Río Tercero", 5: "Cosquín",
  6: "Villa Allende", 7: "Alta Gracia", 8: "Villa Carlos Paz", 9: "Jesús María",
};

const ESTILOS = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1209; background: white; padding: 2rem; }
    .reporte-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1.25rem; border-bottom: 3px solid #6c2d20; margin-bottom: 1.5rem; }
    .reporte-logo { display: flex; align-items: center; gap: .75rem; }
    .reporte-logo-icon { width: 44px; height: 44px; background: #6c2d20; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; }
    .reporte-titulo { font-size: 1.3rem; font-weight: 700; color: #6c2d20; }
    .reporte-subtitulo { font-size: 12px; color: #6b5b52; margin-top: .2rem; }
    .reporte-titulo-bloque { text-align: right; }
    .reporte-meta { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .reporte-meta-item { background: #f5e9e6; border-radius: 8px; padding: .75rem 1.25rem; text-align: center; flex: 1; min-width: 120px; }
    .reporte-meta-item strong { display: block; font-size: 1.4rem; color: #6c2d20; font-weight: 700; }
    .reporte-meta-item span { font-size: 11px; color: #6b5b52; text-transform: uppercase; letter-spacing: .05em; }
    .reporte-table { width: 100%; border-collapse: collapse; margin-top: .5rem; }
    .reporte-table th { background: #6c2d20; color: white; padding: .5rem .75rem; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
    .reporte-table td { padding: .5rem .75rem; border-bottom: 1px solid #e8ddd8; font-size: 12px; }
    .reporte-table tr:nth-child(even) td { background: #fdf8f6; }
    .reporte-footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e8ddd8; font-size: 11px; color: #6b5b52; text-align: center; }
    .no-print { display: flex; gap: .75rem; justify-content: center; margin-top: 1.5rem; flex-wrap: wrap; }
    @media print { .no-print { display: none !important; } body { padding: .5rem; } }
  `;

function escapar(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const moneda = (m) => ((m || "ARS") === "USD" ? "USD " : "$");
const miles = (v) => Number(v || 0).toLocaleString("es-AR");

function cabecera(titulo, subtitulo) {
  const fecha = new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });
  return `
    <div class="reporte-header">
      <div class="reporte-logo">
        <div class="reporte-logo-icon"><i class="fa fa-building"></i></div>
        <div>
          <div style="font-weight:700;font-size:1rem;color:#6c2d20;">Grupo Condado</div>
          <div style="font-size:11px;color:#6b5b52;">Gestión Inmobiliaria</div>
        </div>
      </div>
      <div class="reporte-titulo-bloque">
        <p class="reporte-titulo">${titulo}</p>
        <p class="reporte-subtitulo">${subtitulo}</p>
        <p class="reporte-subtitulo">Generado el ${fecha}</p>
      </div>
    </div>`;
}

const PIE = `<div class="reporte-footer">
    Grupo Condado — Sistema de Gestión Inmobiliaria · Reporte generado automáticamente
  </div>`;

function metricas(items) {
  return `<div class="reporte-meta">${items
    .map(([valor, etiqueta]) => `<div class="reporte-meta-item"><strong>${valor}</strong>${etiqueta}</div>`)
    .join("")}</div>`;
}

function tabla(columnas, filas) {
  return `<table class="reporte-table">
    <thead><tr>${columnas.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
    <tbody>${filas.map((f) => `<tr>${f.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>`;
}

function ecoBadge(clase) {
  const c = ECO_COLORES[clase] || { bg: "#e0e0e0", text: "#555", label: "Clase " + (clase || "—") };
  return `<span class="eco-badge-color" style="background:${c.bg};color:${c.text};">
    <i class="fa fa-leaf me-1"></i>${escapar(c.label)}
  </span>`;
}

function abrirImpresion(contenido, nombreArchivo) {
  const fecha = new Date().toLocaleDateString("es-AR").replace(/\//g, "-");
  const nombre = nombreArchivo || `Reporte_GrupoCondado_${fecha}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${nombre}</title>
  <style>${ESTILOS}</style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
</head>
<body>
  <div id="contenidoReporte">${contenido}</div>
  <div class="no-print">
    <button onclick="descargarPDF()" style="background:#6c2d20;color:white;border:none;border-radius:8px;padding:.6rem 1.5rem;font-size:13px;font-weight:700;cursor:pointer;">
      📥 Descargar PDF
    </button>
    <button onclick="window.print()" style="background:white;color:#6c2d20;border:2px solid #6c2d20;border-radius:8px;padding:.6rem 1.5rem;font-size:13px;font-weight:700;cursor:pointer;">
      🖨 Imprimir
    </button>
    <button onclick="window.close()" style="background:#f5f0ee;color:#6b5b52;border:1px solid #d8ccc6;border-radius:8px;padding:.6rem 1.25rem;font-size:13px;cursor:pointer;">
      Cerrar
    </button>
  </div>
  <script>
    function descargarPDF(){
      const btn = document.querySelectorAll('.no-print button');
      btn.forEach(b => b.style.display = 'none');
      const opt = {
        margin: [10,10,10,10],
        filename: '${nombre}.pdf',
        image: { type:'jpeg', quality:0.98 },
        html2canvas: { scale:2, useCORS:true },
        jsPDF: { unit:'mm', format:'a4', orientation:'portrait' }
      };
      html2pdf().set(opt).from(document.getElementById('contenidoReporte')).save()
        .then(() => { btn.forEach(b => b.style.display = ''); });
    }
  </script>
</body>
</html>`;

  const ventana = window.open("", "_blank", "width=960,height=720");
  if (!ventana) {
    throw new Error("El navegador bloqueó la ventana emergente. Permitila para generar el reporte.");
  }
  ventana.document.write(html);
  ventana.document.close();
}

export function reportePropiedadesDisponibles(props) {
  const disponibles = props.filter((p) => p.Estado === "Disponible");
  const total = disponibles.reduce((a, p) => a + Number(p.Precio || 0), 0);

  abrirImpresion(
    cabecera("Propiedades Disponibles", "Inmuebles en venta o alquiler disponibles al día de hoy") +
      metricas([
        [disponibles.length, "Propiedades disponibles"],
        [`$${miles(total)}`, "Valor total del catálogo"],
        [disponibles.filter((p) => p.Publicada).length, "Publicadas"],
      ]) +
      tabla(
        ["Tipo", "Barrio", "Dirección", "Localidad", "Precio", "Sup. m²", "Clase Eco"],
        disponibles.map((p) => [
          TIPO_REPORTE[p.IdTipo] || "—",
          escapar(p.Barrio || "—"),
          `${escapar(p.Calle)} ${escapar(p.Numeracion)}`,
          LOCALIDAD_REPORTE[p.IdLocalidad] || "—",
          `${moneda(p.Moneda)}${miles(p.Precio)}`,
          escapar(p.Superficie || "—"),
          ecoBadge(p.CategoriaEco || "B"),
        ])
      ) +
      PIE,
    "Reporte_Propiedades_Disponibles"
  );
}

export function reporteContratos(contratos) {
  abrirImpresion(
    cabecera("Contratos Activos", "Contratos registrados con fechas de vigencia") +
      metricas([[contratos.length, "Contratos en total"]]) +
      tabla(
        ["Locatario", "Inmueble", "Fecha inicio", "Fecha fin", "Canon", "Días restantes"],
        contratos.map((c) => {
          const dias = diasRestantes(c.FechaFin);
          const diasLabel = dias === null
            ? "—"
            : dias > 0 ? `${dias} días` : '<span style="color:#c62828;">Vencido</span>';
          return [
            escapar(c.LocatarioNombre || "—"),
            escapar(c.InmuebleDireccion || "—"),
            fechaCorta(c.FechaInicio),
            fechaCorta(c.FechaFin),
            c.CanonMensual ? `${moneda(c.Moneda)}${miles(c.CanonMensual)}/mes` : "—",
            diasLabel,
          ];
        })
      ) +
      PIE,
    "Reporte_Contratos_Activos"
  );
}

export function reportePagos(pagos) {
  const ordenados = [...pagos].sort((a, b) => (Number(b.Monto) || 0) - (Number(a.Monto) || 0));
  const total = ordenados.reduce((a, p) => a + Number(p.Monto || 0), 0);
  const promedio = ordenados.length ? Math.round(total / ordenados.length) : 0;

  abrirImpresion(
    cabecera("Resumen de Cobros", "Cobros registrados en el sistema ordenados por monto") +
      metricas([
        [ordenados.length, "Cobros registrados"],
        [`$${miles(total)}`, "Monto total"],
        [`$${miles(promedio)}`, "Monto promedio"],
      ]) +
      tabla(
        ["Fecha", "Moneda", "Monto"],
        ordenados.map((p) => [
          fechaCorta(p.Fecha),
          escapar(p.Moneda || "ARS"),
          `<strong>${moneda(p.Moneda)}${miles(p.Monto)}</strong>`,
        ])
      ) +
      PIE,
    "Reporte_Cobros"
  );
}

export function reporteOperaciones(operaciones) {
  const ordenadas = [...operaciones].sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha));

  abrirImpresion(
    cabecera("Operaciones Realizadas", "Ventas y alquileres concretados, ordenados por fecha") +
      metricas([
        [ordenadas.length, "Operaciones totales"],
        [ordenadas.filter((o) => o.Tipo === "Venta").length, "Ventas"],
        [ordenadas.filter((o) => o.Tipo === "Alquiler").length, "Alquileres"],
      ]) +
      tabla(
        ["Tipo", "Fecha"],
        ordenadas.map((o) => [
          `<span style="background:${o.Tipo === "Venta" ? "#6c2d20" : "#1565c0"};color:white;
                padding:.15em .6em;border-radius:12px;font-size:11px;">${escapar(o.Tipo)}</span>`,
          fechaCorta(o.Fecha),
        ])
      ) +
      PIE,
    "Reporte_Operaciones"
  );
}

export function reporteEcoMarket(items) {
  const lista = Array.isArray(items) ? items : [];
  const entregados = lista.filter((i) => i.Estado === "Entregado").length;

  abrirImpresion(
    cabecera("Actividad EcoMarket", "Artículos publicados, reutilizados y entregados en la comunidad") +
      metricas([
        [lista.length, "Artículos publicados"],
        [entregados, "Entregados / reutilizados"],
        [lista.filter((i) => i.Estado === "Disponible").length, "Disponibles"],
        [lista.filter((i) => i.EsGratis).length, "Artículos gratuitos"],
      ]) +
      tabla(
        ["Título", "Categoría", "Precio", "Estado", "Publicador", "Fecha"],
        lista.map((i) => [
          escapar(i.Titulo || "—"),
          escapar(i.Categoria || "—"),
          i.EsGratis ? '<span style="color:#2e7d32;font-weight:700;">GRATIS</span>' : `$${miles(i.Precio)}`,
          escapar(i.Estado || "—"),
          escapar(i.NombrePublicador || "—"),
          fechaCorta(i.Fecha),
        ])
      ) +
      `<p style="font-size:12px;color:#2e7d32;font-weight:600;margin-top:.5rem;">
          ♻️ Impacto sustentable: ${entregados} artículo${entregados !== 1 ? "s" : ""} reutilizado${entregados !== 1 ? "s" : ""} gracias a EcoMarket.
        </p>` +
      PIE,
    "Reporte_EcoMarket"
  );
}
