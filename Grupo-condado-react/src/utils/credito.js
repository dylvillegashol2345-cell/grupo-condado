export const CREDITO_DEFECTO = { anticipoPct: "30", anios: "20", tnaPct: "8" };

export function cuotaFrancesa(monto, tnaPct, meses) {
  if (!monto || !meses) return 0;
  const i = tnaPct / 100 / 12;
  if (!i) return monto / meses;
  return (monto * i) / (1 - (1 + i) ** -meses);
}

export function simularCredito(precio, { anticipoPct, anios, tnaPct }) {
  const valor = Number(precio) || 0;
  const anticipo = (valor * (Number(anticipoPct) || 0)) / 100;
  const financiado = valor - anticipo;
  const meses = (Number(anios) || 0) * 12;
  const cuota = cuotaFrancesa(financiado, Number(tnaPct) || 0, meses);
  const totalCuotas = cuota * meses;
  return { anticipo, financiado, meses, cuota, totalCuotas, intereses: totalCuotas - financiado };
}
