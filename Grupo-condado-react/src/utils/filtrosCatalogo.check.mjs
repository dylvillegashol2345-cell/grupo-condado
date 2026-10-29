import assert from "node:assert/strict";
import { ordenar } from "./filtrosCatalogo.js";

const p = (id, precioNum, moneda, surface) => ({ id, precioNum, moneda, surface });
const lista = [p(1, 500000, "ARS", 90), p(2, 250000, "USD", 180), p(3, 150000, "ARS", 0)];
const ids = (l) => l.map((x) => x.id);

// Con el dólar a 1000, USD 250.000 son $250.000.000: el más caro
assert.deepEqual(ids(ordenar(lista, "precio_asc", 1000)), [3, 1, 2]);
assert.deepEqual(ids(ordenar(lista, "precio_desc", 1000)), [2, 1, 3]);
// Sin cotización se comparan los números tal cual
assert.deepEqual(ids(ordenar(lista, "precio_asc")), [3, 2, 1]);
assert.deepEqual(ids(ordenar(lista, "sup_desc")), [2, 1, 3]);
assert.deepEqual(ids(ordenar(lista, "recientes")), [3, 2, 1]);
assert.deepEqual(ids(ordenar(lista, "")), [1, 2, 3]);   // Sin orden, como vino
assert.deepEqual(ids(lista), [1, 2, 3]);

console.log("filtrosCatalogo OK");
