export function normalizarImagen(valor) {
  if (!valor) return null;
  const src = String(valor).trim();
  if (!src) return null;
  if (src.startsWith("data:") || src.startsWith("http") || src.startsWith("/")) return src;
  return "/" + src;
}
