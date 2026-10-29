import assert from "node:assert/strict";
import { mensajeWhatsApp, linkWhatsApp } from "./compartir.js";

const casa = {
  type: "Casa", barrio: "Jockey Club", localidad: "Córdoba Capital", calle: "", numeracion: "",
  price: "$800.000", surface: 400, categoriaEco: "A", tour360: "/img/tours/casa1.jpeg",
  raw: { Descripcion: '{"dormitorios":"3","banos":"1","cochera":"2"}' },
};
const m = mensajeWhatsApp(casa, "http://x/app/propiedades/4");
assert.equal(m, [
  "🏠 *Casa en Jockey Club, Córdoba Capital*",
  "💰 $800.000 · 400 m² · 3 dormitorios · 1 baño",
  "🌿 Clase energética A · Recorrido virtual 360",
  "",
  "Mirala acá: http://x/app/propiedades/4",
  "— Grupo Condado",
].join("\n"));

// Lote sin descripción ni recorrido, con dirección
const lote = { ...casa, type: "Lote", calle: "Colón", numeracion: "560", surface: 0, tour360: "", raw: { Descripcion: "" } };
const ml = mensajeWhatsApp(lote, "u");
assert.ok(ml.includes("📍 Colón 560"));
assert.ok(ml.includes("💰 $800.000\n"));
assert.ok(!ml.includes("Recorrido"));

// El texto viaja codificado (emojis, saltos de línea, acentos)
assert.equal(decodeURIComponent(linkWhatsApp(m).split("?text=")[1]), m);

console.log("compartir OK");
