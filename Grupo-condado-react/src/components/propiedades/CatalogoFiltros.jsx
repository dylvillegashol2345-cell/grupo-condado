import { LOCALIDADES_ORDENADAS } from "../../utils/catalogos";
import { numero } from "../../utils/format";
import { PRECIO_MAX, SUP_MAX } from "../../utils/filtrosCatalogo";

const CHIPS_TIPO = [
  { valor: "",             label: "Todos" },
  { valor: "Casa",         label: "🏠 Casa" },
  { valor: "Departamento", label: "🏢 Depto" },
  { valor: "Lote",         label: "📐 Lote" },
  { valor: "Terreno",      label: "🌿 Terreno" },
];

const CHIPS_DORMITORIOS = [
  { valor: "",  label: "Todos" },
  { valor: "1", label: "1" },
  { valor: "2", label: "2" },
  { valor: "3", label: "3" },
  { valor: "4", label: "4+" },
];

const CHIPS_ECO = [
  { valor: "",  label: "Todas" },
  { valor: "A", label: "🌿 Clase A", clase: "eco-a" },
  { valor: "B", label: "Clase B" },
  { valor: "C", label: "Clase C" },
];

const CHIPS_ESTADO = [
  { valor: "",           label: "Todos" },
  { valor: "Disponible", label: "✅ Disponible" },
  { valor: "Alquilada",  label: "🔑 Alquilada" },
  { valor: "Vendida",    label: "🏠 Vendida" },
];

