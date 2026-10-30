import { direccion } from "./format.js";

export const ESTADOS_CITA = {
  Pendiente:  { color: "#e65100", bg: "#fff3e0", icono: "fa-clock" },
  Confirmada: { color: "#1565c0", bg: "#e3f2fd", icono: "fa-check" },
  Realizada:  { color: "#2e7d32", bg: "#e8f5e9", icono: "fa-check-double" },
  Cancelada:  { color: "#757575", bg: "#eeeeee", icono: "fa-ban" },
};

export const CITA_VACIA = {
  Fecha: "", Hora: "", Estado: "Pendiente", Notas: "",
  Contacto: "", Telefono: "", IdCliente: "", IdUsuario: "", IdPropiedad: "", IdConsulta: "",
};

export function fechaISO(d = new Date()) {
  const dos = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

export function semanasDelMes(anio, mes) {
  const dias = new Date(anio, mes + 1, 0).getDate();
  const corrimiento = (new Date(anio, mes, 1).getDay() + 6) % 7;   // Lunes = 0
  const celdas = [...Array(corrimiento).fill(null), ...Array.from({ length: dias }, (_, i) => i + 1)];
  while (celdas.length % 7) celdas.push(null);
  const semanas = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
}

export const etiquetaPropiedad = (p) => `${p.type} en ${direccion(p.barrio, p.calle, p.numeracion)}`;

export function propiedadDeConsulta(texto, propiedades) {
  const t = String(texto || "").trim();
  if (!t) return null;
  if (/^\d+$/.test(t)) return propiedades.find((p) => String(p.id) === t) || null;
  // Las consultas viejas de propiedades sin calle terminan en " ·"
  const norm = (s) => s.toLowerCase().replace(/\s+/g, " ").replace(/\s*·\s*$/, "").trim();
  return propiedades.find((p) => norm(etiquetaPropiedad(p)) === norm(t)) || null;
}

export function clienteDeConsulta(consulta, clientes) {
  const tel = (s) => String(s || "").replace(/\D/g, "").slice(-10);
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const t = tel(consulta.Telefono);
  const n = norm(consulta.Nombre);
  return clientes.find((c) => t.length >= 8 && tel(c.Telefono) === t)
    || clientes.find((c) => n && (norm(`${c.Nombre} ${c.Apellido}`) === n || norm(`${c.Apellido} ${c.Nombre}`) === n))
    || null;
}

export function citaDesdeConsulta(consulta, propiedades, clientes = []) {
  const p = propiedadDeConsulta(consulta.PropiedadInteres, propiedades);
  const cliente = clienteDeConsulta(consulta, clientes);
  return {
    ...CITA_VACIA,
    Contacto: consulta.Nombre || "",
    Telefono: consulta.Telefono || "",
    IdCliente: cliente ? cliente.IdCliente : "",
    IdConsulta: consulta.IdConsulta ?? "",
    IdPropiedad: p ? p.id : "",
    Notas: consulta.Mensaje ? `Consulta: ${consulta.Mensaje}` : "",
  };
}

// Una visita ocupa al agente una hora: dos citas suyas tienen que estar al menos así de separadas
export const DURACION_CITA_MIN = 60;

const minutos = (hora) => {
  const [h, m] = String(hora).split(":").map(Number);
  return h * 60 + (m || 0);
};

export function validarCita(c, citas, hoy = fechaISO()) {
  if (!c.Fecha) return "Elegí el día de la cita.";
  if (!c.Hora) return "Elegí la hora de la cita.";
  if (!c.IdPropiedad) return "Elegí la propiedad.";
  if (!c.IdCliente && !String(c.Contacto).trim()) return "Elegí un cliente o escribí el nombre del contacto.";
  if (!c.IdCita && c.Fecha < hoy) return "No se puede agendar una cita en una fecha pasada.";
  if (c.IdUsuario && c.Estado !== "Cancelada") {
    const choque = citas.find((o) => o.IdCita !== c.IdCita && o.Estado !== "Cancelada"
      && String(o.IdUsuario) === String(c.IdUsuario) && o.Fecha === c.Fecha
      && Math.abs(minutos(o.Hora) - minutos(c.Hora)) < DURACION_CITA_MIN);
    if (choque) return `${choque.Agente || "Ese agente"} ya tiene una cita el ${c.Fecha.split("-").reverse().join("/")} a las ${String(choque.Hora).slice(0, 5)}. Las visitas duran una hora.`;
  }
  return null;
}

export function cuerpoCita(c) {
  const id = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
  return {
    Fecha: c.Fecha, Hora: c.Hora, Estado: c.Estado || "Pendiente",
    Notas: String(c.Notas || "").trim() || null,
    Contacto: String(c.Contacto || "").trim() || null,
    Telefono: String(c.Telefono || "").trim() || null,
    IdCliente: id(c.IdCliente), IdUsuario: id(c.IdUsuario), IdPropiedad: id(c.IdPropiedad), IdConsulta: id(c.IdConsulta),
  };
}

const activa = (c) => c.Estado === "Pendiente" || c.Estado === "Confirmada";
const horaActual = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export function proximasCitas(citas, ahora = new Date(), cantidad = Infinity) {
  const hoy = fechaISO(ahora);
  const hora = horaActual(ahora);
  return citas
    .filter((c) => activa(c) && (c.Fecha > hoy || (c.Fecha === hoy && String(c.Hora) >= hora)))
    .sort((a, b) => `${a.Fecha} ${a.Hora}`.localeCompare(`${b.Fecha} ${b.Hora}`))
    .slice(0, cantidad);
}

export function etiquetaDia(fecha, ahora = new Date()) {
  const hoy = fechaISO(ahora);
  const manana = fechaISO(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1));
  if (fecha === hoy) return "Hoy";
  if (fecha === manana) return "Mañana";
  const [a, m, d] = fecha.split("-").map(Number);
  const dia = new Date(a, m - 1, d).toLocaleDateString("es-AR", { weekday: "long" });
  return `${dia} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

export const direccionCita = (c) =>
  [`${c.Calle || ""} ${c.Numeracion || ""}`.trim(), c.Barrio].filter(Boolean).join(", ") || "la propiedad";

export function telefonoWhatsApp(tel) {
  let d = String(tel || "").replace(/\D/g, "").replace(/^00/, "");
  if (d.startsWith("54")) d = d.slice(2).replace(/^9/, "").replace(/^0/, "");
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  else if (d.length !== 10) return d.length >= 10 ? d : null;   // Número de otro país
  return d.length === 10 ? `549${d}` : null;
}

export function mensajeRecordatorio(c, ahora = new Date()) {
  const nombre = String(c.Contacto || c.ClienteNombre || "").trim().split(/\s+/)[0];
  const cuando = `${etiquetaDia(c.Fecha, ahora).toLowerCase()} a las ${c.Hora}`;
  const saludo = `¡Hola${nombre ? ` ${nombre}` : ""}! Te escribimos de Grupo Condado`;
  return c.Estado === "Confirmada"
    ? `${saludo} para recordarte la visita a ${direccionCita(c)}: ${cuando}. Si no podés venir, avisanos por acá. ¡Te esperamos!`
    : `${saludo} por la visita a ${direccionCita(c)}: ${cuando}. ¿Nos confirmás si te queda bien?`;
}

export function linkRecordatorio(c, ahora = new Date()) {
  const tel = telefonoWhatsApp(c.Telefono || c.ClienteTelefono);
  return tel ? `https://wa.me/${tel}?text=${encodeURIComponent(mensajeRecordatorio(c, ahora))}` : null;
}
