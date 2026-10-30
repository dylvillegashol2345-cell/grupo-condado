import { importe } from "./cotizacion";
import { leerTour } from "./tour360";

const e = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const absoluta = (src) => (src.startsWith("data:") ? src : new URL(src, window.location.origin).href);

const ESTILOS = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #f5f0ee; font-family: Arial, Helvetica, sans-serif; color: #2b211d; }
  .barra { position: sticky; top: 0; z-index: 5; display: flex; gap: .5rem; justify-content: center; padding: .75rem; background: white; border-bottom: 1px solid #e5dbd6; }
  .barra button { border-radius: 8px; padding: .5rem 1.1rem; font-weight: 700; cursor: pointer; font-size: 14px; }
  #documento { width: 210mm; margin: 1rem auto; background: white; padding: 12mm 14mm; box-shadow: 0 4px 20px rgba(0,0,0,.08); }
  .membrete { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #6c2d20; padding-bottom: 3mm; margin-bottom: 5mm; }
  .marca { font-family: Georgia, serif; font-size: 20px; font-weight: 700; color: #6c2d20; }
  .marca small { display: block; font-family: Arial, sans-serif; font-size: 10px; font-weight: 400; color: #8a7a72; letter-spacing: .08em; text-transform: uppercase; }
  .fecha { font-size: 10px; color: #8a7a72; text-align: right; }
  .cabecera { display: flex; justify-content: space-between; gap: 6mm; align-items: flex-start; margin-bottom: 4mm; }
  .tipo { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #6c2d20; margin: 0 0 1mm; }
  h1 { font-family: Georgia, serif; font-size: 22px; margin: 0 0 1mm; }
  .dir { font-size: 12px; color: #6b5b52; margin: 0; }
  .precio { text-align: right; white-space: nowrap; }
  .precio strong { display: block; font-family: Georgia, serif; font-size: 24px; color: #6c2d20; }
  .estado { display: inline-block; margin-top: 1mm; padding: .15em .7em; border-radius: 8px; font-size: 10px; font-weight: 700; background: #f3e9e5; color: #6c2d20; }
  .foto-principal { width: 100%; height: 82mm; object-fit: cover; border-radius: 3mm; display: block; }
  .fotos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2mm; margin-top: 2mm; }
  .fotos img { width: 100%; height: 26mm; object-fit: cover; border-radius: 2mm; display: block; }
  .bloque { margin-top: 5mm; page-break-inside: avoid; break-inside: avoid; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #6c2d20; border-bottom: 1px solid #e5dbd6; padding-bottom: 1.5mm; margin: 0 0 2.5mm; }
  .datos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2mm 4mm; }
  .dato { font-size: 11px; }
  .dato span { display: block; font-size: 9px; color: #8a7a72; text-transform: uppercase; letter-spacing: .05em; }
  .dato b { font-size: 12px; }
  .texto { font-size: 11px; line-height: 1.5; margin: 0; }
  .credito { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; background: #f9f4f2; border-radius: 3mm; padding: 3mm 4mm; }
  .credito .cuota b { color: #6c2d20; font-size: 15px; }
  .aviso { font-size: 9px; color: #8a7a72; margin: 2mm 0 0; }
  .pie { margin-top: 6mm; padding-top: 3mm; border-top: 2px solid #6c2d20; display: flex; justify-content: space-between; font-size: 10px; color: #6b5b52; }
  @media print { .barra { display: none; } body { background: white; } #documento { margin: 0; box-shadow: none; } }
`;

function htmlFicha({ p, fotos, caracteristicas, servicios, honorarios }) {
  const [principal, ...resto] = fotos.map(absoluta);
  const ambientes = leerTour(p.tour360).filter((s) => s.imagen).length;
  const datos = [
    ["Superficie", p.surface ? `${p.surface} m²` : "—"],
    ["Clase energética", `Clase ${p.categoriaEco || "B"}`],
    ["Paneles solares", p.paneles ? "Sí" : "No"],
    ["Aislamiento térmico", p.aislamiento ? "Sí" : "No"],
    ...(caracteristicas || []).map((c) => [c.label, c.valor]),
  ];
  const hoy = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });

  return `
    <div class="membrete">
      <div class="marca">Grupo Condado<small>Gestión Inmobiliaria</small></div>
      <div class="fecha">Ficha de propiedad<br>${e(hoy)}</div>
    </div>

    <div class="cabecera">
      <div>
        <p class="tipo">${e(p.type)}</p>
        <h1>${e(p.barrio)}, ${e(p.localidad)}</h1>
        <p class="dir">${e(`${p.calle} ${p.numeracion}`.trim() || "Dirección a confirmar")}</p>
      </div>
      <div class="precio">
        <strong>${e(p.price)}</strong>
        <span class="estado">${e(p.estado)}</span>
      </div>
    </div>

    <img class="foto-principal" src="${e(principal)}" alt="">
    ${resto.length ? `<div class="fotos">${resto.slice(0, 4).map((f) => `<img src="${e(f)}" alt="">`).join("")}</div>` : ""}

    <div class="bloque">
      <h2>Características</h2>
      <div class="datos">${datos.map(([k, v]) => `<div class="dato"><span>${e(k)}</span><b>${e(v)}</b></div>`).join("")}</div>
    </div>

    ${servicios.length ? `
    <div class="bloque">
      <h2>Servicios</h2>
      <p class="texto">${servicios.map(e).join(" · ")}</p>
    </div>` : ""}

    <div class="bloque">
      <h2>Documentación${ambientes ? " y recorrido virtual" : ""}</h2>
      <p class="texto">
        Matrícula ${p.matricula ? "verificada" : "pendiente"} · Título ${p.titulo ? "digital" : "pendiente"}
        ${ambientes ? `<br>Recorrido virtual 360 disponible en nuestro sitio${ambientes > 1 ? ` (${ambientes} ambientes)` : ""}.` : ""}
      </p>
    </div>

    ${honorarios && honorarios.total > 0 ? `
    <div class="bloque">
      <h2>Honorarios de la inmobiliaria</h2>
      <div class="credito">
        <div class="dato"><span>Operación</span><b>${e(honorarios.operacion)} · ${e(honorarios.pct)}%</b></div>
        <div class="dato"><span>${honorarios.operacion === "Alquiler" ? "Total del contrato" : "Precio"}</span><b>${e(importe(honorarios.base, honorarios.operacion === "Alquiler" ? "ARS" : p.moneda))}</b></div>
        <div class="dato"><span>Honorarios totales</span><b>${e(importe(honorarios.total, honorarios.operacion === "Alquiler" ? "ARS" : p.moneda))}</b></div>
        <div class="dato cuota"><span>${honorarios.cuotas === 1 ? "Un pago" : `${honorarios.cuotas} cuotas de`}</span><b>${e(importe(honorarios.cuota, honorarios.operacion === "Alquiler" ? "ARS" : p.moneda))}</b></div>
      </div>
      <p class="aviso">Comisión de Grupo Condado: ${e(honorarios.pct)}% ${honorarios.operacion === "Alquiler" ? "del total del contrato" : "del precio"}, en 1 a 3 cuotas.</p>
    </div>` : ""}

    <div class="pie">
      <span><b>Grupo Condado</b> · Córdoba, Argentina</span>
      <span>info@grupocondado.com.ar</span>
    </div>`;
}

export function abrirFichaPropiedad(datos, ventana = window.open("", "_blank", "width=980,height=760")) {
  if (!ventana) throw new Error("El navegador bloqueó la ventana emergente. Permitila para generar la ficha.");
  const { p } = datos;
  const nombre = `Ficha_${p.type}_${p.barrio}`.replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]/g, "").replace(/\s+/g, "_");

  ventana.document.open();
  ventana.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${e(nombre)}</title>
  <style>${ESTILOS}</style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
</head>
<body>
  <div class="barra">
    <button id="btnPdf" onclick="descargarPDF()" style="background:#6c2d20;color:white;border:none;">📥 Descargar PDF</button>
    <button onclick="window.print()" style="background:white;color:#6c2d20;border:2px solid #6c2d20;">🖨 Imprimir</button>
    <button onclick="window.close()" style="background:#f5f0ee;color:#6b5b52;border:1px solid #d8ccc6;font-weight:400;">Cerrar</button>
  </div>
  <div id="documento">${htmlFicha(datos)}</div>
  <script>
    function descargarPDF(){
      var btn = document.getElementById('btnPdf');
      btn.disabled = true; btn.textContent = 'Generando...';
      var doc = document.getElementById('documento');
      var prev = { pad: doc.style.padding, w: doc.style.width, m: doc.style.margin, s: doc.style.boxShadow };
      doc.style.padding = '0'; doc.style.width = '182mm'; doc.style.margin = '0'; doc.style.boxShadow = 'none';
      /* Con la barra de desplazamiento visible, html2canvas corre el contenido unos píxeles. */
      var prevOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      html2pdf().set({
        margin: [12, 14, 12, 14],
        filename: '${nombre}.pdf',
        image: { type: 'jpeg', quality: 0.85 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      }).from(doc).save().then(function(){
        document.documentElement.style.overflow = prevOverflow;
        doc.style.padding = prev.pad; doc.style.width = prev.w; doc.style.margin = prev.m; doc.style.boxShadow = prev.s;
        btn.disabled = false; btn.textContent = '📥 Descargar PDF';
      });
    }
  </script>
</body>
</html>`);
  ventana.document.close();
}
