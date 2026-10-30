// Comisión de la inmobiliaria: venta sobre el precio, alquiler sobre el total del contrato
export const COMISION_PCT = { Venta: 3, Alquiler: 5 };

export const HONORARIOS_DEFECTO = { operacion: "Venta", cuotas: "1", canon: "", meses: "24" };

export function calcularHonorarios(precio, { operacion, cuotas, canon, meses }) {
  const base = operacion === "Alquiler"
    ? (Number(canon) || 0) * (Number(meses) || 0)
    : Number(precio) || 0;
  const pct = COMISION_PCT[operacion] || 0;
  const total = (base * pct) / 100;
  const n = Math.min(3, Math.max(1, Number(cuotas) || 1));
  return { base, pct, total, cuotas: n, cuota: total / n };
}
