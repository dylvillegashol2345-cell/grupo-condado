import assert from "node:assert/strict";
import { numeroALetras, montoEnLetras } from "./numeroALetras.js";

const casos = {
  1: "uno", 9: "nueve", 16: "dieciséis", 24: "veinticuatro", 29: "veintinueve", 31: "treinta y uno",
  100: "cien", 101: "ciento uno", 555: "quinientos cincuenta y cinco", 1000: "mil", 1001: "mil uno",
  21000: "veintiún mil", 60000: "sesenta mil", 1000000: "un millón", 2000000: "dos millones",
  1700000: "un millón setecientos mil", 2040000: "dos millones cuarenta mil",
};
for (const [n, esperado] of Object.entries(casos)) assert.equal(numeroALetras(Number(n)), esperado, n);

assert.equal(montoEnLetras(1700000), "pesos un millón setecientos mil ($1.700.000,00)");
assert.equal(montoEnLetras(21), "pesos veintiún ($21,00)");
console.log("numeroALetras OK");
