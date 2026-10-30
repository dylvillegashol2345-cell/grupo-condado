import assert from "node:assert/strict";
import { direccion, fechaCorta } from "./format.js";

assert.equal(fechaCorta("2026-05-20T00:00:00"), "20/05/2026");
assert.equal(fechaCorta("2026-05-20"), "20/05/2026");
assert.equal(fechaCorta(null), "—");

assert.equal(direccion("Alberdi", "Arturo Orgaz", "234"), "Alberdi · Arturo Orgaz 234");
assert.equal(direccion("Las delicias", "", null), "Las delicias");   // Sin punto suelto

console.log("format OK");
