import assert from "node:assert/strict";
import {
  soloDigitos, soloLetras, nombre, nacionalidad, dni, cuil, telefono, telefonoCompleto,
  documento, monto, porcentaje, entero, cbuAlias, alfanumerico, email, sinNumeros, hora,
} from "./restricciones.js";

assert.equal(soloDigitos("12a3-4", 3), "123");
assert.equal(soloLetras("José 2 Ñandú!"), "José  Ñandú");
assert.equal(nombre("O'Brien Jr. 3"), "O'Brien Jr. ");
assert.equal(nacionalidad("argentinos / argentinas 1"), "argentinos / argentinas ");
assert.equal(dni("12.345.678-9"), "12345678");
assert.equal(cuil("20-12345678-9xx99"), "20-12345678-9");
assert.equal(telefono("(351) 248-6533 99"), "35124865339");
assert.equal(telefonoCompleto("+54 351 248 6533"), "+543512486533");
assert.equal(documento("ab12.345.678", "DNI"), "12345678");
assert.equal(documento("20-12345678-9", "CUIT"), "20123456789");
assert.equal(documento("aa-123456789", "Pasaporte"), "AA1234567");
assert.equal(monto("-1.500,50"), "1500");
assert.equal(monto("-1500,5", true), "1500.5");
assert.equal(monto("1.500,50", true), "1500.50");
assert.equal(monto("1.500.000", true), "1500000");
assert.equal(monto("1.5", true), "1.5");
// Tecla por tecla: "1.500,5" se va filtrando y termina en 1500.5
assert.equal(["1", "1.", "1.5", "1.50", "1.500", "1500,", "1500.5"].map((x) => monto(x, true)).pop(), "1500.5");
assert.equal(monto("1500.", true), "1500.");
assert.equal(monto("1500.5", true), "1500.5");
assert.equal(monto("1.2.3", true), "1.23");
assert.equal(monto(undefined, true), "");
assert.equal(porcentaje("150"), "100");
assert.equal(porcentaje("-4,5"), "4.5");
assert.equal(entero("35", 28), "28");
assert.equal(entero("9x", 28), "9");
assert.equal(cbuAlias("casa.perro-luna 01!"), "casa.perro-luna01");
assert.equal(cbuAlias("0".repeat(30)).length, 22);
assert.equal(alfanumerico("1234 bis#", 10), "1234 bis");
assert.equal(email(" a b@gmail.com "), "ab@gmail.com");
assert.equal(sinNumeros("Banco 123 (E.P.E.C.)"), "Banco  (E.P.E.C.)");
assert.equal(hora("14hs:00x"), "14:00");
console.log("restricciones OK");
