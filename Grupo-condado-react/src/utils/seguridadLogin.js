const CLAVE = "loginIntentos";

export const INTENTOS_PARA_CAPTCHA = 3;
export const INTENTOS_PARA_BLOQUEO = 5;
export const MINUTOS_BLOQUEO = 15;

function leer() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    const d = crudo ? JSON.parse(crudo) : null;
    if (!d || typeof d.fallidos !== "number") return { fallidos: 0, bloqueadoHasta: 0 };
    return { fallidos: d.fallidos, bloqueadoHasta: d.bloqueadoHasta || 0 };
  } catch {
    return { fallidos: 0, bloqueadoHasta: 0 };
  }
}

function guardar(estado) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch { /* se ignora */ }
}

export function estadoLogin() {
  const d = leer();
  if (d.bloqueadoHasta && Date.now() >= d.bloqueadoHasta) {
    const limpio = { fallidos: 0, bloqueadoHasta: 0 };
    guardar(limpio);
    return { ...limpio, bloqueado: false, segundosRestantes: 0, pideCaptcha: false };
  }
  const bloqueado = Boolean(d.bloqueadoHasta);
  return {
    ...d,
    bloqueado,
    segundosRestantes: bloqueado ? Math.ceil((d.bloqueadoHasta - Date.now()) / 1000) : 0,
    pideCaptcha: !bloqueado && d.fallidos >= INTENTOS_PARA_CAPTCHA,
  };
}

export function registrarFallo() {
  const d = leer();
  const fallidos = d.fallidos + 1;
  const bloqueadoHasta = fallidos >= INTENTOS_PARA_BLOQUEO
    ? Date.now() + MINUTOS_BLOQUEO * 60 * 1000
    : 0;
  guardar({ fallidos, bloqueadoHasta });
  return estadoLogin();
}

export function limpiarIntentos() {
  guardar({ fallidos: 0, bloqueadoHasta: 0 });
}

export function formatearEspera(segundos) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return m > 0 ? `${m} min ${String(s).padStart(2, "0")} s` : `${s} s`;
}

const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LARGO_CODIGO = 5;

export function generarCaptcha() {
  let codigo = "";
  for (let i = 0; i < LARGO_CODIGO; i++) {
    codigo += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  }
  return codigo;
}

export function captchaCoincide(ingresado, esperado) {
  return String(ingresado || "").trim().toUpperCase() === String(esperado || "").toUpperCase();
}

export function svgCaptcha(codigo, { ancho = 170, alto = 52 } = {}) {
  const paso = ancho / (codigo.length + 1);
  const letras = [...codigo].map((c, i) => {
    const x = paso * (i + 1);
    const y = alto / 2 + 8 + (i % 2 === 0 ? -3 : 3);
    const giro = (i % 2 === 0 ? -1 : 1) * (8 + (i * 5) % 14);
    return `<text x="${x}" y="${y}" font-family="Georgia, serif" font-size="26"
      font-weight="700" fill="#6c2d20" transform="rotate(${giro} ${x} ${y})">${c}</text>`;
  }).join("");

  const lineas = [0, 1, 2].map((i) => {
    const y1 = 10 + i * 14;
    const y2 = alto - 8 - i * 10;
    return `<line x1="0" y1="${y1}" x2="${ancho}" y2="${y2}" stroke="#c9a99d" stroke-width="1.4" />`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">
    <rect width="${ancho}" height="${alto}" fill="#f6efec" rx="8" />
    ${lineas}${letras}
  </svg>`;
}
