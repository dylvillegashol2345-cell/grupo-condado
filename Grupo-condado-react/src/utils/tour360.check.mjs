import assert from "node:assert/strict";
import { leerTour, guardarTour, quitarSala, limpiarTour } from "./tour360.js";

const sala = (nombre, imagen, puertas = []) => ({ nombre, imagen, puertas });

// Una sola foto sigue guardándose como texto, igual que antes
assert.deepEqual(leerTour("/img/tours/casa1.jpeg"), [sala("", "/img/tours/casa1.jpeg")]);
assert.equal(guardarTour([sala("", "/img/a.jpg")]), "/img/a.jpg");
assert.deepEqual(leerTour(""), []);
assert.deepEqual(leerTour('[{"nombre":"Living"'), []);   // JSON cortado

// Un ambiente sin foto todavía no se pierde mientras se edita
assert.deepEqual(leerTour(guardarTour([sala("", "")])), [sala("", "")]);

// Ida y vuelta con varios ambientes
const casa = [
  sala("Living", "/l.jpg", [{ a: 1, pitch: -5, yaw: 40 }, { a: 2, pitch: 0, yaw: 90 }]),
  sala("Cocina", "/c.jpg", [{ a: 0, pitch: 0, yaw: -90 }, { a: 2, pitch: 0, yaw: 10 }]),
  sala("Baño", "/b.jpg", [{ a: 1, pitch: 0, yaw: 0 }]),
];
assert.deepEqual(leerTour(guardarTour(casa)), casa);

// Al quitar la Cocina, las puertas hacia ella desaparecen y el Baño pasa a ser el 1
assert.deepEqual(quitarSala(casa, 1), [
  sala("Living", "/l.jpg", [{ a: 1, pitch: 0, yaw: 90 }]),
  sala("Baño", "/b.jpg", []),
]);

// Al guardar se descartan los ambientes sin foto
assert.equal(limpiarTour(guardarTour([sala("", "/a.jpg"), sala("Patio", "")])), "/a.jpg");
assert.equal(limpiarTour(guardarTour([sala("", "")])), "");

console.log("tour360 OK");
