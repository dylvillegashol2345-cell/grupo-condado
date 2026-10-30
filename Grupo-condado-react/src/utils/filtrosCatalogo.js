import { convertir } from "./cotizacion.js";

export const PRECIO_MAX = 2000000;
export const SUP_MAX = 5000;

export const FILTROS_CATALOGO_VACIOS = {
  texto: "",
  tipo: "",
  eco: "",
  localidad: "",
  precioMin: 0,
  precioMax: PRECIO_MAX,
  supMin: 0,
  supMax: SUP_MAX,
  paneles: false,
  aislacion: false,
  dormitorios: "",
  estado: "",
  pileta: false,
  cochera: false,
};

export function contarFiltrosActivos(f) {
  let n = 0;
  if (f.texto.trim()) n++;
  if (f.tipo) n++;
  if (f.eco) n++;
  if (f.estado) n++;
  if (f.localidad) n++;
  if (f.precioMin > 0 || f.precioMax < PRECIO_MAX) n++;
  if (f.supMin > 0 || f.supMax < SUP_MAX) n++;
  if (f.paneles) n++;
  if (f.aislacion) n++;
  if (f.dormitorios) n++;
  if (f.pileta) n++;
  if (f.cochera) n++;
  return n;
}

function cumpleDormitorios(caract, valor) {
  const tiene = parseInt(caract.dormitorios, 10);
  if (Number.isNaN(tiene)) return false;
  const buscado = parseInt(valor, 10);
  return buscado >= 4 ? tiene >= 4 : tiene === buscado;
}

const normalizar = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// El rango de precio está en pesos: los precios en dólares se convierten con la cotización
export function filtrarCatalogo(lista, f, cotizacion) {
  const texto = normalizar(f.texto).trim();
  return lista.filter((p) => {
    const precio = convertir(p.precioNum, p.moneda, "ARS", cotizacion);
    if (texto && !normalizar([p.title, p.localidad, p.type, p.estado].join(" ")).includes(texto)) return false;
    if (f.tipo && p.type !== f.tipo) return false;
    if (f.eco && p.categoriaEco !== f.eco) return false;
    if (f.estado && p.estado !== f.estado) return false;
    if (f.localidad && String(p.localidadId) !== String(f.localidad)) return false;
    if (precio < f.precioMin) return false;
    if (f.precioMax < PRECIO_MAX && precio > f.precioMax) return false;
    if (Number(p.surface || 0) < f.supMin) return false;
    if (f.supMax < SUP_MAX && Number(p.surface || 0) > f.supMax) return false;
    if (f.paneles && !p.paneles) return false;
    if (f.aislacion && !p.aislamiento) return false;

    const c = p.caract || {};
    if (f.dormitorios && !cumpleDormitorios(c, f.dormitorios)) return false;
    if (f.pileta && c.pileta !== "Si") return false;
    if (f.cochera && (!c.cochera || c.cochera === "No")) return false;
    return true;
  });
}

export const ORDENES = [
  { valor: "",            label: "Ordenar por" },
  { valor: "precio_asc",  label: "💰 Precio: menor a mayor" },
  { valor: "precio_desc", label: "💰 Precio: mayor a menor" },
  { valor: "sup_desc",    label: "📐 Mayor superficie" },
  { valor: "sup_asc",     label: "📐 Menor superficie" },
  { valor: "recientes",   label: "🕐 Más recientes" },
];

export function ordenar(lista, orden, cotizacion) {
  const out = [...lista];
  const pesos = (p) => convertir(p.precioNum, p.moneda, "ARS", cotizacion);
  if (orden === "precio_asc")  out.sort((a, b) => pesos(a) - pesos(b));
  if (orden === "precio_desc") out.sort((a, b) => pesos(b) - pesos(a));
  if (orden === "sup_desc")    out.sort((a, b) => Number(b.surface || 0) - Number(a.surface || 0));
  if (orden === "sup_asc")     out.sort((a, b) => Number(a.surface || 0) - Number(b.surface || 0));
  if (orden === "recientes")   out.sort((a, b) => b.id - a.id);
  return out;
}
