const UNIDADES = [
  "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve",
  "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis",
  "veintisiete", "veintiocho", "veintinueve",
];
const DECENAS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = [
  "", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos",
  "seiscientos", "setecientos", "ochocientos", "novecientos",
];

function hastaMil(n, apocope) {
  if (n === 100) return "cien";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  let texto;
  if (resto < 30) {
    texto = resto ? UNIDADES[resto] : "";
  } else {
    const d = Math.floor(resto / 10);
    const u = resto % 10;
    texto = DECENAS[d] + (u ? " y " + UNIDADES[u] : "");
  }
  if (apocope) texto = texto.replace(/uno$/, "un").replace(/veintiun$/, "veintiún");
  return [CENTENAS[c], texto].filter(Boolean).join(" ");
}

export function numeroALetras(valor, { apocope = false } = {}) {
  const n = Math.floor(Math.abs(Number(valor) || 0));
  if (n === 0) return "cero";

  const millones = Math.floor(n / 1e6);
  const miles = Math.floor((n % 1e6) / 1000);
  const resto = n % 1000;
  const partes = [];

  if (millones) partes.push(millones === 1 ? "un millón" : hastaMil(millones, true) + " millones");
  if (miles) partes.push(miles === 1 ? "mil" : hastaMil(miles, true) + " mil");
  if (resto) partes.push(hastaMil(resto, apocope));
  return partes.join(" ");
}

export function montoEnLetras(valor, moneda = "ARS") {
  const n = Number(valor) || 0;
  const entero = Math.floor(n);
  const centavos = Math.round((n - entero) * 100);
  const nombre = moneda === "USD" ? "dólares estadounidenses" : "pesos";
  const signo = moneda === "USD" ? "USD " : "$";
  const letras = numeroALetras(entero, { apocope: true }) + (centavos ? ` con ${String(centavos).padStart(2, "0")}/100` : "");
  const cifra = n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${nombre} ${letras} (${signo}${cifra})`;
}

export function cantidadEnLetras(n) {
  return `${numeroALetras(n)} (${n})`;
}
