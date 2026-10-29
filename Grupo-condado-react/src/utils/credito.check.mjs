import assert from "node:assert/strict";
import { cuotaFrancesa, simularCredito } from "./credito.js";

const cerca = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `${a} != ${b}`);

// 100.000 a 12 meses al 12% anual (1% mensual): cuota de tabla 8.884,88
cerca(cuotaFrancesa(100000, 12, 12), 8884.88);
// Sin interés es dividir en partes iguales
cerca(cuotaFrancesa(120000, 0, 12), 10000);
assert.equal(cuotaFrancesa(0, 8, 240), 0);
assert.equal(cuotaFrancesa(100000, 8, 0), 0);

// Casa de 250.000 con 30% de anticipo a 20 años al 8%
const s = simularCredito(250000, { anticipoPct: "30", anios: "20", tnaPct: "8" });
assert.equal(s.anticipo, 75000);
assert.equal(s.financiado, 175000);
assert.equal(s.meses, 240);
cerca(s.cuota, 1463.77);
cerca(s.intereses, s.cuota * 240 - 175000);

// 100% de anticipo: no hay nada que financiar
assert.equal(simularCredito(250000, { anticipoPct: "100", anios: "20", tnaPct: "8" }).cuota, 0);
// Inputs vacíos mientras se escribe
assert.equal(simularCredito(250000, { anticipoPct: "", anios: "", tnaPct: "" }).cuota, 0);

console.log("credito OK");
