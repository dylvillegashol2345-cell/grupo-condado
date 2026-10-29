export const POR_PAGINA = 10;

export function paginar(lista, pagina, porPagina = POR_PAGINA) {
  return lista.slice((pagina - 1) * porPagina, pagina * porPagina);
}
