// Comisión de la inmobiliaria: venta sobre el precio, alquiler sobre el total del contrato.
// Los porcentajes los define el Administrador (api/Parametro); estos son los de la carpeta,
// por si la API no responde: venta 3% a cargo del comprador, alquiler 3%.
export const COMISION_PCT = { Venta: 3, Alquiler: 3 };

export const HONORARIOS_DEFECTO = { operacion: "Venta", cuotas: "1", canon: "", meses: "24" };

const porcentaje = (valor) => Math.round(Number(valor) * 10000) / 100;

export function porcentajesDe(parametros) {
  const valor = (clave) => parametros.find((p) => p.Clave === clave)?.Valor;
  const venta = valor("COMISION_VENTA_COMPRADOR");
  const alquiler = valor("COMISION_ALQUILER");
  return {
    Venta: venta == null ? COMISION_PCT.Venta : porcentaje(venta),
    Alquiler: alquiler == null ? COMISION_PCT.Alquiler : porcentaje(alquiler),
  };
}

export function calcularHonorarios(precio, { operacion, cuotas, canon, meses }, porcentajes = COMISION_PCT) {
  const base = operacion === "Alquiler"
    ? (Number(canon) || 0) * (Number(meses) || 0)
    : Number(precio) || 0;
  const pct = porcentajes[operacion] || 0;
  const total = (base * pct) / 100;
  const n = Math.min(3, Math.max(1, Number(cuotas) || 1));
  return { base, pct, total, cuotas: n, cuota: total / n };
}
