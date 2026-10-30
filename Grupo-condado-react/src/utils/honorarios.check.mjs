import assert from "node:assert/strict";
import { calcularHonorarios } from "./honorarios.js";

// Venta de 120.000 al 3%, en 3 cuotas
const venta = calcularHonorarios(120000, { operacion: "Venta", cuotas: "3", canon: "", meses: "24" });
assert.equal(venta.pct, 3);
assert.equal(venta.total, 3600);
assert.equal(venta.cuota, 1200);

// Alquiler de 500.000 por mes a 24 meses: 5% de 12.000.000
const alquiler = calcularHonorarios(120000, { operacion: "Alquiler", cuotas: "2", canon: "500000", meses: "24" });
assert.equal(alquiler.base, 12000000);
assert.equal(alquiler.total, 600000);
assert.equal(alquiler.cuota, 300000);

// Las cuotas quedan entre 1 y 3
assert.equal(calcularHonorarios(100000, { operacion: "Venta", cuotas: "6" }).cuotas, 3);
assert.equal(calcularHonorarios(100000, { operacion: "Venta", cuotas: "" }).cuotas, 1);

// Alquiler sin datos cargados todavía
assert.equal(calcularHonorarios(100000, { operacion: "Alquiler", cuotas: "1", canon: "", meses: "24" }).total, 0);

console.log("honorarios OK");
