import { tipoLabel, localidadLabel, LOCALIDADES } from "./catalogos";
import { numero } from "./format";

export const CHIPS_INICIO = [
  { label: "🏠 Propiedades disponibles", msg: "¿Qué propiedades hay disponibles?" },
  { label: "💰 Rangos de precio",         msg: "¿Cuáles son los rangos de precio?" },
  { label: "🌿 Propiedades eco",          msg: "¿Qué propiedades tienen clase energética A?" },
  { label: "🛒 EcoMarket",                msg: "¿Cómo funciona el EcoMarket?" },
  { label: "📋 Proceso de alquiler",      msg: "¿Cómo es el proceso para alquilar?" },
  { label: "📞 Contacto",                 msg: "¿Cómo me contacto con un agente?" },
];

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const LOCALIDADES_NORMALIZADAS = Object.entries(LOCALIDADES).map(([id, nombre]) => ({
  id: Number(id),
  clave: normalizar(nombre),
}));

function linea(p) {
  return `• ${tipoLabel(p.IdTipo)} en ${p.Barrio}, ${localidadLabel(p.IdLocalidad)} — $${numero(p.Precio)} (${p.Superficie}m²)`;
}

export function generarRespuesta(texto, datos, nombreUsuario) {
  const t = String(texto || "").toLowerCase().trim();
  const tn = normalizar(texto);
  const props = Array.isArray(datos?.props) ? datos.props : [];
  const disponibles = props.filter((p) => p.Estado === "Disponible");

  if (t.includes("hola") || t.includes("buenas") || t.includes("buen día") || t === "" || t.length < 4) {
    return {
      texto: `¡Hola${nombreUsuario ? " " + nombreUsuario : ""}! 👋 Soy el asistente virtual de **Grupo Condado**.\n\n¿En qué te puedo ayudar hoy?`,
      chips: CHIPS_INICIO,
    };
  }

  if (t.includes("gracia")) {
    return { texto: "¡De nada! 😊 Estoy acá cuando lo necesites. ¿Hay algo más en lo que te pueda ayudar?", chips: CHIPS_INICIO };
  }

  if (t.includes("ecomarket") || t.includes("artículo") || t.includes("articulo") || t.includes("vender") || t.includes("regalar") || t.includes("reutiliz")) {
    return {
      texto: "♻️ **EcoMarket** es nuestro espacio de economía circular:\n\n• Publicá muebles, electrodomésticos o cualquier objeto\n• Podés venderlos o regalarlos a la comunidad\n• Los interesados te contactan por chat interno (sin compartir datos personales)\n• Solo necesitás estar registrado como usuario\n\n¿Querés ir al EcoMarket?",
      chips: [{ label: "Ir al EcoMarket", accion: "ecomarket" }],
    };
  }

  if (t.includes("eco") || t.includes("clase a") || t.includes("energ") || t.includes("sustent") || t.includes("solar") || t.includes("bonif")) {
    const claseA = disponibles.filter((p) => p.CategoriaEco === "A");
    if (!claseA.length) {
      return { texto: "Actualmente no hay propiedades Clase A disponibles. Las propiedades Clase A tienen paneles solares y aislamiento térmico, con una bonificación del 15% en el precio." };
    }
    const lista = claseA.map((p) =>
      `• ${tipoLabel(p.IdTipo)} en ${p.Barrio}, ${localidadLabel(p.IdLocalidad)} — $${numero(p.Precio)} → con bonif: $${numero(Math.round(Number(p.Precio || 0) * 0.85))}`
    ).join("\n");
    return {
      texto: `🌿 **${claseA.length} propiedad${claseA.length !== 1 ? "es" : ""} Clase A con 15% de bonificación:**\n\n${lista}\n\nLa bonificación eco se aplica automáticamente a propiedades con paneles solares y aislamiento térmico certificado.`,
      chips: [{ label: "Ver catálogo completo", accion: "catalogo" }],
    };
  }

  if (t.includes("precio") || t.includes("costo") || t.includes("cuánto") || t.includes("cuanto") || t.includes("rango")) {
    if (!disponibles.length) return { texto: "No hay propiedades disponibles en este momento para informar precios." };
    const precios = disponibles.map((p) => Number(p.Precio || 0)).filter((p) => p > 0);
    if (!precios.length) return { texto: "Las propiedades disponibles todavía no tienen precio cargado." };
    const min = numero(Math.min(...precios));
    const max = numero(Math.max(...precios));
    const avg = numero(Math.round(precios.reduce((a, b) => a + b, 0) / precios.length));
    return {
      texto: `📊 **Rango de precios actual:**\n\n• Mínimo: $${min}\n• Máximo: $${max}\n• Promedio: $${avg}\n\nTodos los precios son en pesos argentinos. Las propiedades Clase A tienen una bonificación del 15%.`,
      chips: [{ label: "Ver propiedades eco", msg: "¿Cuáles tienen bonificación?" }],
    };
  }

  if (t.includes("alquil") || t.includes("arrendar") || t.includes("rentar")) {
    return {
      texto: "🔑 **Proceso de alquiler en Grupo Condado:**\n\n1. Explorás el catálogo y encontrás la propiedad\n2. Enviás una consulta con tus datos\n3. Un agente te contacta para coordinar una visita\n4. Si acordás condiciones, se registra la operación\n5. Se firma el contrato con fechas de inicio y fin\n6. Los pagos se registran mensualmente\n\n¿Querés ver las propiedades disponibles para alquilar?",
      chips: [
        { label: "Ver propiedades", msg: "¿Qué propiedades hay disponibles?" },
        { label: "Contactar agente", msg: "¿Cómo me contacto con un agente?" },
      ],
    };
  }

  if (t.includes("comprar") || t.includes("venta") || t.includes("adquir")) {
    return {
      texto: "🏡 **Proceso de compra en Grupo Condado:**\n\n1. Elegís la propiedad del catálogo\n2. Consultás con un agente para negociar\n3. Se verifica la documentación (matrícula y título)\n4. Se registra la operación de venta\n5. La propiedad pasa a estado \"Vendida\"\n\nTodas nuestras propiedades tienen documentación verificada antes de publicarse.",
      chips: [
        { label: "Ver propiedades", accion: "catalogo" },
        { label: "Hacer consulta", accion: "consulta" },
      ],
    };
  }

  if (t.includes("contacto") || t.includes("agente") || t.includes("llamar") || t.includes("hablar") || t.includes("teléfono") || t.includes("telefono")) {
    return {
      texto: "📞 **Contacto con Grupo Condado:**\n\nPodés contactarnos a través del formulario de consultas dentro de la plataforma. Un agente te responderá a la brevedad.\n\n¿Querés ir al formulario de consulta?",
      chips: [{ label: "Ir a consultas", accion: "consulta" }],
    };
  }

  if (t.includes("casa") || t.includes("depto") || t.includes("departamento") || t.includes("lote") || t.includes("terreno")) {
    const tipo = t.includes("casa") ? 1 : t.includes("lote") ? 3 : t.includes("terreno") ? 4 : 2;
    const filtradas = disponibles.filter((p) => Number(p.IdTipo) === tipo);
    const tipoNombre = tipoLabel(tipo) + "s";
    if (!filtradas.length) {
      return {
        texto: `No hay ${tipoNombre} disponibles en este momento. ¿Querés ver otras propiedades?`,
        chips: [{ label: "Ver todo", msg: "¿Qué propiedades hay disponibles?" }],
      };
    }
    const lista = filtradas.slice(0, 4).map((p) =>
      `• ${p.Barrio}, ${localidadLabel(p.IdLocalidad)} — $${numero(p.Precio)} · ${p.Superficie}m²`
    ).join("\n");
    return {
      texto: `🏠 **${filtradas.length} ${tipoNombre} disponible${filtradas.length !== 1 ? "s" : ""}:**\n\n${lista}`,
      chips: [{ label: "Ver catálogo completo", accion: "catalogo" }],
    };
  }

  for (const loc of LOCALIDADES_NORMALIZADAS) {
    if (tn.includes(loc.clave)) {
      const filtradas = disponibles.filter((p) => Number(p.IdLocalidad) === loc.id);
      if (!filtradas.length) return { texto: `No hay propiedades disponibles en ${localidadLabel(loc.id)} en este momento.` };
      const lista = filtradas.slice(0, 4).map((p) =>
        `• ${tipoLabel(p.IdTipo)} en ${p.Barrio} — $${numero(p.Precio)} · ${p.Superficie}m²`
      ).join("\n");
      return { texto: `📍 **${filtradas.length} propiedad${filtradas.length !== 1 ? "es" : ""} en ${localidadLabel(loc.id)}:**\n\n${lista}` };
    }
  }

  if (t.includes("disponible") || t.includes("propiedad") || t.includes("inmueble") || t.includes("qué hay") || t.includes("que hay")) {
    if (!disponibles.length) return { texto: "En este momento no hay propiedades disponibles. Podés dejar tu consulta y te contactamos." };
    const lista = disponibles.slice(0, 4).map(linea).join("\n");
    return {
      texto: `Tenemos **${disponibles.length}** propiedad${disponibles.length !== 1 ? "es" : ""} disponible${disponibles.length !== 1 ? "s" : ""}:\n\n${lista}${disponibles.length > 4 ? "\n\n...y más. ¿Querés buscar por tipo o localidad?" : ""}`,
      chips: [
        { label: "Ver por tipo", msg: "¿Tienen casas disponibles?" },
        { label: "Ver por localidad", msg: "¿Qué hay en Córdoba Capital?" },
        { label: "Ver catálogo completo", accion: "catalogo" },
      ],
    };
  }

  if (t.includes("registr") || t.includes("cuenta") || t.includes("usuario") || t.includes("login") || t.includes("ingresar")) {
    return {
      texto: "👤 **Crear una cuenta en Grupo Condado:**\n\nPodés registrarte haciendo clic en \"Crear cuenta\" en la pantalla de login. Solo necesitás:\n\n• Nombre completo\n• Email\n• Teléfono celular (código de área + número, 10 dígitos)\n• Contraseña (mín. 6 caracteres)\n\nUna vez registrado, tenés acceso al catálogo, EcoMarket y podés hacer consultas.",
    };
  }

  return {
    texto: "No estoy segura de cómo ayudarte con eso. Podés preguntarme sobre propiedades, precios, el proceso de alquiler o compra, EcoMarket, o contactar a un agente.",
    chips: CHIPS_INICIO,
  };
}

export function enriquecerConContexto(texto, historial) {
  if (!historial.length) return texto;
  const anterior = historial[historial.length - 1];
  const esVaga =
    texto.split(" ").length <= 3 ||
    /^(y|qué|cuál|cuánto|cuantas?|tienen|hay|donde|dónde|esas?|esos?|alguna?)\b/i.test(texto);
  if (esVaga && anterior?.respuesta) {
    return texto + " " + anterior.pregunta;
  }
  return texto;
}

export function renderMarkdownBasico(texto) {
  const escapado = String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escapado
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}
