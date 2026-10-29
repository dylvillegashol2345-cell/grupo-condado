import { api, ApiError, comoLista, primeraFila, recurso } from "./api";
import { ROL_A_ID } from "../utils/catalogos";

export const propiedades  = recurso("Propiedad");
export const propietarios = recurso("Propietario");
export const clientes     = recurso("Cliente");
export const operaciones  = recurso("Operacion");
export const contratos    = recurso("Contrato");
export const contratoDocumentos = recurso("ContratoDocumento");
export const pagos        = recurso("Pago");
export const usuarios     = recurso("Usuario");
export const consultas    = recurso("Consulta");
export const citas        = recurso("Cita");
export const ecoItems     = recurso("EcoMarketItem");

export async function login(nombre, contrasena, captchaToken) {
  const data = await api.post("/Login", {
    Nombre: nombre,
    Contrasena: contrasena,
    CaptchaToken: captchaToken || "",
  });
  const filas = comoLista(data);
  return filas.length ? filas[0] : null;
}

export function registrar({ nombre, email, telefono, contrasena }) {
  return api.post("/Usuario", {
    Nombre: nombre,
    Email: email,
    Telefono: telefono,
    Contrasena: contrasena,
    IdRol: ROL_A_ID.Cliente,
  });
}

export async function cambiarRol(idUsuario, nuevoRol) {
  const actual = await usuarios.obtener(idUsuario);
  if (!actual) throw new Error("Usuario no encontrado");
  await usuarios.actualizar(idUsuario, {
    IdUsuario: idUsuario,
    Nombre: actual.Nombre || actual.NombreUsuario || "",
    Email: actual.Email || "",
    Contrasena: "___NOCHANGE___",
    IdRol: ROL_A_ID[nuevoRol] || ROL_A_ID.Cliente,
  });
}

export async function imagenesDePropiedad(idPropiedad) {
  return comoLista(await api.get(`/PropiedadImagen/${idPropiedad}`));
}

export function crearImagenPropiedad({ IdPropiedad, Url, Orden = 0, EsPrincipal = false }) {
  return api.post("/PropiedadImagen", { IdPropiedad, Url, Orden, EsPrincipal });
}

export function eliminarImagenPropiedad(idImagen) {
  return api.del(`/PropiedadImagen/${idImagen}`);
}

export async function ecoItemsDeUsuario(idUsuario) {
  return comoLista(await api.get(`/EcoMarketItem/Usuario/${idUsuario}`));
}

export function cambiarEstadoEco(idItem, estado) {
  return api.put(`/EcoMarketItem/${idItem}`, { Estado: estado });
}

export async function contactosDeItem(idItem) {
  return comoLista(await api.get(`/EcoMarketContacto/Item/${idItem}`));
}

export async function listarContactosEco() {
  try {
    return comoLista(await api.get("/EcoMarketContacto"));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

export function crearContactoEco(body) {
  return api.post("/EcoMarketContacto", body);
}

export async function mensajesDeConversacion(idContacto) {
  return comoLista(await api.get(`/EcoMarketMensaje/Conversacion/${idContacto}`));
}

export function enviarMensajeEco({ IdContacto, IdUsuario, Texto }) {
  return api.post("/EcoMarketMensaje", { IdContacto, IdUsuario, Texto });
}

export function marcarMensajesLeidos(idContacto, idUsuario) {
  return api.put("/EcoMarketMensaje/MarcarLeido", { IdContacto: idContacto, IdUsuario: idUsuario });
}

export { primeraFila };
