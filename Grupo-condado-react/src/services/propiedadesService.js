import { propiedades } from "./entidades";
import { tipoLabel, localidadLabel } from "../utils/catalogos";
import { precio as precioFmt } from "../utils/format";
import { normalizarImagen as imagenDe } from "../utils/imagenes";
import { chipsResumen, parsearCaracteristicas, parsearServicios } from "../utils/caracteristicas";

export const PREFIJO_MANZANA = "Mza. ";
export const PREFIJO_LOTE    = "Lote ";

export function esCountry(p) {
  return String(p?.Calle || "").startsWith(PREFIJO_MANZANA);
}

export function mapPropiedad(p) {
  const piso  = p.Piso ? ` · Piso ${p.Piso}` : "";
  const depto = p.NroDepto ? ` Depto ${p.NroDepto}` : "";
  return {
    id:           p.IdPropiedad,
    raw:          p,
    image:        imagenDe(p.Imagen),
    type:         tipoLabel(p.IdTipo),
    tipoId:       Number(p.IdTipo),
    localidad:    localidadLabel(p.IdLocalidad),
    localidadId:  Number(p.IdLocalidad),
    title:        `${p.Barrio || ""} · ${p.Calle || ""} ${p.Numeracion || ""}${piso}${depto}`.trim(),
    price:        precioFmt(p.Precio, p.Moneda),
    precioNum:    Number(p.Precio) || 0,
    moneda:       p.Moneda || "ARS",
    tour360:      p.Tour360 || "",
    location:     [p.Barrio, `${p.Calle || ""} ${p.Numeracion || ""}`.trim()].filter(Boolean).join(", "),
    barrio:       p.Barrio || "",
    calle:        p.Calle || "",
    numeracion:   p.Numeracion || "",
    piso:         p.Piso || "",
    nroDepto:     p.NroDepto || "",
    surface:      p.Superficie ?? null,
    categoriaEco: p.CategoriaEco || null,
    bonificacion: Number(p.Bonificacion) || 0,
    estado:       p.Estado || "Disponible",
    paneles:      Boolean(p.PanelesSolares),
    aislamiento:  Boolean(p.AislamientoTermico),
    publicada:    Boolean(p.Publicada),
    matricula:    Boolean(p.MatriculaVerificada),
    titulo:       Boolean(p.TituloPropiedad),
    idPropietario: p.IdPropietario ?? null,
    caracteristicas: chipsResumen(p.Descripcion),
    caract: parsearCaracteristicas(p.Descripcion) || {},
    servicios:    parsearServicios(p.Servicios),
    country:      esCountry(p),
  };
}

export async function obtenerPropiedades() {
  const data = await propiedades.listar();
  return data.map(mapPropiedad);
}

export async function obtenerPropiedad(id) {
  const fila = await propiedades.obtener(id);
  return fila ? mapPropiedad(fila) : null;
}
