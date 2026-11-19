import assert from "node:assert/strict";
import { calcularHonorarios, porcentajesDe } from "./honorarios.js";

// Venta de 120.000 al 3% (a cargo del comprador), en 3 cuotas
const venta = calcularHonorarios(120000, { operacion: "Venta", cuotas: "3", canon: "", meses: "24" });
assert.equal(venta.pct, 3);
assert.equal(venta.total, 3600);
assert.equal(venta.cuota, 1200);

// CP-24: alquiler de 500.000 por mes a 24 meses = 12.000.000 de valor total; al 3% son 360.000
const alquiler = calcularHonorarios(120000, { operacion: "Alquiler", cuotas: "2", canon: "500000", meses: "24" });
assert.equal(alquiler.base, 12000000);
assert.equal(alquiler.total, 360000);
assert.equal(alquiler.cuota, 180000);

// Los porcentajes salen de los parámetros del Administrador
const pcts = porcentajesDe([
  { Clave: "COMISION_VENTA_COMPRADOR", Valor: 0.035 },
  { Clave: "COMISION_VENTA_VENDEDOR", Valor: 0.02 },
  { Clave: "COMISION_ALQUILER", Valor: 0.05 },
]);
assert.deepEqual(pcts, { Venta: 3.5, Alquiler: 5 });
assert.equal(calcularHonorarios(0, { operacion: "Alquiler", cuotas: "1", canon: "500000", meses: "24" }, pcts).total, 600000);
// Si faltan, se usan los de la carpeta
assert.deepEqual(porcentajesDe([]), { Venta: 3, Alquiler: 3 });

// Las cuotas quedan entre 1 y 3
assert.equal(calcularHonorarios(100000, { operacion: "Venta", cuotas: "6" }).cuotas, 3);
assert.equal(calcularHonorarios(100000, { operacion: "Venta", cuotas: "" }).cuotas, 1);

// Alquiler sin datos cargados todavía
assert.equal(calcularHonorarios(100000, { operacion: "Alquiler", cuotas: "1", canon: "", meses: "24" }).total, 0);

console.log("honorarios OK");
