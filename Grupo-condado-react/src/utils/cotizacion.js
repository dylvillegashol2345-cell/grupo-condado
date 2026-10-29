export const TIPOS_DOLAR = { oficial: "Oficial", blue: "Blue", bolsa: "MEP" };

const CLAVE = "cotizacionDolar";

function leerGuardadas() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) || "{}");
  } catch {
    return {};
  }
}

export async function obtenerCotizacion(tipo = "oficial") {
  const guardadas = leerGuardadas();
  try {
    const res = await fetch(`https://dolarapi.com/v1/dolares/${tipo}`);
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    const valor = Number(json.venta);
    if (!valor) throw new Error("sin valor");
    const cot = { valor, fecha: json.fechaActualizacion || new Date().toISOString() };
    try { localStorage.setItem(CLAVE, JSON.stringify({ ...guardadas, [tipo]: cot })); } catch { /* se ignora */ }
    return { ...cot, origen: "api" };
  } catch {
    return guardadas[tipo] ? { ...guardadas[tipo], origen: "guardada" } : null;
  }
}

export function convertir(monto, origen, destino, cotizacion) {
  const n = Number(monto) || 0;
  const desde = origen === "USD" ? "USD" : "ARS";
  if (desde === destino || !cotizacion) return n;
  return destino === "USD" ? n / cotizacion : n * cotizacion;
}

export function importe(valor, moneda) {
  const n = Math.round(Number(valor) || 0).toLocaleString("es-AR");
  return moneda === "USD" ? `USD ${n}` : `$${n}`;
}

export function importeCorto(valor, moneda) {
  const n = Number(valor) || 0;
  if (Math.abs(n) < 1e6) return importe(n, moneda);
  const millones = (n / 1e6).toLocaleString("es-AR", { maximumFractionDigits: 1 });
  return moneda === "USD" ? `USD ${millones} M` : `$${millones} M`;
}
