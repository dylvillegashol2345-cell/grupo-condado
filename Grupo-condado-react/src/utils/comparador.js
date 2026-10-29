export const MAX_COMPARAR = 3;
export const MIN_COMPARAR = 2;

export function mejoresDe(props) {
  const mejor = {};
  const precios = props.map((p) => Number(p.precioNum) || 0).filter(Boolean);
  const sups = props.map((p) => Number(p.surface) || 0).filter(Boolean);
  const mismaMoneda = new Set(props.map((p) => p.moneda)).size === 1;
  if (mismaMoneda && precios.length > 1) mejor.precio = Math.min(...precios);
  if (sups.length > 1) mejor.superficie = Math.max(...sups);
  return mejor;
}

export function esMejor(clave, p, mejor) {
  if (clave === "precio") return Boolean(mejor.precio) && Number(p.precioNum) === mejor.precio;
  if (clave === "superficie") return Boolean(mejor.superficie) && Number(p.surface) === mejor.superficie;
  return false;
}
