import assert from "node:assert/strict";
import { generarRespuesta } from "./chatbot.js";

const responde = (texto) => generarRespuesta(texto, { props: [] }).texto;
const NO_SE = "No estoy segura";

// Preguntas de ayuda general, con y sin acentos
for (const q of ["¿Cómo uso la aplicación?", "como uso la app", "Necesito ayuda", "¿Qué puedo hacer acá?"]) {
  assert.ok(responde(q).includes("Cómo usar Grupo Condado"), q);
}
// Las intenciones específicas siguen ganando
assert.ok(responde("¿Cómo funciona el EcoMarket?").includes("EcoMarket"));
assert.ok(responde("¿Cómo es el proceso para alquilar?").includes("alquiler"));
assert.ok(responde("¿Cómo me registro?").includes("Crear una cuenta"));
// Lo que no entiende sigue cayendo en el mensaje de siempre
assert.ok(responde("xyzzy plugh").startsWith(NO_SE));

console.log("chatbot: ok");
