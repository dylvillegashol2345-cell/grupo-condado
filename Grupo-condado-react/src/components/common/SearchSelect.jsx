import { useEffect, useMemo, useRef, useState } from "react";

function SearchSelect({ value, onChange, opciones = [], placeholder = "Buscar...", icono = "fa-search", disabled }) {
  const [consulta, setConsulta] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);

  const seleccionada = useMemo(
    () => opciones.find((o) => String(o.value) === String(value)) || null,
    [opciones, value]
  );

  const editando = consulta !== null;
  const texto = editando ? consulta : seleccionada ? seleccionada.label : "";

  useEffect(() => {
    function onClickFuera(e) {
      if (contenedor.current && !contenedor.current.contains(e.target)) {
        setAbierto(false);
        setConsulta(null);
      }
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  const filtradas = useMemo(() => {
    const term = editando ? consulta.trim().toLowerCase() : "";
    if (!term) return opciones.slice(0, 12);
    return opciones
      .filter(
        (o) =>
          o.label.toLowerCase().includes(term) ||
          String(o.sub || "").toLowerCase().includes(term)
      )
      .slice(0, 12);
  }, [consulta, editando, opciones]);

  function elegir(op) {
    onChange(op.value);
    setConsulta(null);
    setAbierto(false);
  }

  function limpiar() {
    onChange("");
    setConsulta(null);
    setAbierto(false);
  }

  return (
    <div className="selector-busqueda" ref={contenedor}>
      <div className="selector-input-wrap">
        <i className={`fa ${icono} selector-icon`} />
        <input
          type="text"
          className={`form-control selector-input${seleccionada ? " seleccionado" : ""}`}
          value={texto}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => { setConsulta(e.target.value); setAbierto(true); }}
          autoComplete="off"
        />
        {seleccionada && (
          <button type="button" className="selector-clear" onClick={limpiar} aria-label="Limpiar">
            <i className="fa fa-times" />
          </button>
        )}
      </div>

      {abierto && (
        <div className="selector-dropdown" style={{ display: "block" }}>
          {filtradas.length === 0 ? (
            <div className="selector-empty">
              <i className="fa fa-search me-1" />Sin resultados para &quot;{consulta}&quot;
            </div>
          ) : (
            filtradas.map((o) => (
              <div
                key={o.value}
                className="selector-option"
                onMouseDown={(e) => { e.preventDefault(); elegir(o); }}
              >
                <strong>{o.label}</strong>
                {o.sub && <span>{o.sub}</span>}
              </div>
            ))
          )}
        </div>
      )}

      <small className="text-muted selector-sub">{seleccionada?.sub || ""}</small>
    </div>
  );
}

export default SearchSelect;
