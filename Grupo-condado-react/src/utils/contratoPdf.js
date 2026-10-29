import { fechaLocal, numero } from "./format";

function escapar(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const ESTILOS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #111; background: white; padding: 2cm; }
  .membrete { text-align:center; border-bottom: 3px double #5a1e14; padding-bottom: 1rem; margin-bottom: 1.5rem; }
  .membrete-logo { font-size: 22pt; font-weight: bold; color: #5a1e14; letter-spacing: 2px; }
  .membrete-sub { font-size: 10pt; color: #666; margin-top: .25rem; }
  .membrete-linea { font-size: 9pt; color: #888; margin-top: .15rem; }
  .titulo-contrato { text-align:center; margin: 1.5rem 0; }
  .titulo-contrato h1 { font-size: 14pt; font-weight: bold; text-decoration: underline; letter-spacing: 1px; }
  .titulo-contrato p { font-size: 9pt; color: #555; margin-top: .4rem; }
  .clausula { margin: 1.2rem 0; text-align: justify; line-height: 1.7; }
  .clausula-titulo { font-weight: bold; font-size: 11pt; }
  .clausula-num { display: inline-block; min-width: 80px; }
  .datos-tabla { width:100%; border-collapse:collapse; margin: .5rem 0; font-size:10pt; }
  .datos-tabla td { padding: .3rem .5rem; border: 1px solid #ccc; }
  .datos-tabla td:first-child { font-weight:bold; background:#f5f0ef; width:35%; }
  .expensas-tabla { width:100%; border-collapse:collapse; margin: .5rem 0; font-size:10pt; }
  .expensas-tabla th { background:#5a1e14; color:white; padding: .4rem .6rem; text-align:left; }
  .expensas-tabla td { padding: .35rem .6rem; border: 1px solid #ddd; }
  .expensas-tabla tr:nth-child(even) td { background:#fdf8f6; }
  .firma-section { margin-top: 3rem; page-break-inside: avoid; }
  .firma-grid { display:grid; grid-template-columns:1fr 1fr; gap: 2rem; margin-top: 1rem; }
  .firma-box { text-align:center; }
  .firma-linea { border-top: 1px solid #333; margin-top: 2.5rem; padding-top: .4rem; font-size: 10pt; }
  .firma-sub { font-size: 9pt; color: #555; margin-top: .15rem; }
  .sello { margin-top: 3rem; text-align:center; border: 1px dashed #aaa; padding: 1rem; }
  .sello-titulo { font-size: 10pt; font-weight: bold; color: #5a1e14; }
  .sello-sub { font-size: 9pt; color: #777; margin-top: .25rem; }
  .doc-recibidos { margin: .5rem 0; font-size: 10pt; }
  .doc-item { display:inline-block; margin: .2rem .4rem; padding: .15rem .5rem; border: 1px solid #5a1e14; border-radius:4px; font-size:9pt; }
  .observaciones-box { border: 1px solid #ccc; padding: .75rem; min-height: 60px; margin-top: .5rem; font-size:10pt; background:#fafafa; }
  .deuda-alerta { background:#fff3cd; border:1px solid #ffc107; border-radius:4px; padding: .5rem .75rem; font-size:10pt; margin:.5rem 0; }
  .pie-pagina { margin-top: 2rem; padding-top: .75rem; border-top: 1px solid #ccc; text-align:center; font-size: 8pt; color: #888; }
  @media print {
    body { padding: 1.5cm; }
    .no-print { display:none; }
    @page { size: A4; margin: 1.5cm; }
  }
`;

const RAYA = "___________________________";

function abrirDocumento(html, ventana = window.open("", "_blank", "width=900,height=700")) {
  if (!ventana) {
    throw new Error("El navegador bloqueó la ventana emergente. Permitila para generar el contrato.");
  }
  ventana.document.write(html);
  ventana.document.close();
}

export function exportarContratoPDF(c, ventana) {
  if (!c) throw new Error("No se encontró el contrato");
  return boletoVenta(c, ventana);
}

function boletoVenta(c, ventana) {
  const e = escapar;
  const moneda = c.Moneda === "USD" ? "USD" : "$";
  const importe = (v) => (v ? `${moneda} ${numero(v)}` : "___________");
  const precioTotal = importe(c.PrecioTotal);
  const sena = importe(c.Sena);
  const saldo = importe(Math.max(0, (Number(c.PrecioTotal) || 0) - (Number(c.Sena) || 0)));
  const hoy = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  const firma = c.FechaInicio ? fechaLocal(c.FechaInicio) : "___/___/______";
  const escritura = c.FechaFin ? fechaLocal(c.FechaFin) : "___/___/______";
  const posesion = c.FechaPosesion ? fechaLocal(c.FechaPosesion) : "___/___/______";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Boleto de Compraventa</title>
<style>${ESTILOS}</style>
</head>
<body>

<div class="membrete">
  <div class="membrete-logo">GRUPO CONDADO</div>
  <div class="membrete-sub">Gestión Inmobiliaria Profesional</div>
  <div class="membrete-linea">Córdoba, Argentina &nbsp;·&nbsp; info@grupocondado.com.ar</div>
</div>

<h1 style="text-align:center;font-size:15pt;margin:1.5rem 0 .25rem;">BOLETO DE COMPRAVENTA</h1>
<p style="text-align:center;font-size:9pt;color:#666;margin-bottom:1.5rem;">
  Arts. 1123 y ss. del Código Civil y Comercial de la Nación
</p>

<p>
  Entre <strong>${e(c.LocadorNombre) || RAYA}</strong>,
  DNI N° ${e(c.LocadorDni) || "____________"}, CUIT ${e(c.VendedorCuit) || "____________"},
  de estado civil ${e(c.VendedorEstadoCivil) || "__________"},
  con domicilio en <strong>${e(c.LocadorDomicilio) || RAYA}</strong>,
  en adelante <strong>EL/LA VENDEDOR/A</strong>; y
  <strong>${e(c.LocatarioNombre) || RAYA}</strong>,
  DNI N° ${e(c.LocatarioDni) || "____________"},
  de estado civil ${e(c.CompradorEstadoCivil) || "__________"},
  con domicilio en <strong>${e(c.LocatarioDomicilio) || RAYA}</strong>,
  en adelante <strong>EL/LA COMPRADOR/A</strong>,
  convienen celebrar el presente boleto de compraventa, sujeto a las siguientes cláusulas:
</p>

<div class="clausula">
  <div class="clausula-titulo"><span class="clausula-num">PRIMERA</span>OBJETO</div>
  <p>EL/LA VENDEDOR/A se obliga a transferir a EL/LA COMPRADOR/A el dominio del inmueble
  sito en <strong>${e(c.InmuebleDireccion) || RAYA}</strong>,
  localidad de <strong>${e(c.InmuebleLocalidad) || RAYA}</strong>,
  inscripto bajo Matrícula N° <strong>${e(c.Matricula) || "____________"}</strong>,
  con una superficie de <strong>${c.SuperficieM2 ? `${numero(c.SuperficieM2)} m²` : "________"}</strong>,
  libre de ocupantes e intrusos salvo lo indicado en la cláusula CUARTA.</p>
</div>

<div class="clausula">
  <div class="clausula-titulo"><span class="clausula-num">SEGUNDA</span>PRECIO Y SEÑA</div>
  <p>El precio total y definitivo se fija en <strong>${precioTotal}</strong>.
  En este acto EL/LA COMPRADOR/A abona en concepto de seña
  <strong>${sena}</strong>, de carácter <strong>${e(c.TipoSena) || "penitencial"}</strong>,
  quedando un saldo de <strong>${saldo}</strong> pagadero al momento de la escrituración.</p>
  <table class="datos-tabla">
    <tr><td>Banco</td><td>${e(c.Banco) || "—"}</td></tr>
    <tr><td>CBU / Alias</td><td>${e(c.Cbu) || "—"}</td></tr>
    <tr><td>CUIT titular</td><td>${e(c.Cuit) || "—"}</td></tr>
  </table>
</div>

<div class="clausula">
  <div class="clausula-titulo"><span class="clausula-num">TERCERA</span>PLAZOS Y POSESIÓN</div>
  <p>El presente se suscribe el <strong>${firma}</strong>. La escritura traslativa de dominio
  se otorgará el <strong>${escritura}</strong>, oportunidad en la que se abonará el saldo
  de precio. La posesión y entrega de llaves se efectuará el <strong>${posesion}</strong>.</p>
</div>

<div class="clausula">
  <div class="clausula-titulo"><span class="clausula-num">CUARTA</span>ESTADO DEL INMUEBLE Y DEUDAS</div>
  <p>El inmueble se entrega en estado: <strong>${e(c.EstadoInmueble) || "Sin ocupantes"}</strong>.</p>
  ${c.Deuda === "Con deudas"
    ? `<div class="deuda-alerta"><strong>Deudas declaradas:</strong> ${e(c.DeudaDetalle) || "a determinar"}</div>`
    : "<p>EL/LA VENDEDOR/A declara que el inmueble se encuentra libre de deudas por expensas, impuestos y servicios.</p>"}
</div>

<div class="clausula">
  <div class="clausula-titulo"><span class="clausula-num">QUINTA</span>GASTOS E IMPUESTOS</div>
  <table class="expensas-tabla">
    <tr><td>Gastos de escrituración</td><td>${e(c.GastosEscritura) || "Comprador"}</td></tr>
    <tr><td>Impuestos y sellos</td><td>${e(c.Impuestos) || "50% cada parte"}</td></tr>
  </table>
</div>

<div class="clausula">
  <div class="clausula-titulo"><span class="clausula-num">SEXTA</span>PENALIDADES</div>
  <p>Conforme los arts. 1059 y 1060 del CCyCN, la seña entregada con carácter penitencial
  faculta a cualquiera de las partes a arrepentirse: si lo hace EL/LA COMPRADOR/A perderá
  la seña entregada; si lo hace EL/LA VENDEDOR/A deberá restituirla duplicada.</p>
  ${c.Penalidades ? `<p>${e(c.Penalidades)}</p>` : ""}
</div>

${c.Observaciones ? `
<div class="clausula">
  <div class="clausula-titulo"><span class="clausula-num">SÉPTIMA</span>OBSERVACIONES</div>
  <div class="observaciones-box">${e(c.Observaciones)}</div>
</div>` : ""}

<div class="firma-section">
  <div class="firma-grid">
    <div class="firma-box">
      <div class="firma-linea">
        <strong>${e(c.LocadorNombre) || RAYA}</strong>
        <div class="firma-sub">DNI: ${e(c.LocadorDni) || "____________"}</div>
        <div class="firma-sub">EL/LA VENDEDOR/A</div>
      </div>
    </div>
    <div class="firma-box">
      <div class="firma-linea">
        <strong>${e(c.LocatarioNombre) || RAYA}</strong>
        <div class="firma-sub">DNI: ${e(c.LocatarioDni) || "____________"}</div>
        <div class="firma-sub">EL/LA COMPRADOR/A</div>
      </div>
    </div>
  </div>
</div>

<div class="pie-pagina">
  Boleto generado el ${hoy} · Arts. 1123 y ss. CCyCN
</div>

<script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;

  abrirDocumento(html, ventana || undefined);
}
