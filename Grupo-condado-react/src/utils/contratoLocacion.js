import { numeroALetras, montoEnLetras, cantidadEnLetras } from "./numeroALetras";
import { fechaInput, mesesEntre } from "./format";
import { contratoDocumentos } from "../services/entidades";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const ORDINALES = [
  "Primera", "Segunda", "Tercera", "Cuarta", "Quinta", "Sexta", "Séptima", "Octava", "Novena", "Décima",
];
function ordinal(n) {
  if (n <= 10) return ORDINALES[n - 1];
  if (n < 20) return "Décima " + ORDINALES[n - 11].toLowerCase();
  if (n === 20) return "Vigésima";
  if (n < 30) return "Vigésima " + ORDINALES[n - 21].toLowerCase();
  return "Trigésima";
}

export const PERIODICIDADES = {
  3: { periodo: "trimestre", forma: "trimestral" },
  4: { periodo: "cuatrimestre", forma: "cuatrimestral" },
  6: { periodo: "semestre", forma: "semestral" },
  12: { periodo: "año", forma: "anual" },
};

export const INDICES = {
  IPC: "Índice de Precios al Consumidor (IPC) publicado por el Instituto Nacional de Estadística y Censos (INDEC)",
  ICL: "Índice para Contratos de Locación (ICL) publicado por el Banco Central de la República Argentina (BCRA)",
  CVS: "Coeficiente de Variación Salarial (CVS) publicado por el INDEC",
};

const ESTADO_PARTICULAR_DEFECTO =
  "a) Pintura: la unidad se encuentra recientemente pintada en su totalidad. b) Aberturas y carpintería: los marcos de las ventanas y puertas se encuentran en muy buen estado y funcionando correctamente. c) Baño: todos los artefactos sanitarios y griferías se encuentran en correcto estado de funcionamiento. d) Pisos: se encuentran en excelente estado de conservación, obligándose el locatario a su cuidado y conservación, evitando rayaduras, perforaciones o cualquier daño que exceda el uso normal. e) Placares: se encuentran en muy buen estado general, debiendo el locatario evitar su deterioro.";

export const PERSONA_VACIA = { nombre: "", apellido: "", dni: "", cuil: "", tel: "", email: "", info: "" };
export const AMBIENTE_VACIO = { ambiente: "", descripcion: "" };

export const CONTRATO_LOCACION_VACIO = {
  ciudad: "Córdoba",
  fechaFirma: "",
  locadores: [{ ...PERSONA_VACIA }],
  nacLocadores: "argentinos",
  locatarios: [{ ...PERSONA_VACIA }],
  nacLocatarios: "argentinos",
  direccion: "",
  unidad: "",
  cochera: "",
  complejo: "",
  inmuebleCiudad: "Córdoba",
  provincia: "Córdoba",
  composicion: "",
  plazoMeses: 24,
  fechaInicio: "",
  fechaFin: "",
  moneda: "ARS",
  canon: "",
  periodicidad: 3,
  indice: "IPC",
  indiceSupletorio: "Índice de la Cámara de la Construcción de Córdoba (ICC)",
  domicilioPago: "",
  horarioPago: "de lunes a viernes en el horario de 09:30 a 13:30 horas",
  diaLimitePago: 9,
  horaTransferencia: "14:00",
  interesDiario: 1,
  serviciosDias: 5,
  empresaLuz: "la Empresa Provincial de Energía de Córdoba (E.P.E.C.)",
  empresaGas: "ECOGAS",
  seguroDias: 10,
  estadoParticular: ESTADO_PARTICULAR_DEFECTO,
  verificacionDias: 30,
  destino: "vivienda familiar",
  prohibeAnimales: true,
  rescisionPct: 10,
  ocupacionPct: 10,
  honorarios: "",
  informes: "",
  honorariosDesde: "",
  domicilioProfesional: "",
  garantes: [],
  domicilioGarantes: "",
  corredor: "",
  corredorMatricula: "",
  administrador: "",
  domicilioLocador: "",
  ejemplares: 3,
  ambientes: [{ ...AMBIENTE_VACIO }],
  emailFotos: "",
};

const claveLocal = (id) => `contratoLocacion_${id}`;