function Chips({ opciones, valor, onElegir }) {
  return (
    <div className="catalogo-filtro-chips">
      {opciones.map((c) => (
        <button
          key={c.valor}
          type="button"
          className={`cfiltro-chip${c.clase ? " " + c.clase : ""}${valor === c.valor ? " active" : ""}`}
          onClick={() => onElegir(c.valor)}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

function CatalogoFiltros({ filtros, onChange, cantidad, mostrarResumen, onAplicarAlMapa, onLimpiar }) {
  function set(cambios) {
    onChange({ ...filtros, ...cambios });
  }

  function setRangoPrecio(min, max) {
    set({ precioMin: Math.min(min, max), precioMax: Math.max(min, max) });
  }
  function setRangoSup(min, max) {
    set({ supMin: Math.min(min, max), supMax: Math.max(min, max) });
  }

  return (
    <div id="catalogoFiltrosPanel" className="catalogo-filtros-panel" style={{ display: "block" }}>
      <div className="catalogo-filtro-texto">
        <i className="fa fa-search" />
        <input
          type="search"
          placeholder="Buscar por barrio, calle, localidad..."
          value={filtros.texto}
          onChange={(e) => set({ texto: e.target.value })}
        />
      </div>

      <div className="catalogo-filtros-grid">

        <div className="catalogo-filtro-grupo">
          <label className="catalogo-filtro-label"><i className="fa fa-home me-1" />Tipo</label>
          <Chips opciones={CHIPS_TIPO} valor={filtros.tipo} onElegir={(v) => set({ tipo: v })} />
        </div>

        <div className="catalogo-filtro-grupo">
          <label className="catalogo-filtro-label"><i className="fa fa-leaf me-1" />Clase energética</label>
          <Chips opciones={CHIPS_ECO} valor={filtros.eco} onElegir={(v) => set({ eco: v })} />
        </div>

        <div className="catalogo-filtro-grupo">
          <label className="catalogo-filtro-label"><i className="fa fa-map-marker-alt me-1" />Localidad</label>
          <select
            className="catalogo-filtro-select"
            value={filtros.localidad}
            onChange={(e) => set({ localidad: e.target.value })}
          >
            <option value="">Todas las localidades</option>
            {LOCALIDADES_ORDENADAS.map((l) => (
              <option key={l.id} value={l.id}>{l.nombre}</option>
            ))}
          </select>
        </div>

        <div className="catalogo-filtro-grupo">
          <label className="catalogo-filtro-label">
            <i className="fa fa-dollar-sign me-1" />Precio
            <span className="catalogo-filtro-val">
              {mostrarResumen ? `$${numero(filtros.precioMin)} — $${numero(filtros.precioMax)}` : ""}
            </span>
          </label>
          <div className="catalogo-range-wrap">
            <input
              type="range" className="catalogo-range"
              min="0" max={PRECIO_MAX} step="10000"
              value={filtros.precioMin}
              onChange={(e) => setRangoPrecio(Number(e.target.value), filtros.precioMax)}
            />
            <input
              type="range" className="catalogo-range"
              min="0" max={PRECIO_MAX} step="10000"
              value={filtros.precioMax}
              onChange={(e) => setRangoPrecio(filtros.precioMin, Number(e.target.value))}
            />
          </div>
        </div>

        <div className="catalogo-filtro-grupo">
          <label className="catalogo-filtro-label">
            <i className="fa fa-ruler-combined me-1" />Superficie
            <span className="catalogo-filtro-val">
              {mostrarResumen ? `${filtros.supMin} — ${filtros.supMax} m²` : ""}
            </span>
          </label>
          <div className="catalogo-range-wrap">
            <input
              type="range" className="catalogo-range"
              min="0" max={SUP_MAX} step="10"
              value={filtros.supMin}
              onChange={(e) => setRangoSup(Number(e.target.value), filtros.supMax)}
            />
            <input
              type="range" className="catalogo-range"
              min="0" max={SUP_MAX} step="10"
              value={filtros.supMax}
              onChange={(e) => setRangoSup(filtros.supMin, Number(e.target.value))}
            />
          </div>
        </div>

        <div className="catalogo-filtro-grupo">
          <label className="catalogo-filtro-label"><i className="fa fa-bed me-1" />Dormitorios</label>
          <Chips opciones={CHIPS_DORMITORIOS} valor={filtros.dormitorios} onElegir={(v) => set({ dormitorios: v })} />
        </div>

        <div className="catalogo-filtro-grupo">
          <label className="catalogo-filtro-label"><i className="fa fa-tag me-1" />Estado</label>
          <Chips opciones={CHIPS_ESTADO} valor={filtros.estado} onElegir={(v) => set({ estado: v })} />
        </div>

        <div className="catalogo-filtro-grupo">
          <label className="catalogo-filtro-label"><i className="fa fa-sun me-1" />Características</label>
          <div className="d-flex gap-2 flex-wrap">
            <label className="cfiltro-check">
              <input type="checkbox" checked={filtros.paneles} onChange={(e) => set({ paneles: e.target.checked })} />
              <span>☀️ Paneles solares</span>
            </label>
            <label className="cfiltro-check">
              <input type="checkbox" checked={filtros.aislacion} onChange={(e) => set({ aislacion: e.target.checked })} />
              <span>🌡️ Aislamiento</span>
            </label>
            <label className="cfiltro-check">
              <input type="checkbox" checked={filtros.pileta} onChange={(e) => set({ pileta: e.target.checked })} />
              <span>🏊 Pileta</span>
            </label>
            <label className="cfiltro-check">
              <input type="checkbox" checked={filtros.cochera} onChange={(e) => set({ cochera: e.target.checked })} />
              <span>🚗 Cochera</span>
            </label>
          </div>
        </div>

      </div>

      <div className="catalogo-filtros-footer">
        <span className="catalogo-result-count">
          {mostrarResumen
            ? `${cantidad} propiedad${cantidad !== 1 ? "es" : ""} encontrada${cantidad !== 1 ? "s" : ""}`
            : ""}
        </span>
        <div className="d-flex gap-2">
          {onAplicarAlMapa && (
            <button
              type="button"
              className="catalogo-filtros-limpiar"
              style={{ background: "var(--condado)", color: "white", borderColor: "var(--condado)" }}
              onClick={onAplicarAlMapa}
            >
              <i className="fa fa-check me-1" />Aplicar al mapa
            </button>
          )}
          <button type="button" className="catalogo-filtros-limpiar" onClick={onLimpiar}>
            <i className="fa fa-times me-1" />Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}

export default CatalogoFiltros;
