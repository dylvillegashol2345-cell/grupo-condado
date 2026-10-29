export function money(valor) {
  return "$" + Number(valor || 0).toLocaleString("es-AR");
}

export function precio(valor, moneda) {
  const signo = moneda === "USD" ? "USD " : "$";
  return signo + Number(valor || 0).toLocaleString("es-AR");
}

export function numero(valor) {
  return Number(valor || 0).toLocaleString("es-AR");
}

export function fechaCorta(valor) {
  if (!valor) return "—";
  return String(valor).split("T")[0];
}

export function fechaLarga(valor) {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });
}

export function fechaLocal(valor) {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR");
}

export function fechaInput(valor) {
  if (!valor) return "";
  return String(valor).split("T")[0];
}

export function diasRestantes(fechaFin) {
  if (!fechaFin) return null;
  const fin = new Date(fechaFin);
  if (Number.isNaN(fin.getTime())) return null;
  return Math.ceil((fin - new Date()) / (1000 * 60 * 60 * 24));
}

export function mesesEntre(inicio, fin) {
  if (!inicio || !fin) return null;
  const a = new Date(inicio);
  const b = new Date(fin);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b - a) / (1000 * 60 * 60 * 24 * 30.44));
}

export function iniciales(nombre) {
  return String(nombre || "?")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function saludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function telSinPrefijo(tel) {
  return String(tel || "").replace(/^\+54/, "");
}

export function telConPrefijo(tel) {
  const limpio = String(tel || "").replace(/\D/g, "");
  return limpio ? "+54" + limpio : "";
}

export function plural(n, singular, pluralForma) {
  return `${n} ${n === 1 ? singular : pluralForma}`;
}
