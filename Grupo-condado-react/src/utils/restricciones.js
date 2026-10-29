const txt = (v) => String(v ?? "");

export const soloDigitos = (v, max = Infinity) => txt(v).replace(/\D/g, "").slice(0, max);

export const soloLetras = (v, max = Infinity) => txt(v).replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, "").slice(0, max);

export const nombre = (v, max = Infinity) => txt(v).replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'.]/g, "").slice(0, max);

export const nacionalidad = (v) => txt(v).replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s/]/g, "").slice(0, 60);

export const dni =(v) => soloDigitos(v, 8);

export const cuil = (v) => txt(v).replace(/[^\d-]/g, "").slice(0, 13);

export const telefono = (v, max = 11) => soloDigitos(v, max);

export function telefonoCompleto(v) {
  const s = txt(v).trim();
  return (s.startsWith("+") ? "+" : "") + soloDigitos(s, 13);
}

export function documento(v, tipo) {
  if (tipo === "Pasaporte") return txt(v).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9);
  return soloDigitos(v, tipo === "CUIL" || tipo === "CUIT" ? 11 : 8);
}

export function monto(v, decimales = false) {
  let s = txt(v).replace(/[^\d.,]/g, "");
  if (!decimales) return soloDigitos(s.split(",")[0], 15);
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".").replace(/,/g, "");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const [ent, ...resto] = s.split(".");
  return (resto.length ? `${ent}.${resto.join("")}` : ent).slice(0, 15);
}

export function porcentaje(v) {
  const s = monto(v, true);
  return Number(s) > 100 ? "100" : s;
}

export function entero(v, maxValor) {
  const s = soloDigitos(v, String(maxValor).length);
  return s && Number(s) > maxValor ? String(maxValor) : s;
}

export const cbuAlias = (v) => txt(v).replace(/[^a-zA-Z0-9.-]/g, "").slice(0, 22);

export const alfanumerico = (v, max = 10) => txt(v).replace(/[^a-zA-Z0-9\s./-]/g, "").slice(0, max);

export const email = (v) => txt(v).replace(/\s/g, "").slice(0, 100);

export const sinNumeros = (v) => txt(v).replace(/\d/g, "");

export const hora = (v) => txt(v).replace(/[^\d:]/g, "").slice(0, 5);
