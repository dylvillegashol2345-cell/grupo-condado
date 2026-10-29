function escapar(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function exportarExcel(datos, columnas, nombreArchivo) {
  if (!datos || !datos.length) {
    throw new Error("No hay datos para exportar");
  }

  const encabezados = columnas.map((c) => `<th>${escapar(c.titulo)}</th>`).join("");
  const filas = datos
    .map((row) =>
      "<tr>" +
      columnas.map((c) => `<td>${escapar(c.formato ? c.formato(row[c.campo], row) : row[c.campo])}</td>`).join("") +
      "</tr>")
    .join("");

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8">
    <style>
      th { background:#6c2d20;color:white;font-weight:bold;padding:6px; }
      td { padding:5px;border:1px solid #ddd; }
      tr:nth-child(even) td { background:#fdf8f6; }
    </style>
    </head><body>
    <h2 style="color:#6c2d20;font-family:Arial;">Grupo Condado — ${escapar(nombreArchivo)}</h2>
    <p style="color:#666;font-size:12px;">Generado: ${new Date().toLocaleString("es-AR")}</p>
    <table border="1"><thead><tr>${encabezados}</tr></thead><tbody>${filas}</tbody></table>
    </body></html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const COLUMNAS_EXCEL = {
  propietarios: [
    { titulo: "ID", campo: "IdPropietario" }, { titulo: "Apellido", campo: "Apellido" },
    { titulo: "Nombre", campo: "Nombre" }, { titulo: "Documento", campo: "DNI" },
    { titulo: "Email", campo: "Email" }, { titulo: "Calle", campo: "Calle" },
    { titulo: "Numeración", campo: "Numeracion" }, { titulo: "Localidad", campo: "Localidad" },
  ],
  clientes: [
    { titulo: "ID", campo: "IdCliente" }, { titulo: "Nombre", campo: "Nombre" },
    { titulo: "Teléfono", campo: "Telefono" },
  ],
  operaciones: [
    { titulo: "ID", campo: "IdOperacion" }, { titulo: "Tipo", campo: "Tipo" },
    { titulo: "Fecha", campo: "Fecha" }, { titulo: "ID Propiedad", campo: "IdPropiedad" },
    { titulo: "ID Cliente", campo: "IdCliente" }, { titulo: "ID Agente", campo: "IdUsuario" },
  ],
  contratos: [
    { titulo: "ID", campo: "IdContrato" }, { titulo: "Operación", campo: "IdOperacion" },
    { titulo: "Fecha inicio", campo: "FechaInicio" }, { titulo: "Fecha fin", campo: "FechaFin" },
  ],
  pagos: [
    { titulo: "ID", campo: "IdPago" }, { titulo: "Contrato", campo: "IdContrato" },
    { titulo: "Monto", campo: "Monto" }, { titulo: "Fecha", campo: "Fecha" },
  ],
};

const fecha = (v) => (v ? String(v).split("T")[0] : "");

COLUMNAS_EXCEL.contratosDetalle = [
  { titulo: "ID", campo: "IdContrato" }, { titulo: "Operación", campo: "IdOperacion" },
  { titulo: "Tipo", campo: "_tipoOp", formato: (v, row) => v || row.TipoContrato || "Alquiler" },
  { titulo: "Locador/Vendedor", campo: "LocadorNombre" },
  { titulo: "Locatario/Comprador", campo: "LocatarioNombre" },
  { titulo: "Inmueble", campo: "InmuebleDireccion" }, { titulo: "Moneda", campo: "Moneda" },
  { titulo: "Canon mensual", campo: "CanonMensual" },
  { titulo: "Precio de venta", campo: "PrecioTotal" },
  { titulo: "Seña", campo: "Sena" },
  { titulo: "Fecha inicio", campo: "FechaInicio", formato: fecha },
  { titulo: "Fecha fin", campo: "FechaFin", formato: fecha },
];

COLUMNAS_EXCEL.pagosDetalle = [
  { titulo: "Contrato", campo: "Contrato" }, { titulo: "Locatario", campo: "Locatario" },
  { titulo: "Moneda", campo: "Moneda", formato: (v) => v || "ARS" }, { titulo: "Monto", campo: "Monto" },
  { titulo: "Fecha", campo: "Fecha", formato: fecha },
];
