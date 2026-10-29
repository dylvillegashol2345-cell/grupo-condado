import { CARACTERISTICAS, CARACTERISTICAS_DEPTO, SERVICIOS, SERVICIOS_EDIFICIO } from "./catalogos.js";

export function caracteristicasPorDefecto() {
  return CARACTERISTICAS.reduce((acc, c) => ({ ...acc, [c.clave]: c.defecto }), {});
}

// Las características viajan como JSON dentro de Propiedad.Descripcion
export function parsearCaracteristicas(descripcion) {
  if (!descripcion) return null;
  if (typeof descripcion === "object") return descripcion;
  try {
    const obj = JSON.parse(descripcion);
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

export function serializarCaracteristicas(obj) {
  return JSON.stringify(obj || caracteristicasPorDefecto());
}

export function chipsResumen(descripcion) {
  const c = parsearCaracteristicas(descripcion);
  if (!c) return [];
  const items = [];
  if (c.dormitorios && c.dormitorios !== "0") items.push({ icono: "fa-bed",           texto: c.dormitorios });
  if (c.banos)                                items.push({ icono: "fa-bath",          texto: c.banos });
  if (c.cochera && c.cochera !== "No")        items.push({ icono: "fa-car",           texto: c.cochera });
  if (c.pileta === "Si")                      items.push({ icono: "fa-swimming-pool", texto: "Pileta" });
  if (c.quincho === "Si")                     items.push({ icono: "fa-fire-alt",      texto: "Quincho" });
  return items;
}

export function chipsDetalle(descripcion) {
  const c = parsearCaracteristicas(descripcion);
  if (!c) return null;
  const labelDetalle = { salonFiestas: "Salón fiestas" };
  return [...CARACTERISTICAS, ...CARACTERISTICAS_DEPTO, ...SERVICIOS_EDIFICIO]
    .map((def) => ({ icono: def.icono, label: labelDetalle[def.clave] || def.label, valor: c[def.clave] }))
    .filter((i) => i.valor && i.valor !== "No" && i.valor !== "0");
}

// Servicios: texto separado por comas, "Luz,Agua,Gas"
export function parsearServicios(csv) {
  if (!csv) return [];
  const lista = String(csv).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return SERVICIOS.filter((s) => lista.includes(s.clave.toLowerCase())).map((s) => s.clave);
}

export function serializarServicios(claves) {
  return (claves || []).join(",");
}

export function infoServicio(clave) {
  return SERVICIOS.find((s) => s.clave.toLowerCase() === String(clave).trim().toLowerCase())
    || { clave, icono: "fa-check", color: "#2e7d32" };
}

export function sinClavesDepto(caract) {
  const claves = new Set([...CARACTERISTICAS_DEPTO, ...SERVICIOS_EDIFICIO].map((d) => d.clave));
  return Object.fromEntries(Object.entries(caract).filter(([k]) => !claves.has(k)));
}
