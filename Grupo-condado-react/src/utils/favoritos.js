export function claveFavoritos(usuario) {
  return `fav_${usuario?.IdUsuario ?? "guest"}`;
}

export function leerFavoritos(usuario) {
  try {
    const crudo = localStorage.getItem(claveFavoritos(usuario));
    const lista = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(lista) ? lista.map(Number).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function guardarFavoritos(usuario, ids) {
  try {
    localStorage.setItem(claveFavoritos(usuario), JSON.stringify(ids));
  } catch { /* se ignora */ }
}

export function alternarFavorito(ids, id) {
  const n = Number(id);
  return ids.includes(n) ? ids.filter((x) => x !== n) : [...ids, n];
}
