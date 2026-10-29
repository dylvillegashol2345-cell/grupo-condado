export function leerTour(valor) {
  const texto = (valor || "").trim();
  if (!texto) return [];
  if (!texto.startsWith("[")) return [{ nombre: "", imagen: texto, puertas: [] }];
  try {
    return JSON.parse(texto).map((s) => ({
      nombre: s?.nombre || "",
      imagen: s?.imagen || "",
      puertas: Array.isArray(s?.puertas) ? s.puertas : [],
    }));
  } catch {
    return [];   // Texto cortado o roto: se trata como sin recorrido
  }
}

export function guardarTour(salas) {
  if (!salas.length) return "";
  const [s] = salas;
  if (salas.length === 1 && s.imagen && !s.nombre && !s.puertas.length) return s.imagen;
  return JSON.stringify(salas);
}

export const quitarSala = (salas, i) => salas
  .filter((_, j) => j !== i)
  .map((s) => ({
    ...s,
    puertas: s.puertas.filter((p) => p.a !== i).map((p) => (p.a > i ? { ...p, a: p.a - 1 } : p)),
  }));

export function limpiarTour(valor) {
  let salas = leerTour(valor);
  for (let i = salas.length - 1; i >= 0; i--) if (!salas[i].imagen.trim()) salas = quitarSala(salas, i);
  return guardarTour(salas);
}

export const nombreSala = (salas, i) => salas[i]?.nombre || `Ambiente ${i + 1}`;
