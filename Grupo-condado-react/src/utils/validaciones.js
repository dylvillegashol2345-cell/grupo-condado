export const SOLO_LETRAS  = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/;
export const EMAIL_LIBRE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const REGLAS_DOCUMENTO = {
  DNI:       { max: 8,  soloNumeros: true,  re: /^\d{8}$/,           msg: "El DNI debe tener exactamente 8 dígitos" },
  CUIL:      { max: 11, soloNumeros: true,  re: /^\d{11}$/,          msg: "El CUIL debe tener exactamente 11 dígitos" },
  CUIT:      { max: 11, soloNumeros: true,  re: /^\d{11}$/,          msg: "El CUIT debe tener exactamente 11 dígitos" },
  Pasaporte: { max: 9,  soloNumeros: false, re: /^[A-Za-z0-9]{9}$/,  msg: "El Pasaporte debe tener exactamente 9 caracteres alfanuméricos" },
};

export function validarPropiedad(body) {
  const precio     = Number(body.Precio);
  const superficie = Number(body.Superficie);

  if (!String(body.Barrio || "").trim())       return "Debe ingresar el barrio o nombre del country";
  if (Number.isNaN(precio) || precio <= 0)     return "El precio debe ser mayor a cero";
  if (!(Number(body.IdLocalidad) > 0))         return "Debe seleccionar una localidad";
  if (superficie < 0 || superficie > 9999)     return "La superficie debe estar entre 0 y 9999 m²";
  return null;
}

export function validarPropietario(body, otros = [], idActual = null) {
  const tipoDoc = body.TipoDocumento || "DNI";
  const regla   = REGLAS_DOCUMENTO[tipoDoc] || REGLAS_DOCUMENTO.DNI;
  const doc     = String(body.DNI || "");

  if (!regla.re.test(doc))                                        return regla.msg;
  if (!String(body.Nombre || "").trim() ||
      !SOLO_LETRAS.test(body.Nombre.trim()))                      return "El nombre solo puede contener letras";
  if (!String(body.Apellido || "").trim() ||
      !SOLO_LETRAS.test(body.Apellido.trim()))                    return "El apellido solo puede contener letras";
  if (!EMAIL_LIBRE.test(String(body.Email || "")))                return "Ingresá un email válido";
  if (!String(body.Calle || "").trim() ||
      !SOLO_LETRAS.test(body.Calle.trim()))                       return "La calle solo puede contener letras";
  if (!/^\d+$/.test(String(body.Numeracion || "").trim()))        return "La numeración solo puede contener números";
  if (!String(body.Localidad || "").trim() ||
      !SOLO_LETRAS.test(body.Localidad.trim()))                   return "La localidad solo puede contener letras";

  const dupDoc = otros.some(
    (p) => String(p.DNI) === doc && p.IdPropietario !== idActual
  );
  if (dupDoc) return `Ese ${tipoDoc} ya está registrado`;

  const email = String(body.Email || "").toLowerCase();
  const dupEmail = otros.some(
    (p) => String(p.Email || "").toLowerCase() === email && p.IdPropietario !== idActual
  );
  if (dupEmail) return "Ese email ya está registrado";

  return null;
}

export function validarCliente(body) {
  const nombre = String(body.Nombre || "").trim();
  if (!nombre)                        return "Debe ingresar el nombre del cliente";
  if (!SOLO_LETRAS.test(nombre))      return "El nombre solo puede contener letras";

  const tel = String(body.Telefono || "").replace(/^\+54/, "").trim();
  if (!tel)                           return "Debe ingresar un teléfono";
  if (!/^\d{10,11}$/.test(tel))       return "El teléfono debe tener 10 u 11 dígitos (ej: 3512486533)";
  return null;
}

export function validarOperacion(body) {
  if (!(body.IdPropiedad > 0)) return "Debe seleccionar una propiedad";
  if (!(body.IdCliente > 0))   return "Debe seleccionar un cliente";
  if (!(body.IdUsuario > 0))   return "Debe seleccionar un agente responsable";
  if (!body.Tipo)              return "Debe seleccionar el tipo de operación";
  if (!body.Fecha)             return "Debe ingresar una fecha";
  return null;
}

export function validarContrato(body) {
  if (!body.FechaInicio || !body.FechaFin)                       return "Debe ingresar ambas fechas del contrato";
  if (new Date(body.FechaFin) < new Date(body.FechaInicio))      return "La fecha de fin no puede ser anterior a la de inicio";
  if (!(body.IdOperacion > 0))                                   return "Debe seleccionar una operación válida";
  return null;
}

export function validarPago(body) {
  if (!(Number(body.Monto) > 0))     return "El monto debe ser mayor a cero";
  if (!body.Fecha)                   return "Debe ingresar una fecha";
  if (!(Number(body.IdContrato) > 0)) return "Debe seleccionar un contrato";
  return null;
}

export function validarConsulta({ nombre, telefono, mensaje }) {
  if (!String(nombre || "").trim())          return "Ingresá tu nombre";
  if (!/^\d{10,11}$/.test(String(telefono || ""))) return "El teléfono debe tener 10 u 11 dígitos";
  if (!String(mensaje || "").trim())         return "Escribí un mensaje";
  return null;
}

export function validarRegistro({ nombre, email, telefono, pass, passConfirm }) {
  if (!String(nombre || "").trim())              return "Ingresá tu nombre";
  if (!EMAIL_LIBRE.test(String(email || "")))    return "Ingresá un email válido";
  if (!/^\d{10}$/.test(String(telefono || "")))  return "El teléfono debe tener 10 dígitos: código de área y número, sin el 0 ni el 15";
  if (String(pass || "").length < 6)             return "La contraseña debe tener al menos 6 caracteres";
  if (pass !== passConfirm)                      return "Las contraseñas no coinciden";
  return null;
}

export function fortalezaPassword(val) {
  let score = 0;
  if (String(val).length >= 8)      score++;
  if (/[A-Z]/.test(val))            score++;
  if (/[0-9]/.test(val))            score++;
  if (/[^A-Za-z0-9]/.test(val))     score++;
  return score;
}

export const NIVELES_PASSWORD = [
  { pct: 0,   color: "#e8e0db", texto: "" },
  { pct: 25,  color: "#c62828", texto: "Muy débil" },
  { pct: 50,  color: "#e65100", texto: "Débil" },
  { pct: 75,  color: "#f9a825", texto: "Aceptable" },
  { pct: 100, color: "#2e7d32", texto: "Fuerte" },
];

export function validarContratoVenta(body) {
  if (!(body.IdOperacion > 0))                              return "Debe seleccionar una operación de venta";
  if (!body.FechaInicio)                                    return "Debe ingresar la fecha de firma";
  if (!body.FechaFin)                                       return "Debe ingresar la fecha de escrituración";
  if (new Date(body.FechaFin) < new Date(body.FechaInicio)) return "La escrituración no puede ser anterior a la firma";
  if (body.FechaPosesion && new Date(body.FechaPosesion) < new Date(body.FechaInicio))
    return "La entrega de llaves no puede ser anterior a la firma";
  if (!(body.PrecioTotal > 0))                              return "El precio total debe ser mayor a cero";
  if (Number(body.Sena) > Number(body.PrecioTotal))         return "La seña no puede superar el precio total";
  if (Number(body.Sena) < 0)                                return "La seña no puede ser negativa";
  return null;
}
