import { POR_PAGINA } from "../../utils/paginacion";

function Paginacion({ total, pagina, onCambio, porPagina = POR_PAGINA }) {
  const totalPags = Math.ceil(total / porPagina);
  if (totalPags <= 1) return null;

  const paginas = Array.from({ length: totalPags }, (_, i) => i + 1);

  return (
    <div className="pag-wrap">
      <button className="pag-btn" onClick={() => onCambio(pagina - 1)} disabled={pagina === 1}>‹</button>
      {paginas.map((p) => (
        <button
          key={p}
          className={`pag-btn${p === pagina ? " pag-btn-active" : ""}`}
          onClick={() => onCambio(p)}
        >
          {p}
        </button>
      ))}
      <button className="pag-btn" onClick={() => onCambio(pagina + 1)} disabled={pagina === totalPags}>›</button>
      <span className="pag-info">{total} registro{total !== 1 ? "s" : ""}</span>
    </div>
  );
}

export default Paginacion;
