import { money } from "./format";
import { mensajesDeConversacion } from "../services/entidades";

export const CLASE_ESTADO_ECO = {
  Disponible: "tabla-badge-ok",
  Reservado: "tabla-badge-alquiler",
  Entregado: "tabla-badge-venta",
};

export const BADGE_BS_ECO = {
  Disponible: "success",
  Reservado: "warning",
  Entregado: "secondary",
};

const IMG_ECO_BASE = "https://images.unsplash.com/photo-1567016432779-094069958ea5";
export const IMG_ECO_CARD = `${IMG_ECO_BASE}?w=400&q=60`;
export const IMG_ECO_DETALLE = `${IMG_ECO_BASE}?w=900&q=70`;
export const IMG_ECO_MINI = `${IMG_ECO_BASE}?w=120&q=60`;

export function precioEco(item) {
  return item.EsGratis ? "GRATIS" : money(item.Precio);
}

function mismoNombre(a, b) {
  return a && b && String(a).toLowerCase().trim() === String(b).toLowerCase().trim();
}

export function contactoEsMio(contacto, usuario) {
  if (!contacto || !usuario) return false;
  if (contacto.IdUsuarioRemitente && Number(contacto.IdUsuarioRemitente) === Number(usuario.IdUsuario)) return true;
  return mismoNombre(contacto.Nombre, usuario.Nombre) || mismoNombre(contacto.Nombre, usuario.NombreUsuario);
}

export async function bandejaUnificada(contactos, misItems, usuario) {
  if (!usuario) return [];
  const idsMios = new Set(misItems.map((i) => Number(i.IdItem)));

  const candidatos = contactos
    .map((c) => ({
      contacto: c,
      soyPublicador: idsMios.has(Number(c.IdItem)),
      soyInteresado: contactoEsMio(c, usuario),
    }))
    .filter((c) => c.soyPublicador || c.soyInteresado);

  const conMensajes = await Promise.all(
    candidatos.map(async (c) => {
      const mensajes = await mensajesDeConversacion(c.contacto.IdContacto).catch(() => []);
      const ultimo = mensajes.length ? mensajes[mensajes.length - 1] : null;
      return {
        ...c,
        mensajes,
        sinLeer: noLeidos(mensajes, usuario.IdUsuario),
        fechaUltimo: new Date(ultimo?.Fecha || 0).getTime(),
        etiqueta: c.soyPublicador ? "Tu publicación" : "Te interesa",
      };
    })
  );

  return conMensajes.sort((a, b) => (b.sinLeer - a.sinLeer) || (b.fechaUltimo - a.fechaUltimo));
}

export function noLeidos(mensajes, idUsuario) {
  return mensajes.filter((m) => Number(m.IdUsuario) !== Number(idUsuario) && !m.Leido).length;
}