function leerLocal(id) {
  try {
    const crudo = localStorage.getItem(claveLocal(id));
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

export async function cargarDocumento(id) {
  let datos;
  try {
    const fila = await contratoDocumentos.obtener(id);
    datos = fila?.Datos ? JSON.parse(fila.Datos) : null;
  } catch {
    datos = leerLocal(id);
  }
  return datos ? { ...CONTRATO_LOCACION_VACIO, ...datos } : null;
}

export async function guardarDocumento(id, datos) {
  try {
    await contratoDocumentos.actualizar(id, { Datos: JSON.stringify(datos) });
    try { localStorage.removeItem(claveLocal(id)); } catch { /* se ignora */ }
    return "base";
  } catch {
    localStorage.setItem(claveLocal(id), JSON.stringify(datos));
    return "navegador";
  }
}

function separarNombre(completo) {
  const partes = String(completo || "").trim().split(/\s+/);
  if (partes.length < 2) return { nombre: partes[0] || "", apellido: "" };
  return { nombre: partes.slice(0, -1).join(" "), apellido: partes[partes.length - 1] };
}

const DE_LA_PROPIEDAD = [
  "nacLocadores", "unidad", "cochera", "complejo", "composicion", "destino",
  "periodicidad", "indice", "indiceSupletorio",
  "domicilioPago", "horarioPago", "diaLimitePago", "horaTransferencia", "interesDiario",
  "serviciosDias", "empresaLuz", "empresaGas", "seguroDias", "estadoParticular", "verificacionDias",
  "prohibeAnimales", "rescisionPct", "ocupacionPct", "domicilioProfesional",
  "corredor", "corredorMatricula", "administrador", "domicilioLocador", "ejemplares",
];

const conNombre = (lista) => (lista || []).filter((p) => `${p.nombre}${p.apellido}`.trim());
const mismoDni = (a, b) => String(a || "").replace(/\D/g, "") !== "" &&
  String(a).replace(/\D/g, "") === String(b || "").replace(/\D/g, "");

export function combinarConAnteriores(iniciales, docPropiedad, docCliente) {
  const d = { ...iniciales };

  if (docPropiedad) {
    for (const k of DE_LA_PROPIEDAD) {
      if (docPropiedad[k] !== undefined && docPropiedad[k] !== "") d[k] = docPropiedad[k];
    }
    const ambientes = (docPropiedad.ambientes || []).filter((a) => `${a.ambiente}${a.descripcion}`.trim());
    if (ambientes.length) d.ambientes = ambientes;

    const previos = conNombre(docPropiedad.locadores);
    const actual = d.locadores[0] || {};
    const sinLocador = !`${actual.nombre}${actual.apellido}`.trim();
    if (previos.length && (sinLocador || previos.some((p) => mismoDni(p.dni, actual.dni)))) {
      d.locadores = previos;
    }
  }

  if (docCliente) {
    const previos = conNombre(docCliente.locatarios);
    const actual = d.locatarios[0] || {};
    if (previos.some((p) => mismoDni(p.dni, actual.dni))) {
      d.locatarios = previos;
      d.nacLocatarios = docCliente.nacLocatarios || d.nacLocatarios;
      d.emailFotos = d.emailFotos || docCliente.emailFotos || "";
      if (conNombre(docCliente.garantes).length) {
        d.garantes = conNombre(docCliente.garantes);
        d.domicilioGarantes = docCliente.domicilioGarantes || d.domicilioGarantes;
      }
    }
  }
  return d;
}

export function datosIniciales(c, { propiedad, propietario, cliente } = {}) {
  const locador = propietario
    ? { ...PERSONA_VACIA, nombre: propietario.Nombre || "", apellido: propietario.Apellido || "", dni: propietario.DNI || "" }
    : { ...PERSONA_VACIA, ...separarNombre(c.LocadorNombre), dni: c.LocadorDni || "" };
  const locatario = cliente
    ? {
      ...PERSONA_VACIA, nombre: cliente.Nombre || "", apellido: cliente.Apellido || "",
      dni: cliente.DNI || "", tel: cliente.Telefono || "", email: cliente.Email || "",
    }
    : { ...PERSONA_VACIA, ...separarNombre(c.LocatarioNombre), dni: c.LocatarioDni || "" };

  const inicio = fechaInput(c.FechaInicio);
  const meses = mesesEntre(c.FechaInicio, c.FechaFin);
  const unidad = [propiedad?.Piso && `piso ${propiedad.Piso}`, propiedad?.NroDepto && `departamento “${propiedad.NroDepto}”`]
    .filter(Boolean).join(", ");

  return {
    ...CONTRATO_LOCACION_VACIO,
    fechaFirma: new Date().toISOString().slice(0, 10),
    locadores: [locador],
    locatarios: [locatario],
    direccion: c.InmuebleDireccion || [propiedad?.Calle, propiedad?.Numeracion].filter(Boolean).join(" N° "),
    unidad,
    inmuebleCiudad: c.InmuebleLocalidad || CONTRATO_LOCACION_VACIO.inmuebleCiudad,
    plazoMeses: meses > 0 ? meses : CONTRATO_LOCACION_VACIO.plazoMeses,
    fechaInicio: inicio,
    fechaFin: fechaInput(c.FechaFin),
    moneda: c.Moneda === "USD" ? "USD" : "ARS",
    canon: c.CanonMensual || "",
    indice: INDICES[c.IndiceActualizacion] ? c.IndiceActualizacion : CONTRATO_LOCACION_VACIO.indice,
    destino: (c.Destino || CONTRATO_LOCACION_VACIO.destino).toLowerCase(),
    domicilioLocador: c.LocadorDomicilio || "",
    emailFotos: locatario.email,
  };
}

function e(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const RAYA = "______________";

function dni(valor) {
  const s = String(valor || "").trim();
  return /^\d+$/.test(s) ? Number(s).toLocaleString("es-AR") : s;
}

function partesFecha(iso) {
  if (!iso) return null;
  const [a, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  if (!a || !m || !d) return null;
  return { a, m, d };
}

function fechaTexto(iso) {
  const f = partesFecha(iso);
  return f ? `${String(f.d).padStart(2, "0")} de ${MESES[f.m - 1]} de ${f.a}` : RAYA;
}

function fechaEnLetras(iso) {
  const f = partesFecha(iso);
  return f ? `${cantidadEnLetras(f.d)} de ${MESES[f.m - 1].toLowerCase()} de ${f.a}` : RAYA;
}

function mesTexto(iso, desplazamiento = 0) {
  const f = partesFecha(iso);
  if (!f) return RAYA;
  const total = f.m - 1 + desplazamiento;
  return `${MESES[((total % 12) + 12) % 12]} de ${f.a + Math.floor(total / 12)}`;
}

export function calcularFechaFin(inicio, meses) {
  const f = partesFecha(inicio);
  if (!f || !Number(meses)) return "";
  const d = new Date(f.a, f.m - 1 + Number(meses), f.d - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function lista(items) {
  if (items.length <= 1) return items.join("");
  return items.slice(0, -1).join(", ") + " y " + items[items.length - 1];
}

function personasValidas(arr) {
  return (arr || []).filter((p) => (p.nombre || p.apellido || "").trim());
}

function persona(p, { contacto = false } = {}) {
  const nombre = `${e(p.nombre.trim())} <strong>${e(p.apellido.trim().toUpperCase())}</strong>`.trim();
  const datos = [
    p.dni && `D.N.I. N° ${e(dni(p.dni))}`,
    p.cuil && `CUIL N° ${e(p.cuil)}`,
    contacto && p.tel && `TEL: ${e(p.tel)}`,
    contacto && p.email && `email: ${e(p.email)}`,
  ].filter(Boolean);
  return [nombre, ...datos].join(" ");
}

function grupo(cantidad, nacionalidad) {
  const nac = e(String(nacionalidad || "").trim());
  return cantidad > 1
    ? `${nac} y mayores de edad, en adelante denominados`
    : `${nac.replace(/s$/, "")}, mayor de edad, en adelante denominado`;
}

function nombreCorto(p) {
  return `${e(p.nombre.trim())} ${e(p.apellido.trim().toUpperCase())}`.trim();
}

function armarClausulas(d) {
  const per = PERIODICIDADES[d.periodicidad] || PERIODICIDADES[3];
  const garantes = personasValidas(d.garantes);
  const indice = INDICES[d.indice] || e(d.indice);
  const pctLetras = (n) => `${numeroALetras(n)} por ciento (${n}%)`;

  const objeto = [
    `el inmueble sito en ${e(d.direccion) || RAYA}`,
    d.unidad && e(d.unidad),
  ].filter(Boolean).join(", ");
  const conCochera = d.cochera ? ` junto con ${e(d.cochera)}` : "";
  const complejo = d.complejo ? ` ubicado en el complejo “${e(d.complejo)}”` : "";

  const c = [];

  c.push({
    id: "objeto", titulo: "Objeto",
    cuerpo: () => `
      <p>El locador da en locación al locatario, quien acepta, ${objeto}${conCochera}${complejo} de la ciudad de ${e(d.inmuebleCiudad)}, Provincia de ${e(d.provincia)}.</p>
      ${d.composicion ? `<p>El inmueble se compone, en forma principal, de ${e(d.composicion)}.</p>` : ""}
      <p>La descripción completa y detallada del inmueble se encuentra en el anexo I del presente contrato.</p>`,
  });

  c.push({
    id: "plazo", titulo: "Plazo",
    cuerpo: () => `
      <p>El presente contrato tendrá un plazo de ${cantidadEnLetras(Number(d.plazoMeses) || 0)} meses, conforme lo dispuesto por el artículo 1198 del Código Civil y Comercial de la Nación, comenzando su vigencia el día ${fechaTexto(d.fechaInicio)} y finalizando el día ${fechaTexto(d.fechaFin)}.</p>
      <p>El vencimiento del plazo operará de pleno derecho, sin necesidad de notificación, interpelación judicial o extrajudicial alguna por parte del locador.</p>
      <p>El locatario renuncia expresamente a ejercer el derecho de retención del inmueble, cualquiera fuere la causa que pudiere invocar.</p>
      <p>Cualquier prórroga, renovación o extensión del presente contrato deberá instrumentarse por escrito y contar con la firma de ambas partes, no pudiendo invocarse en ningún caso la tácita reconducción (art. 1188 del Código Civil y Comercial de la Nación).</p>`,
  });

  c.push({
    id: "precio", titulo: "Precio y forma de actualización",
    cuerpo: (ref) => `
      <p>De conformidad con lo dispuesto por el artículo 1199 del Código Civil y Comercial de la Nación, el precio de la locación se fija de común acuerdo entre las partes. El canon locativo mensual correspondiente al primer ${per.periodo} de vigencia del contrato será de ${d.canon ? montoEnLetras(d.canon, d.moneda) : RAYA}, comprendiendo el período que va desde el mes de ${mesTexto(d.fechaInicio)} hasta el mes de ${mesTexto(d.fechaInicio, Number(d.periodicidad) - 1)}, inclusive. Para el supuesto de que la entrega de la tenencia del inmueble se produjera con posterioridad al día ${fechaTexto(d.fechaInicio)}, el canon correspondiente a dicho mes se calculará en forma proporcional a los días efectivamente transcurridos desde la fecha de entrega, la que constará en el acta de entrega de llaves suscripta por las partes, hasta el último día del mes, inclusive. A tal efecto, el canon mensual pactado se dividirá por la cantidad de días del mes y se multiplicará por los días de ocupación. El importe proporcional resultante deberá abonarse al momento de la entrega de las llaves. Sin perjuicio de ello, los períodos de ajuste del canon se computarán por ${per.periodo}s calendario a partir del ${fechaTexto(d.fechaInicio)}, con independencia de la fecha efectiva de entrega.</p>
      <p>A partir del segundo ${per.periodo}, el precio del alquiler se actualizará en forma ${per.forma}, aplicando el ${indice}, tomando como base el último valor vigente al momento de cada actualización. El locador deberá informar al locatario el nuevo monto del canon locativo con una antelación mínima de cinco (5) días al vencimiento del período mensual correspondiente.</p>
      <p>En caso de que, a la fecha de vencimiento, el índice aplicable no se encontrare publicado, el locatario abonará provisoriamente el último canon vigente, debiendo integrar la diferencia que resulte una vez publicado el índice, conjuntamente con el pago del alquiler inmediato siguiente.</p>
      ${d.indiceSupletorio ? `<p>Para el supuesto de discontinuación o falta de publicación del índice pactado, las partes acuerdan como índice supletorio el ${e(d.indiceSupletorio)}, aplicándose el mismo criterio de actualización.</p>` : ""}
      <p>El mismo mecanismo de actualización resultará aplicable en caso de continuación de la locación en los términos del artículo 1218 del Código Civil y Comercial de la Nación, hasta la efectiva restitución del inmueble.</p>
      <p>El canon locativo no podrá ser reducido bajo ningún concepto y se considera monto neto a percibir por el locador, debiendo ser abonado en dinero en efectivo y de contado, salvo que éste autorice expresamente su pago mediante transferencia bancaria.</p>
      <p>Sin perjuicio de lo establecido precedentemente, y en el marco del deber de colaboración propio de los contratos de larga duración y de la buena fe contractual (artículos 9, 961 y 1011 del Código Civil y Comercial de la Nación), las partes podrán reunirse a los fines de evaluar, de mutuo y exclusivo acuerdo, eventuales ajustes al canon locativo o al mecanismo de actualización pactado, para el supuesto de que se produjeran alteraciones extraordinarias e imprevisibles de las circunstancias económicas o monetarias existentes al momento de la celebración del presente, ajenas a la voluntad de las partes, en los términos y con los alcances contemplados por el artículo 1091 del Código Civil y Comercial de la Nación. Dicha instancia de diálogo constituye una mera facultad y no genera obligación alguna de modificar lo aquí pactado, no suspende ni exime al locatario del cumplimiento de sus obligaciones en los términos y plazos establecidos en el presente, y toda eventual modificación solo tendrá validez si se instrumenta por escrito y con firma de ambas partes, conforme lo previsto en la cláusula ${ref("formaActos")}.</p>`,
  });

  c.push({
    id: "prestaciones", titulo: "Prestaciones periódicas a cargo del Locatario",
    cuerpo: (ref) => `
      <p>Además del precio de la locación establecido en la cláusula ${ref("precio").toLowerCase()}, integran el canon locativo y serán a cargo del locatario todas las cargas, contribuciones, tasas, impuestos y servicios que se generen con motivo del uso y destino del inmueble locado.</p>
      <p>En particular, el locatario deberá abonar las expensas ordinarias, el servicio de agua potable, impuestos municipales y provinciales, y todo otro concepto que derive del uso y goce del inmueble.</p>
      <p>El pago de las expensas y demás cargas podrá ser exigido por el locador en forma conjunta con el alquiler, pudiendo éste negarse a recibir pagos parciales o separados.</p>
      <p>En caso de que se lo autorice al locatario a abonar directamente los impuestos y/o servicios, deberá acreditar su pago mediante la entrega de los comprobantes correspondientes al locador o su representante. Si el locatario no acreditare el pago de las cargas y servicios a su cargo, el locador podrá imputar cualquier suma abonada por aquél, en primer término, a la cancelación de expensas, impuestos y/o servicios, y el remanente, si existiere, al pago del alquiler.</p>
      <p>Al momento de la restitución del inmueble, el locatario deberá acreditar la inexistencia de deuda por expensas mediante la correspondiente constancia emitida por la administración del consorcio.</p>`,
  });

  c.push({
    id: "pago", titulo: "Condiciones de pago",
    cuerpo: () => `
      <p>El locatario se obliga a abonar el canon locativo en el domicilio de pago fijado por el locador, el cual se establece inicialmente en ${e(d.domicilioPago) || RAYA}, ${e(d.horarioPago)} o en el que en el futuro éste notifique en forma fehaciente.</p>
      <p>El pago deberá efectuarse por adelantado, en dinero en efectivo y de contado, entre los días uno (1) y ${cantidadEnLetras(Number(d.diaLimitePago) || 9)} de cada mes, considerándose este último como plazo de gracia, aplicándose en caso de mora el interés desde el primer día del mes. La mora se producirá en forma automática por el solo vencimiento del plazo, devengándose los intereses correspondientes desde el primer día del mes.</p>
      <p>El domicilio de pago establecido precedentemente será único y no se verá modificado por el hecho de que el locador autorice expresamente el pago mediante transferencia bancaria. En tal caso, el locatario deberá efectuar la transferencia dentro del mismo plazo indicado, esto es, hasta el día ${cantidadEnLetras(Number(d.diaLimitePago) || 9)} de cada mes a las ${e(d.horaTransferencia)} horas, considerándose cancelada la obligación una vez acreditados los fondos en la cuenta indicada por el locador, debiendo remitir el comprobante respectivo. Si el último día de pago fuere inhábil, feriado o no laborable, el vencimiento operará el día hábil inmediato anterior.</p>
      <p>El locador no estará obligado a recibir pagos parciales, ni en moneda distinta a la pactada, ni en especie.</p>
      <p>El canon locativo se pacta por períodos mensuales completos, por lo que, aun cuando el locatario restituyere el inmueble antes de finalizar el mes, deberá abonar íntegramente el alquiler correspondiente, sin derecho a prorrateo, junto con las demás obligaciones dinerarias a su cargo. Se deja expresamente establecido que el locador podrá designar administradores o terceros autorizados para la percepción de los pagos y otorgamiento de los recibos correspondientes.</p>`,
  });

  c.push({
    id: "servicios", titulo: "Servicios",
    cuerpo: () => `
      <p>El Locatario se obliga, dentro del plazo de ${cantidadEnLetras(Number(d.serviciosDias) || 5)} días corridos desde la entrega de llaves, a gestionar la transferencia o alta a su nombre de los servicios de energía eléctrica ante ${e(d.empresaLuz)} y de gas natural ante ${e(d.empresaGas)}, salvo que los mismos ya se encontraren registrados a su nombre.</p>
      <p>En caso de ser requerido por la empresa prestadora del servicio eléctrico, será a exclusivo cargo del locatario la gestión y costo de obtención del “Certificado de Instalación Eléctrica Apta”, el cual deberá ser emitido por profesional matriculado habilitado conforme la normativa vigente (Ley 10.281). Asimismo, serán a cargo del locatario todas las gestiones y gastos necesarios para la contratación y mantenimiento de los servicios de electricidad, gas, internet, televisión por cable y cualquier otro servicio que utilice en el inmueble.</p>
      <p>El locatario no estará obligado a abonar consumos o deudas correspondientes a períodos anteriores al inicio de la presente locación. Al finalizar el contrato, el locatario deberá gestionar la baja o transferencia de titularidad de los servicios dentro del mismo plazo, debiendo acreditar tal circunstancia ante el locador, así como el pago íntegro de los consumos hasta la fecha de restitución del inmueble.</p>
      <p>En caso de que el locador solicite mantener provisoriamente la titularidad de los servicios a nombre del locatario hasta una nueva ocupación, los consumos que se generen a partir de la efectiva restitución del inmueble estarán a cargo exclusivo del locador.</p>
      <p>El locatario deberá entregar al locador las constancias de alta, cambio de titularidad o baja de los servicios según corresponda. El incumplimiento de las obligaciones asumidas en la presente cláusula facultará al locador a reclamar los daños y perjuicios que correspondan.</p>`,
  });

  c.push({
    id: "seguro", titulo: "Seguro contra incendio y responsabilidad civil",
    cuerpo: () => `
      <p>El locatario se obliga a contratar y mantener vigente durante todo el plazo de la locación un seguro que cubra, como mínimo, los riesgos de incendio del inmueble, de daños a la propiedad y responsabilidad civil frente a terceros.</p>
      <p>La póliza deberá designar como asegurado y/o beneficiario al locador, según corresponda, y el capital asegurado deberá fijarse conforme al valor de reposición del inmueble, de acuerdo con la cotización y condiciones que establezca la compañía aseguradora al momento de la contratación.</p>
      <p>El locatario deberá acreditar la contratación del seguro dentro del plazo de ${cantidadEnLetras(Number(d.seguroDias) || 10)} días desde la entrega de llaves, mediante la entrega de copia de la póliza y comprobante de pago, obligándose asimismo a mantenerla vigente durante toda la relación locativa y a presentar las renovaciones correspondientes.</p>
      <p>El incumplimiento de la presente obligación hará plenamente responsable al locatario y a sus garantes por todos los daños y perjuicios que pudieran producirse en el inmueble o a terceros con motivo de siniestros, liberando al locador de toda responsabilidad en la medida de lo legalmente admisible. La contratación del seguro no exime al locatario de las responsabilidades asumidas en el presente contrato.</p>`,
  });

  c.push({
    id: "mora", titulo: "Mora",
    cuerpo: () => `
      <p>La mora en el cumplimiento de las obligaciones asumidas por el locatario se producirá en forma automática por el solo vencimiento de los plazos pactados, sin necesidad de interpelación judicial o extrajudicial alguna.</p>
      <p>En caso de falta de pago en término de cualquiera de las obligaciones dinerarias derivadas del presente contrato, el locatario deberá abonar, en concepto de interés punitorio, una tasa equivalente al ${pctLetras(Number(d.interesDiario) || 1)} diario sobre el capital adeudado que se computará desde el primer día del periodo mensual y por todo el lapso que dure la mora.</p>
      <p>Los intereses se calcularán sobre el capital adeudado, sin perjuicio de lo dispuesto por el artículo 770 del Código Civil y Comercial de la Nación en materia de capitalización. El pago de los intereses no extingue la obligación principal, ni implica renuncia a otros derechos que pudieran corresponder al locador. El locador podrá negarse a recibir pagos parciales o pagos que no incluyan los intereses devengados, y en caso de recibir sumas a cuenta, las mismas serán imputadas en primer término a intereses y luego a capital.</p>
      <p>La percepción de sumas de dinero por parte del locador o de sus representantes no implicará renuncia a reclamar diferencias, intereses, penalidades o períodos adeudados, aun cuando se hubiere extendido recibo sin reserva expresa.</p>`,
  });

  c.push({
    id: "conservacion", titulo: "Estado del inmueble y conservación",
    cuerpo: () => `
      <p>El locatario declara recibir el inmueble objeto del presente contrato en buen estado de uso y conservación, en condiciones aptas para el destino convenido, lo que reconoce en virtud de haberlo verificado previamente.</p>
      <p>Se deja constancia de que el inmueble presenta el estado propio del uso ordinario, y el locatario se obliga a conservar el inmueble en muy buen estado, debiendo restituirlo al finalizar la locación en las mismas condiciones en que lo recibió, salvo el desgaste natural producido por el correcto uso y el transcurso del tiempo. Serán a cargo del locatario las reparaciones de mero mantenimiento, conforme lo dispuesto por el artículo 1207 del Código Civil y Comercial de la Nación, entendiéndose por tales aquellas derivadas del uso ordinario del inmueble, incluyendo, entre otras, a modo de ejemplo: a) mantenimiento de desagües: limpieza periódica de espacios que tengan desagües a los fines de que no se acumule basura que obstruya el drenaje del agua; b) mantenimiento de instalación eléctrica: reemplazos de tomacorrientes y teclas de punto por cortocircuitos por culpa exclusiva del locatario; c) mantenimiento de griferías: cambio de cueritos en canillas, de o-rings y de flotantes, de flexibles en caso de corresponder; d) mantenimiento de aberturas en general: cierre correcto, limpieza y lubricación de guías, rodamientos, herrajes, etc.; e) mantenimiento de pisos: evitar rayaduras y perforaciones en los pisos del inmueble, debiendo darles un muy buen mantenimiento.</p>
      <p>El locatario responde por los deterioros causados al inmueble, aun cuando provengan de hechos de terceros o visitantes, conforme lo previsto por el artículo 1206 del Código Civil y Comercial de la Nación, quedando excluidos aquellos daños derivados de caso fortuito o fuerza mayor, así como los ocasionados por el locador o sus dependientes.</p>
      <p>En caso de que el locatario no cumpla con las obligaciones de mantenimiento a su cargo, y ello pudiera ocasionar daños al inmueble o a terceros, el locador podrá, previa intimación fehaciente por un plazo de cuarenta y ocho (48) horas, realizar las reparaciones necesarias por cuenta y cargo del locatario, debiendo éste reintegrar los importes correspondientes junto con el alquiler inmediato siguiente.</p>
      <p>El incumplimiento grave o reiterado de las obligaciones de conservación y mantenimiento facultará al locador a resolver el contrato en los términos de la normativa vigente.</p>`,
  });

  c.push({
    id: "estado", titulo: "Descripción del estado particular del inmueble y elementos",
    cuerpo: () => `
      <p>Se deja constancia que, al momento de la celebración del presente contrato, el inmueble presenta las siguientes condiciones particulares, que el locatario declara conocer y aceptar: ${e(d.estadoParticular)}</p>
      <p><strong>Verificación del inmueble:</strong> El locatario dispondrá de un plazo de ${cantidadEnLetras(Number(d.verificacionDias) || 30)} días corridos, contados desde la entrega de llaves, para notificar por escrito al locador cualquier defecto, vicio o irregularidad del inmueble que no hubiera sido consignado en el presente contrato, a fin de deslindar su responsabilidad respecto de los mismos.</p>
      <p>Transcurrido dicho plazo sin que el locatario formule observaciones, se presumirá, salvo prueba en contrario, que el inmueble fue recibido en buen estado de uso y conservación, conforme al destino convenido. En consecuencia, los deterioros o desperfectos que se verifiquen con posterioridad se presumirán a cargo del locatario, excepto aquellos que correspondan al desgaste normal por el uso regular, el paso del tiempo, vicios ocultos o causas no imputables al mismo.</p>`,
  });

  c.push({
    id: "obligLocatario", titulo: "Obligaciones del locatario",
    cuerpo: () => `
      <p>El locatario se obliga a: a) Destinar el inmueble exclusivamente al uso convenido, no pudiendo modificarlo sin autorización expresa del locador (art. 1205 CCyC). b) No abandonar el inmueble ni ceder su tenencia sin autorización. c) Cumplir y hacer cumplir las normas legales, municipales y reglamentarias vigentes, así como el reglamento de copropiedad y administración del consorcio, asumiendo la responsabilidad por las infracciones que él, sus convivientes o terceros vinculados pudieran cometer. Es su obligación pedir al Administrador del Edificio una copia de dichos instrumentos. d) Mantener una conducta adecuada a las normas de convivencia, absteniéndose de realizar actos que perturben la tranquilidad, seguridad o salubridad del inmueble o del entorno. e) No realizar modificaciones, mejoras o alteraciones sin autorización previa y por escrito del locador. Las mejoras introducidas sin autorización podrán ser removidas o conservadas por el locador, a elección de este último, sin derecho a compensación alguna. f) Permitir el acceso al locador o a quien éste designe, previa notificación razonable, a fin de inspeccionar el inmueble o mostrarlo a terceros interesados. Asimismo, deberá comunicar de inmediato cualquier hecho que afecte o pueda afectar la integridad del inmueble. g) Conservar en buen estado las instalaciones de gas, obligándose a su correcto uso y mantenimiento. Queda prohibida la instalación de artefactos adicionales sin autorización del locador. El locatario será responsable por los daños derivados del uso indebido o falta de mantenimiento. h) No permitir la interrupción de los servicios esenciales por causas imputables a su conducta. i) Informar al locador, dentro de un plazo razonable, la recepción de correspondencia dirigida a éste en el domicilio locado. j) No introducir ni almacenar sustancias peligrosas o riesgosas para las personas, los bienes o el medio ambiente.${d.prohibeAnimales ? " k) No tener animales dentro del inmueble, siendo responsable ante el Consorcio de Copropietarios y ante el Locador por los daños que pudieran ocasionar en la propiedad. Esta obligación es considerada esencial y una de las causas por las cuales el locador cede en locación su inmueble. Su incumplimiento es causa de desalojo." : ""}</p>
      <p>El incumplimiento grave o reiterado de estas obligaciones podrá constituir causal de resolución del contrato conforme a la normativa vigente.</p>`,
  });

  c.push({
    id: "obligLocador", titulo: "Obligaciones del locador",
    cuerpo: () => `
      <p>El locador se obliga a: a) Garantizar al locatario el uso y goce pacífico del inmueble durante la vigencia del contrato. b) No perturbar dicho uso, absteniéndose de ingresar al inmueble sin previo aviso, salvo casos de urgencia. c) Conservar el inmueble en estado de servir al uso convenido, realizando a su cargo las reparaciones necesarias no imputables al locatario (art. 1201 CCyC). d) En caso de reparaciones urgentes (por ej. rotura de caños que causen filtraciones e inundaciones, pérdida de gas o desperfectos en instalaciones que impliquen riesgo de exposición o salud, cortocircuitos eléctricos que causen peligro de incendio, etc.) que impliquen riesgo para las personas o el inmueble, y ante la falta de respuesta del locador dentro de un plazo razonable desde su notificación, el locatario podrá realizarlas por sí, con cargo al locador. e) En caso de reparaciones no urgentes el locatario deberá intimar previamente al locador otorgando un plazo razonable para su ejecución, pudiendo proceder de igual forma ante su incumplimiento.</p>`,
  });

  c.push({
    id: "gas", titulo: "Artefactos a gas y seguridad",
    cuerpo: () => `
      <p>El locatario se obliga, a su exclusivo cargo y costo, a realizar el control, uso adecuado y mantenimiento periódico de los artefactos a gas instalados en el inmueble (calefactores, termotanque, cocina, calefón u otros similares), velando por su correcto funcionamiento y condiciones de seguridad.</p>
      <p>Queda expresamente prohibido al locatario introducir, instalar o conectar artefactos adicionales a gas sin autorización previa y por escrito del locador, siendo responsable por los daños que pudieran derivarse de su incumplimiento.</p>
      <p>Asimismo, el locatario deberá: A) ASEGURAR LA ADECUADA VENTILACIÓN DE LOS AMBIENTES AL UTILIZAR DICHOS ARTEFACTOS, QUEDANDO EXPRESAMENTE PROHIBIDO UTILIZAR LA COCINA, HORNO U HORNALLAS COMO MEDIO DE CALEFACCIÓN. B) CONTROLAR PERIÓDICAMENTE QUE LOS CONDUCTOS DE EVACUACIÓN DE GASES NO SE ENCUENTREN OBSTRUIDOS, DEBIENDO ADOPTAR LAS MEDIDAS NECESARIAS PARA SU CORRECTO FUNCIONAMIENTO. C) PROCURAR LA INSTALACIÓN DE UN DETECTOR DE MONÓXIDO DE CARBONO EN EL INMUEBLE, EL CUAL PODRÁ RETIRAR AL FINALIZAR LA LOCACIÓN, SIN QUE ELLO GENERE OBLIGACIÓN ALGUNA DE PERMANENCIA EN LA UNIDAD.</p>
      <p>El locatario será responsable por todo daño o perjuicio que se derive del uso indebido, falta de mantenimiento o manipulación inadecuada de los artefactos a gas.</p>
      <p>Se deja constancia que como Anexo II del presente contrato se acompaña una cartilla informativa con recomendaciones de seguridad en el uso de artefactos a gas y prevención de intoxicaciones por monóxido de carbono, la cual el locatario declara haber recibido, leído y comprendido, asumiendo el compromiso de cumplir con las pautas allí indicadas.</p>`,
  });

  c.push({
    id: "interrupciones", titulo: "Limitación de responsabilidad por interrupciones y perturbaciones",
    cuerpo: () => `
      <p>El locatario reconoce que no constituirán causal de resolución del contrato, ni de suspensión o reducción del canon locativo, las interrupciones o deficiencias transitorias en la prestación de servicios tales como agua, energía eléctrica o gas, cuando las mismas sean ajenas al locador y obedezcan a causas imputables a las empresas prestatarias, tareas de mantenimiento, reparaciones, falta de presión u otras circunstancias similares.</p>
      <p>Del mismo modo, el locatario acepta que no podrá invocar la resolución del contrato ni la suspensión del pago del alquiler frente a perturbaciones temporarias derivadas de reparaciones urgentes o necesarias en el inmueble, siempre que las mismas no impidan de manera sustancial el uso y goce del mismo.</p>
      <p>En los inmuebles sometidos al régimen de propiedad horizontal, tampoco constituirán causal de resolución ni de reducción del precio las interrupciones transitorias de servicios comunes, tales como ascensores, vigilancia u otros, cuando sean consecuencia de reparaciones, mantenimiento o disposiciones del consorcio.</p>
      <p>Asimismo, los desperfectos menores o aquellos que no afecten de manera sustancial la habitabilidad o el uso del inmueble no habilitarán al locatario a rescindir el contrato ni a suspender el cumplimiento de sus obligaciones. Sin perjuicio de lo anterior, cuando las circunstancias indicadas afecten de manera significativa el uso y goce del inmueble conforme a su destino, se aplicará lo dispuesto por la normativa vigente.</p>`,
  });

  c.push({
    id: "destino", titulo: "Destino",
    cuerpo: () => `
      <p>El inmueble locado se destina exclusivamente a ${e(d.destino)}, quedando expresamente prohibido al locatario modificar dicho destino, aun cuando ello no cause perjuicio al locador.</p>
      <p>En consecuencia, el locatario no podrá destinar el inmueble, total o parcialmente, a actividades comerciales, profesionales, industriales, temporarias, turísticas o de cualquier otra índole distinta a la pactada, ni ceder, sublocar o permitir su uso por terceros con fines distintos al aquí pactado, sin autorización previa y por escrito del locador.</p>
      <p>El incumplimiento de la presente cláusula será considerado falta grave y facultará al locador a resolver el contrato en forma inmediata, sin perjuicio de reclamar los daños y perjuicios que pudieran corresponder conforme a la normativa vigente.</p>`,
  });

  c.push({
    id: "intransferible", titulo: "Intransferibilidad, prohibición de ceder y sublocar",
    cuerpo: () => `
      <p>El presente contrato es personal e intransferible, quedando expresamente prohibido al locatario cederlo total o parcialmente, así como sublocar el inmueble, en todo o en parte, sin autorización previa y por escrito del locador.</p>
      <p>Asimismo, el locatario no podrá otorgar el uso o tenencia del inmueble a terceros, ya sea a título oneroso o gratuito, ni permitir su ocupación por personas ajenas al grupo conviviente declarado, sin la correspondiente autorización del locador.</p>
      <p>El incumplimiento de la presente cláusula será considerado falta grave y facultará al locador a resolver el contrato en los términos de la normativa vigente, sin perjuicio de las acciones que pudieran corresponder.</p>`,
  });

  c.push({
    id: "resolucion", titulo: "Resolución del contrato",
    cuerpo: () => `
      <p>El presente contrato podrá resolverse conforme a las siguientes disposiciones:</p>
      <p><strong>El locador podrá resolver el contrato en los siguientes casos:</strong> a) Falta de pago: ante la falta de pago de dos (2) períodos consecutivos de alquiler, previa intimación fehaciente al locatario para que abone lo adeudado dentro del plazo de diez (10) días corridos desde su recepción, con indicación del lugar de pago. La notificación remitida al domicilio denunciado en el contrato por el locatario se tiene por válida, aun si éste se negara a recibirla o no pudiese perfeccionarse por motivos imputables al mismo, de acuerdo al artículo 1222 del Código Civil y Comercial de la Nación. b) Cambio de destino o uso indebido: cuando el locatario modifique el destino del inmueble o incurra en uso irregular, aun cuando ello no cause perjuicio al locador. c) Falta de conservación o abandono: cuando el locatario no conserve el inmueble conforme a lo pactado o lo abandone. d) Incumplimientos contractuales graves: en caso de incumplimiento de obligaciones esenciales del contrato, incluyendo, entre otras: 1) tenencia de animales cuando se encuentre prohibido; 2) incumplimiento de normas de convivencia, reglamento de copropiedad o disposiciones municipales; 3) realización de actos que perturben la tranquilidad, seguridad o salubridad del inmueble o del entorno. e) Incumplimiento de los garantes: cuando los garantes incumplan las obligaciones asumidas en el presente contrato.</p>
      <p><strong>El locatario podrá resolver anticipadamente el contrato, debiendo:</strong> 1) Notificar su decisión al locador en forma fehaciente con una antelación mínima de un (1) mes. 2) Abonar en concepto de indemnización la suma equivalente al ${pctLetras(Number(d.rescisionPct) || 10)} del saldo de canon locativo futuro, el que se calculará desde la fecha de notificación de la rescisión hasta la fecha de finalización del contrato, y encontrarse al día con todas las obligaciones emergentes del contrato al momento de la restitución del inmueble. 3) Restituir el inmueble en las condiciones pactadas, conforme al estado de conservación exigido en el presente contrato.</p>`,
  });

  c.push({
    id: "ejecutiva", titulo: "Cobro por vía ejecutiva",
    cuerpo: () => `
      <p>Las partes acuerdan que las obligaciones de pago a cargo del locatario emergentes del presente contrato, incluyendo todo el canon locativo como alquiler, expensas, servicios, impuestos, intereses y cualquier otro concepto dinerario derivado del mismo, serán exigibles por la vía ejecutiva, en los términos del artículo 1208 del Código Civil y Comercial de la Nación.</p>
      <p>A tales efectos, el presente contrato, junto con los recibos, liquidaciones o constancias emitidas por el locador o su administrador, constituirán título suficiente para promover la acción correspondiente.</p>`,
  });

  c.push({
    id: "restitucion", titulo: "Restitución del inmueble",
    cuerpo: () => `
      <p>El locatario se obliga a restituir el inmueble al vencimiento del plazo contractual, libre de ocupantes, bienes y efectos personales, en el estado de uso y conservación pactado, en adecuadas condiciones de higiene, funcionamiento y mantenimiento, conforme a lo establecido en el presente contrato, salvo el desgaste normal producido por el uso regular y el transcurso del tiempo.</p>
      <p>A tal efecto, el locatario deberá notificar al locador en forma fehaciente, con una antelación mínima de treinta (30) días corridos, la fecha en que procederá a la desocupación del inmueble. Durante ese plazo el locatario deberá permitir el acceso al inmueble, en días y horarios razonables previamente coordinados, al locador o a quien éste designe, a efectos de su inspección o muestra a terceros interesados en alquilar la propiedad. A los fines de la inspección el Locador deberá disponer de las tareas de pintado y adecuación que incluyen el servicio de mantenimiento e inspección de todos los artefactos eléctricos, a gas y sanitarios existentes en el inmueble (griferías, bachas, desagües, piletas, etc.), debiendo incluirse el control del correcto funcionamiento de los artefactos a gas, con la constancia correspondiente emitida por gasista matriculado, las cuales serán realizadas por cuenta del Locador pero con cargo al Locatario.</p>
      <p>En caso de verificarse deterioros que excedan el uso normal o incumplimientos en las obligaciones de mantenimiento a su cargo, el locador podrá realizar las reparaciones necesarias, debiendo el locatario abonar los costos correspondientes. La restitución se formalizará mediante la suscripción del acta de entrega de llaves, la cual acreditará la efectiva devolución del inmueble y el estado en que se recibe.</p>
      <p>En caso de que el locatario no restituya el inmueble al vencimiento del contrato, deberá abonar por cada día de ocupación indebida una suma equivalente al ${pctLetras(Number(d.ocupacionPct) || 10)} del valor locativo vigente al momento del incumplimiento, desde el vencimiento del plazo hasta la efectiva restitución, sin perjuicio del derecho del locador de iniciar las acciones legales correspondientes para obtener la restitución del inmueble. Dicha suma tendrá carácter de cláusula penal, sin que su pago implique la extinción de la obligación de restituir.</p>`,
  });

  c.push({
    id: "llaves", titulo: "Entrega y devolución de llaves",
    cuerpo: () => `
      <p>El locatario podrá, bajo su exclusiva responsabilidad, proceder al cambio de las cerraduras y/o combinaciones de la puerta de acceso principal y de aquellas otras que considere necesarias para su seguridad, debiendo restituirlas al estado original o entregar la totalidad de las nuevas llaves al momento de la finalización del contrato.</p>
      <p>El locador no será responsable por pérdidas, daños o hechos ilícitos que pudieran afectar al locatario, sus convivientes o sus bienes, salvo que los mismos le resulten imputables conforme a la normativa vigente.</p>
      <p>Al finalizar la locación, la restitución del inmueble y la entrega de llaves podrá ser realizada por el locatario, sus garantes o persona debidamente autorizada por escrito. La devolución de las llaves y la restitución de la tenencia se considerarán perfeccionadas únicamente mediante la suscripción del acta de entrega correspondiente por parte del locador o su representante, no admitiéndose otro medio de prueba.</p>`,
  });

  c.push({
    id: "sellos", titulo: "Impuesto de sellos, certificaciones y honorarios",
    cuerpo: (ref) => `
      <p>Las partes acuerdan que el Impuesto de Sellos correspondiente al presente contrato, en caso de resultar aplicable y no encontrarse exento, y los gastos de certificación notarial de firmas, estarán a cargo del locatario y sus garantes.</p>
      <p>Asimismo, serán a cargo exclusivo del locatario y sus garantes los honorarios profesionales derivados de la intervención en la presente operación, así como los gastos correspondientes a informes patrimoniales requeridos.</p>
      ${Number(d.honorarios) || Number(d.informes) ? `<p>A tales efectos, se deja constancia que los honorarios profesionales ascienden a la suma de ${montoEnLetras(d.honorarios || 0)}${Number(d.informes) ? `, y los gastos por informes patrimoniales a la suma de ${montoEnLetras(d.informes)}` : ""}, las que se adeudarán desde el ${fechaEnLetras(d.honorariosDesde)}.</p>` : ""}
      ${d.domicilioProfesional ? `<p>Las sumas indicadas deberán ser abonadas en el domicilio del profesional interviniente, sito en ${e(d.domicilioProfesional)}, en días hábiles y en horario de oficina.</p>` : ""}
      <p>La mora en el cumplimiento de las obligaciones establecidas en la presente cláusula se producirá de pleno derecho, resultando de aplicación lo dispuesto en la cláusula ${ref("mora")} del presente contrato.</p>`,
  });

  if (garantes.length) {
    const info = garantes.filter((g) => g.info.trim()).map((g) => `${nombreCorto(g)} ${e(g.info.trim())}`);
    c.push({
      id: "garantia", titulo: "Garantía",
      cuerpo: () => `
        <p>${lista(garantes.map((g) => persona(g, { contacto: true })))}, ${d.domicilioGarantes ? `quienes fijan domicilio a todos los efectos en ${e(d.domicilioGarantes)}, ` : ""}se constituye${garantes.length > 1 ? "n" : ""} en fiador${garantes.length > 1 ? "es" : ""} solidario${garantes.length > 1 ? "s" : ""}, liso${garantes.length > 1 ? "s" : ""}, llano${garantes.length > 1 ? "s" : ""} y principal${garantes.length > 1 ? "es" : ""} pagador${garantes.length > 1 ? "es" : ""} de todas las obligaciones asumidas por el locatario, incluyendo el canon locativo, sus accesorios, intereses, cláusulas penales, daños y perjuicios, gastos y costas judiciales.</p>
        <p>En tal carácter, los garantes renuncian expresamente a los beneficios de excusión y división, en los términos de los artículos 1583 y 1589 del Código Civil y Comercial de la Nación, obligándose como deudores directos frente al locador.</p>
        <p>La garantía asumida se extiende durante toda la vigencia del contrato y hasta la efectiva restitución del inmueble al locador, libre de ocupantes y en las condiciones pactadas, conforme lo dispuesto por el artículo 1225 del Código Civil y Comercial de la Nación.</p>
        <p>Los garantes declaran conocer el estado del inmueble, el destino de la locación y las obligaciones asumidas por el locatario, aceptando íntegramente las condiciones del presente contrato.</p>
        <p>Los mencionados garantes asumen una posición activa en cuanto al control de la evolución del negocio y el locatario los faculta para intervenir, consultar, inspeccionar la vivienda, realizar acuerdos con el locador, es decir todo lo que sea pertinente a los fines de controlar el alcance patrimonial de la obligación que están asumiendo, como así también hacer entrega de llaves y tenencia en representación del locatario al locador.</p>
        ${info.length ? `<p>A título meramente informativo, los garantes manifiestan que: ${lista(info)}. Dicha información no limita ni condiciona el alcance de la garantía asumida, la cual se extiende a la totalidad del patrimonio presente y futuro de los garantes.</p>` : ""}
        <p>Asimismo, se obligan a mantener durante toda la vigencia del contrato la solvencia patrimonial y/o laboral tenida en cuenta al momento de su aceptación como garantes, debiendo informar fehacientemente al locador, dentro del plazo de diez (10) días, cualquier circunstancia que implique una disminución sustancial de su capacidad económica.</p>
        <p>En caso de verificarse una afectación relevante de la solvencia de uno o más garantes, el locatario deberá sustituir o reforzar la garantía dentro del plazo de treinta (30) días de notificado, mediante la presentación de nuevas garantías a satisfacción del locador. El incumplimiento de esta obligación facultará al locador a exigir su cumplimiento o a resolver el contrato conforme a la normativa vigente, sin perjuicio de los demás derechos que le correspondan.</p>`,
    });
  }

  c.push({
    id: "formaActos", titulo: "Forma de los actos",
    cuerpo: () => `
      <p>Las partes acuerdan en forma definitiva e irrevocable y como condición indispensable de esta locación, que todos los actos entre ellas únicamente se perfeccionarán por escrito y ninguno en forma oral o verbal, de palabra o de hecho, vedando en especial cualesquiera prórroga y/o nuevos contratos sobre esta unidad locada, fuera de los escritos y firmados por las partes obligadas. Si el locatario pretendiese quedarse en la unidad locada invocando locación verbal, de hecho o de palabra, las cuales están prohibidas por esta cláusula y por el art. 1188 del CCyC, pagará como cláusula penal la cantidad de pesos equivalente al ${pctLetras(Number(d.ocupacionPct) || 10)} del valor del alquiler por día de atraso, en efectivo, además de las otras obligaciones asumidas en el presente contrato.</p>`,
  });

  c.push({
    id: "notificaciones", titulo: "Forma de las notificaciones",
    cuerpo: () => `
      <p>Las partes acuerdan que toda comunicación, notificación, modificación o acto jurídico vinculado al presente contrato deberá realizarse en forma fehaciente y por escrito, no reconociéndose validez a acuerdos verbales o de hecho.</p>
      <p>En consecuencia, cualquier prórroga, renovación o modificación del presente contrato deberá instrumentarse por escrito y contar con la firma de ambas partes, no pudiendo invocarse en ningún caso la existencia de acuerdos verbales, tácitos o de hecho, conforme lo dispuesto por el artículo 1188 del Código Civil y Comercial de la Nación.</p>
      <p>La permanencia del locatario en el inmueble con posterioridad al vencimiento del contrato, sin acuerdo escrito, no implicará prórroga ni renovación del mismo, configurando una ocupación indebida.</p>`,
  });

  if (d.corredor || d.administrador) {
    const quienes = [
      d.corredor && `el corredor público inmobiliario interviniente, ${e(d.corredor)}${d.corredorMatricula ? ` (${e(d.corredorMatricula)})` : ""}`,
      d.administrador && "el administrador del inmueble",
    ].filter(Boolean).join(", y ");
    c.push({
      id: "corredor", titulo: "Intervención del corredor y administrador. Alcance de responsabilidad",
      cuerpo: () => `
        <p>Las partes dejan constancia que ${quienes} actúan exclusivamente como intermediarios en la celebración y ejecución del presente contrato.</p>
        <p>En tal carácter, su intervención se limita a la gestión de vinculación entre las partes, coordinación contractual y, en su caso, administración de cobros y pagos, sin asumir obligaciones propias del locador ni del locatario.</p>
        <p>En consecuencia, no serán responsables por los desperfectos, daños o vicios que pudieran presentarse en el inmueble, sus instalaciones o servicios (agua, electricidad, gas, cloacas u otros), ni por hechos derivados del uso, mantenimiento, conservación o reparación del mismo, los cuales serán responsabilidad de las partes conforme lo establecido en el presente contrato y la normativa vigente.</p>`,
    });
  }

  c.push({
    id: "venta", titulo: "Venta del inmueble",
    cuerpo: () => `
      <p>El locador se reserva el derecho de enajenar el inmueble durante la vigencia del presente contrato, conforme lo dispuesto por el artículo 1189 del Código Civil y Comercial de la Nación. En tal caso, el locatario se obliga a permitir la visita del inmueble a potenciales interesados, en días y horarios razonables previamente coordinados.</p>
      <p>La eventual venta del inmueble no afectará la continuidad de la locación, la cual subsistirá en todos sus términos frente al adquirente, quien asumirá la posición de locador, conforme a la normativa vigente.</p>
      <p>No obstante, para el supuesto de que el adquirente y el locatario acuerden la finalización anticipada de la locación, las partes podrán establecer de común acuerdo un plazo razonable para la restitución del inmueble, el cual no podrá ser inferior a noventa (90) días desde la notificación fehaciente. Se deja constancia que cualquier acuerdo de desocupación anticipada deberá instrumentarse por escrito.</p>`,
  });

  c.push({
    id: "jurisdiccion", titulo: "Jurisdicción",
    cuerpo: () => `
      <p>Para todos los efectos derivados del presente contrato, las partes${garantes.length ? " y los garantes" : ""} constituyen domicilio en los indicados en el presente y se someten a la jurisdicción de los tribunales ordinarios de la ciudad de ${e(d.ciudad)}, Provincia de ${e(d.provincia)}, con renuncia a cualquier otro fuero o jurisdicción que pudiera corresponderles.</p>`,
  });

  c.push({
    id: "domicilios", titulo: "Domicilios especiales",
    cuerpo: (ref) => `
      <p>A todos los efectos derivados del presente contrato, las partes constituyen domicilios especiales, donde se tendrán por válidas todas las notificaciones judiciales y extrajudiciales que se practiquen, mientras no se comunique fehacientemente la constitución de un nuevo domicilio, el cual deberá encontrarse dentro de la ciudad de ${e(d.ciudad)}.</p>
      <p>A tal fin, el locador constituye domicilio en ${e(d.domicilioLocador) || RAYA}, el locatario en el inmueble de la locación${garantes.length ? ` y los principales pagadores en el denunciado en la cláusula ${ref("garantia").toLowerCase()}` : ""}.</p>
      ${garantes.length ? "<p>En caso de que el locatario desocupe o abandone el inmueble, por cualquier causa, sin constituir nuevo domicilio, se tendrán por válidas todas las notificaciones que se cursen en el domicilio de los garantes, hasta tanto aquél comunique fehacientemente uno nuevo.</p>" : ""}
      ${d.administrador ? `<p>Asimismo, el locador designa como administrador del inmueble a ${e(d.administrador)}, quien se encuentra autorizado a recibir pagos, emitir recibos y realizar todas las gestiones administrativas vinculadas a la ejecución del presente contrato.</p>` : ""}`,
  });

  return c;
}

const ESTILOS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#ece7e4; font-family: Arial, Helvetica, sans-serif; color:#111; }
  #documento { background:white; width: 190mm; margin: 1.5rem auto; padding: 14mm 16mm; font-size: 10.5pt; line-height: 1.45; }
  .encabezado { display:flex; justify-content:space-between; align-items:flex-end; border-bottom: 1.5px solid #6c2d20; padding-bottom: 4px; margin-bottom: 18px; font-size: 9pt; color:#6c2d20; }
  .encabezado strong { font-size: 10.5pt; }
  h1 { text-align:center; font-size: 13pt; letter-spacing: .5px; margin: 6px 0 14px; text-decoration: underline; }
  h2 { font-size: 10.5pt; margin: 12px 0 4px; }
  p { text-align: justify; margin: 0 0 6px; page-break-inside: avoid; }
  .clausula { overflow: hidden; }
  .guiones { display:inline-block; width:0; white-space:nowrap; letter-spacing: 0; }
  .bloque { page-break-inside: avoid; }
  .salto { page-break-before: always; }
  .firmas { display:grid; grid-template-columns: 1fr 1fr; gap: 34px 40px; margin-top: 40px; page-break-inside: avoid; }
  .firma { text-align:center; font-size: 9pt; padding-top: 46px; border-bottom: none; }
  .firma .linea { border-top: 1px solid #333; padding-top: 4px; }
  .barra { position: sticky; top:0; z-index: 5; display:flex; gap:.5rem; justify-content:center; padding:.75rem; background:#fff; border-bottom:1px solid #ddd; }
  .barra button { border-radius:8px; padding:.55rem 1.3rem; font-size:13px; font-weight:700; cursor:pointer; font-family: Arial, sans-serif; }
  @media print {
    body { background:white; }
    .barra { display:none; }
    #documento { margin:0; width:auto; padding:0; }
    @page { size: A4; margin: 18mm 16mm; }
  }
`;

const GUIONES = `<span class="guiones">${"-".repeat(260)}</span>`;

function anexoGas() {
  const items = [
    "Mantener siempre ventilados los ambientes donde funcionen artefactos a gas. Las rejillas de ventilación no deben taparse ni obstruirse nunca.",
    "La llama de los artefactos debe ser de color azul. Una llama amarilla o anaranjada indica una mala combustión y la posible presencia de monóxido de carbono: en ese caso, apagar el artefacto y consultar a un gasista matriculado.",
    "No utilizar la cocina, el horno ni las hornallas para calefaccionar ambientes.",
    "No dormir con estufas o braseros encendidos en ambientes cerrados.",
    "Hacer revisar los artefactos a gas, sus conductos y conexiones al menos una vez al año por un gasista matriculado, preferentemente antes del invierno.",
    "Verificar que los conductos de evacuación de gases (chimeneas, tirajes) se encuentren libres y en buen estado.",
    "Se recomienda instalar un detector de monóxido de carbono en el inmueble.",
    "Síntomas de intoxicación por monóxido de carbono: dolor de cabeza, mareos, náuseas, vómitos, cansancio, somnolencia y desmayo. Ante estos síntomas, abrir puertas y ventanas, apagar los artefactos, salir al aire libre y llamar de inmediato al servicio de emergencias.",
    "Ante olor a gas: no encender ni apagar luces ni artefactos eléctricos, no usar fósforos ni encendedores, cerrar la llave de paso, ventilar el ambiente y comunicarse con la empresa distribuidora de gas.",
  ];
  return `
    <div class="salto"></div>
    <h1>Anexo II</h1>
    <h2 style="text-align:center;">Cartilla de seguridad en el uso de artefactos a gas y prevención de intoxicaciones por monóxido de carbono</h2>
    ${items.map((t, i) => `<p>${i + 1}. ${t}</p>`).join("")}
    <p style="margin-top:14px;">El locatario declara haber recibido, leído y comprendido la presente cartilla.</p>`;
}

export function htmlContratoLocacion(d) {
  const locadores = personasValidas(d.locadores);
  const locatarios = personasValidas(d.locatarios);
  const garantes = personasValidas(d.garantes);
  const firma = partesFecha(d.fechaFirma);

  const clausulas = armarClausulas(d);
  const numeros = Object.fromEntries(clausulas.map((c, i) => [c.id, ordinal(i + 1)]));
  const ref = (id) => numeros[id] || "";

  const nLoc = locadores.length;
  const nLat = locatarios.length;
  const partes = `
    <h2>Lugar, Fecha y Partes:</h2>
    <div class="clausula"><p>En la ciudad de ${e(d.ciudad)}, a los ${firma ? `${cantidadEnLetras(firma.d)} días del mes de ${MESES[firma.m - 1]} del ${firma.a}` : `${RAYA} días del mes de ${RAYA}`}, entre ${lista(locadores.map((p) => persona(p))) || RAYA}, ${grupo(nLoc, d.nacLocadores)} el Locador, por una parte y por la otra ${lista(locatarios.map((p) => persona(p, { contacto: true }))) || RAYA}, ${grupo(nLat, d.nacLocatarios)} el Locatario, se ha convenido en celebrar el presente contrato de locación que se regirá por las siguientes cláusulas en particular, teniendo en cuenta lo establecido por el Código Civil y Comercial de la Nación y legislación complementaria en la materia que no se haya tenido en cuenta en el presente y sea de aplicación: ${GUIONES}</p></div>`;

  const cuerpo = clausulas.map((c) => {
    const html = c.cuerpo(ref).trim().replace(/<\/p>\s*$/, ` ${GUIONES}</p>`);
    const corte = html.indexOf("</p>") + 4;
    return `<div class="clausula"><div class="bloque"><h2>${ref(c.id)} (${c.titulo}):</h2>${html.slice(0, corte)}</div>${html.slice(corte)}</div>`;
  }).join("");

  const cierre = `<div class="clausula"><p>En la ciudad de ${e(d.ciudad)}, se firman ${cantidadEnLetras(Number(d.ejemplares) || 3)} ejemplares de igual contenido y a un solo efecto. ${GUIONES}</p></div>`;

  const lineaFirma = (p, rol) => `<div class="firma"><div class="linea"><strong>${nombreCorto(p)}</strong><br>D.N.I. N° ${e(dni(p.dni)) || RAYA}<br>${rol}</div></div>`;
  const firmas = `
    <div class="firmas">
      ${locadores.map((p) => lineaFirma(p, "LOCADOR")).join("")}
      ${locatarios.map((p) => lineaFirma(p, "LOCATARIO")).join("")}
      ${garantes.map((p) => lineaFirma(p, "GARANTE")).join("")}
    </div>`;

  const ambientes = (d.ambientes || []).filter((a) => a.ambiente.trim() || a.descripcion.trim());
  const anexo1 = `
    <div class="salto"></div>
    <h1>Anexo I (Descripción detallada del inmueble - Inventario)</h1>
    <p>Las partes dejan constancia que el inmueble se encuentra en buen estado de uso, conservación y funcionamiento general, conforme a su destino habitacional, con pisos sanos, instalaciones operativas y artefactos en funcionamiento, salvo las observaciones que se indican en el presente.</p>
    <p>Se deja constancia que el inmueble objeto del presente contrato de locación se compone y presenta las siguientes características, instalaciones y estado general: ${ambientes.length ? ambientes.map((a) => `<strong>${e(a.ambiente)}:</strong> ${e(a.descripcion)}`).join(" ") : RAYA}</p>
    <p>El estado general de conservación en que se entrega el inmueble, como así también el mobiliario detallado, se acredita fehacientemente con fotos del inmueble, sacadas en el día de la fecha${d.emailFotos ? `, las que son enviadas al email del locatario ${e(d.emailFotos)}` : ""}, las que forman parte de este contrato.</p>`;

  return `
    <div class="encabezado"><strong>Grupo Condado</strong><span>Gestión Inmobiliaria</span></div>
    <h1>CONTRATO DE LOCACIÓN</h1>
    ${partes}
    ${cuerpo}
    ${cierre}
    ${firmas}
    ${anexo1}
    ${anexoGas()}`;
}

export function abrirVentanaDocumento() {
  const ventana = window.open("", "_blank", "width=980,height=760");
  if (ventana) {
    ventana.document.write('<p style="font-family:Arial;color:#6c2d20;padding:2rem;">Generando contrato...</p>');
  }
  return ventana;
}

export function abrirContratoLocacion(d, nombreArchivo = "Contrato_de_Locacion", ventana = window.open("", "_blank", "width=980,height=760")) {
  if (!ventana) throw new Error("El navegador bloqueó la ventana emergente. Permitila para generar el contrato.");

  const nombre = nombreArchivo.replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]/g, "").replace(/\s+/g, "_");
  ventana.document.open();
  ventana.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${nombre}</title>
  <style>${ESTILOS}</style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
</head>
<body>
  <div class="barra">
    <button id="btnPdf" onclick="descargarPDF()" style="background:#6c2d20;color:white;border:none;">📥 Descargar PDF</button>
    <button onclick="window.print()" style="background:white;color:#6c2d20;border:2px solid #6c2d20;">🖨 Imprimir</button>
    <button onclick="window.close()" style="background:#f5f0ee;color:#6b5b52;border:1px solid #d8ccc6;font-weight:400;">Cerrar</button>
  </div>
  <div id="documento">${htmlContratoLocacion(d)}</div>
  <script>
    function descargarPDF(){
      var btn = document.getElementById('btnPdf');
      btn.disabled = true; btn.textContent = 'Generando...';
      var doc = document.getElementById('documento');
      var enc = doc.querySelector('.encabezado');
      enc.style.display = 'none';
      var opt = {
        margin: [18, 16, 16, 16],
        filename: '${nombre}.pdf',
        image: { type: 'jpeg', quality: 0.8 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };
      var prevPad = doc.style.padding, prevW = doc.style.width, prevM = doc.style.margin;
      doc.style.padding = '0'; doc.style.width = '178mm'; doc.style.margin = '0';
      /* Con la barra de desplazamiento visible, html2canvas corre el contenido
         unos píxeles y corta el final de cada renglón: se oculta mientras genera. */
      var prevOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      html2pdf().set(opt).from(doc).toPdf().get('pdf').then(function(pdf){
        var total = pdf.internal.getNumberOfPages();
        var ancho = pdf.internal.pageSize.getWidth();
        for (var i = 1; i <= total; i++) {
          pdf.setPage(i);
          pdf.setFontSize(9); pdf.setTextColor(108, 45, 32);
          pdf.text('Grupo Condado   Gestión Inmobiliaria', 16, 11);
          pdf.text(String(i), ancho - 16, 11, { align: 'right' });
          pdf.setDrawColor(108, 45, 32); pdf.setLineWidth(0.3); pdf.line(16, 13, ancho - 16, 13);
        }
      }).save().then(function(){
        document.documentElement.style.overflow = prevOverflow;
        enc.style.display = '';
        doc.style.padding = prevPad; doc.style.width = prevW; doc.style.margin = prevM;
        btn.disabled = false; btn.textContent = '📥 Descargar PDF';
      });
    }
  </script>
</body>
</html>`);
  ventana.document.close();
}
