import { parsearCaracteristicas } from "./caracteristicas.js";
import { leerTour } from "./tour360.js";

export function mensajeWhatsApp(p, url) {
  const c = parsearCaracteristicas(p.raw?.Descripcion) || {};
  const cantidad = (n, palabra) => (n && n !== "0" ? `${n} ${palabra}${n === "1" ? "" : "s"}` : "");
  const datos = [
    p.price,
    p.surface ? `${p.surface} m²` : "",
    cantidad(c.dormitorios, "dormitorio"),
    cantidad(c.banos, "baño"),
  ].filter(Boolean).join(" · ");
  const extras = [
    `Clase energética ${p.categoriaEco || "B"}`,
    leerTour(p.tour360).some((s) => s.imagen) ? "Recorrido virtual 360" : "",
  ].filter(Boolean).join(" · ");
  const direccion = `${p.calle || ""} ${p.numeracion || ""}`.trim();

  return [
    `🏠 *${p.type} en ${p.barrio}, ${p.localidad}*`,
    direccion ? `📍 ${direccion}` : null,
    `💰 ${datos}`,
    `🌿 ${extras}`,
    "",
    `Mirala acá: ${url}`,
    "— Grupo Condado",
  ].filter((linea) => linea !== null).join("\n");
}

export const linkWhatsApp = (texto) => `https://wa.me/?text=${encodeURIComponent(texto)}`;
