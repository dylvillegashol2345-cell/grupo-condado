import assert from "node:assert/strict";
import { semanasDelMes, propiedadDeConsulta, citaDesdeConsulta, validarCita, cuerpoCita, fechaISO, CITA_VACIA,
  proximasCitas, etiquetaDia, telefonoWhatsApp, mensajeRecordatorio, linkRecordatorio } from "./citas.js";

// Octubre 2026 empieza jueves: 3 huecos, 31 días, 5 semanas
const oct = semanasDelMes(2026, 9);
assert.deepEqual(oct[0], [null, null, null, 1, 2, 3, 4]);
assert.equal(oct.length, 5);
assert.deepEqual(oct[4], [26, 27, 28, 29, 30, 31, null]);
// Febrero 2027 empieza lunes y tiene 28 días: 4 semanas justas
assert.equal(semanasDelMes(2027, 1).length, 4);
assert.equal(fechaISO(new Date(2026, 0, 5)), "2026-01-05");

const props = [
  { id: 4, type: "Casa", barrio: "Jockey Club", calle: "", numeracion: "" },
  { id: 5, type: "Casa", barrio: "Alberdi", calle: "Arturo Orgaz", numeracion: "234" },
];
assert.equal(propiedadDeConsulta("4", props).id, 4);                                   // Id de los datos de ejemplo
assert.equal(propiedadDeConsulta("Casa en Alberdi · Arturo Orgaz 234", props).id, 5);  // Etiqueta del detalle
assert.equal(propiedadDeConsulta("casa en  alberdi · arturo orgaz 234 ", props).id, 5);
assert.equal(propiedadDeConsulta("Casa en Jockey Club", props).id, 4);                 // Sin calle: sin punto suelto
assert.equal(propiedadDeConsulta("Casa en Jockey Club ·", props).id, 4);               // Formato viejo
assert.equal(propiedadDeConsulta("Algo que no existe", props), null);
assert.equal(propiedadDeConsulta("99", props), null);

const desde = citaDesdeConsulta({ IdConsulta: 53, Nombre: "Ana", Telefono: "351", Mensaje: "¿Puedo verla?", PropiedadInteres: "5" }, props);
assert.deepEqual([desde.Contacto, desde.Telefono, desde.IdConsulta, desde.IdPropiedad, desde.Estado], ["Ana", "351", 53, 5, "Pendiente"]);
assert.equal(desde.Notas, "Consulta: ¿Puedo verla?");

// Quien consultó ya es cliente: se lo reconoce por teléfono (sin importar el formato) o por nombre
const clientes = [
  { IdCliente: 7, Nombre: "Juan", Apellido: "García", Telefono: "+5493514567890" },
  { IdCliente: 8, Nombre: "Ana", Apellido: "Pérez", Telefono: "" },
];
assert.equal(citaDesdeConsulta({ Nombre: "Juancito", Telefono: "351 456-7890" }, props, clientes).IdCliente, 7);
assert.equal(citaDesdeConsulta({ Nombre: "ana perez", Telefono: "" }, props, clientes).IdCliente, 8);
assert.equal(citaDesdeConsulta({ Nombre: "Pérez Ana", Telefono: "" }, props, clientes).IdCliente, 8);
assert.equal(citaDesdeConsulta({ Nombre: "Pedro Ávila", Telefono: "+5493514111222" }, props, clientes).IdCliente, "");
assert.equal(citaDesdeConsulta({ Nombre: "", Telefono: "" }, props, clientes).IdCliente, "");   // Sin datos no adivina

const hoy = "2026-10-25";
const base = { ...CITA_VACIA, Fecha: "2026-10-28", Hora: "15:00", IdPropiedad: 5, Contacto: "Ana", IdUsuario: 2 };
assert.equal(validarCita(base, [], hoy), null);
assert.match(validarCita({ ...base, Hora: "" }, [], hoy), /hora/);
assert.match(validarCita({ ...base, Contacto: " " }, [], hoy), /cliente/);
assert.equal(validarCita({ ...base, Contacto: "", IdCliente: 7 }, [], hoy), null);
assert.match(validarCita({ ...base, Fecha: "2026-10-20" }, [], hoy), /pasada/);
assert.equal(validarCita({ ...base, IdCita: 9, Fecha: "2026-10-20" }, [], hoy), null);   // Editar una vieja sí
const otra = { IdCita: 1, IdUsuario: 2, Fecha: "2026-10-28", Hora: "15:00", Estado: "Confirmada", Agente: "martin" };
assert.match(validarCita(base, [otra], hoy), /martin ya tiene una cita el 28\/10\/2026 a las 15:00/);
assert.equal(validarCita(base, [{ ...otra, Estado: "Cancelada" }], hoy), null);           // La cancelada no ocupa
assert.equal(validarCita(base, [{ ...otra, IdUsuario: 3 }], hoy), null);                  // Otro agente sí puede
assert.equal(validarCita({ ...base, IdCita: 1 }, [otra], hoy), null);                     // No choca consigo misma
assert.match(validarCita({ ...base, Hora: "15:45" }, [otra], hoy), /a las 15:00/);       // 45 minutos después: se superpone
assert.match(validarCita({ ...base, Hora: "14:15" }, [otra], hoy), /a las 15:00/);       // 45 minutos antes: también
assert.equal(validarCita({ ...base, Hora: "16:00" }, [otra], hoy), null);                // Una hora después: libre

assert.deepEqual(cuerpoCita({ ...base, IdCliente: "", Notas: "  " }), {
  Fecha: "2026-10-28", Hora: "15:00", Estado: "Pendiente", Notas: null, Contacto: "Ana", Telefono: null,
  IdCliente: null, IdUsuario: 2, IdPropiedad: 5, IdConsulta: null,
});

// ── próximas citas y recordatorio ──
const ahora = new Date(2026, 9, 25, 16, 0);   // Domingo 25/10/2026 16:00
const lista = [
  { IdCita: 1, Fecha: "2026-10-25", Hora: "15:00", Estado: "Pendiente" },   // Hoy, ya pasó
  { IdCita: 2, Fecha: "2026-10-25", Hora: "18:00", Estado: "Confirmada" },  // Hoy, más tarde
  { IdCita: 3, Fecha: "2026-10-28", Hora: "09:00", Estado: "Pendiente" },
  { IdCita: 4, Fecha: "2026-10-26", Hora: "10:00", Estado: "Cancelada" },
  { IdCita: 5, Fecha: "2026-10-26", Hora: "11:30", Estado: "Pendiente" },
  { IdCita: 6, Fecha: "2026-10-20", Hora: "11:30", Estado: "Realizada" },
];
assert.deepEqual(proximasCitas(lista, ahora).map((c) => c.IdCita), [2, 5, 3]);
assert.deepEqual(proximasCitas(lista, ahora, 2).map((c) => c.IdCita), [2, 5]);

assert.equal(etiquetaDia("2026-10-25", ahora), "Hoy");
assert.equal(etiquetaDia("2026-10-26", ahora), "Mañana");
assert.equal(etiquetaDia("2026-10-28", ahora), "miércoles 28/10");
assert.equal(etiquetaDia("2026-11-01", new Date(2026, 9, 31)), "Mañana");   // Cambio de mes

// Teléfonos como los guarda el sistema y como los escribe la gente
assert.equal(telefonoWhatsApp("+5493514111222"), "5493514111222");
assert.equal(telefonoWhatsApp("+5403512084270"), "5493512084270");
assert.equal(telefonoWhatsApp("351 248-6533"), "5493512486533");
assert.equal(telefonoWhatsApp("03512486533"), "5493512486533");
assert.equal(telefonoWhatsApp("+543512486533"), "5493512486533");
assert.equal(telefonoWhatsApp("+34612345678"), "34612345678");
assert.equal(telefonoWhatsApp("12345"), null);
assert.equal(telefonoWhatsApp(""), null);

const cita = { Fecha: "2026-10-28", Hora: "15:00", Estado: "Pendiente", Contacto: "Pedro Ávila", Telefono: "+5493514111222",
  Calle: "Avenida Colon", Numeracion: "2918", Barrio: "Alberdi" };
assert.equal(mensajeRecordatorio(cita, ahora),
  "¡Hola Pedro! Te escribimos de Grupo Condado por la visita a Avenida Colon 2918, Alberdi: miércoles 28/10 a las 15:00. ¿Nos confirmás si te queda bien?");
assert.match(mensajeRecordatorio({ ...cita, Estado: "Confirmada", Fecha: "2026-10-26" }, ahora),
  /para recordarte la visita a Avenida Colon 2918, Alberdi: mañana a las 15:00. Si no podés venir/);
assert.match(mensajeRecordatorio({ ...cita, Contacto: "", ClienteNombre: "" }, ahora), /^¡Hola! Te escribimos/);
const link = linkRecordatorio(cita, ahora);
assert.ok(link.startsWith("https://wa.me/5493514111222?text="));
assert.equal(decodeURIComponent(link.split("?text=")[1]), mensajeRecordatorio(cita, ahora));
assert.equal(linkRecordatorio({ ...cita, Telefono: "" }, ahora), null);
assert.ok(linkRecordatorio({ ...cita, Telefono: "", ClienteTelefono: "3512486533" }, ahora).includes("wa.me/5493512486533"));

console.log("citas OK");
