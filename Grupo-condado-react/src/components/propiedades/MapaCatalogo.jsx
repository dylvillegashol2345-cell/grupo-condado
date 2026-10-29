import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLeaflet } from "../../hooks/useCdn";
import { COORDS_BARRIO, COORDS_LOCALIDAD, IMG_PROPIEDAD_FALLBACK } from "../../utils/catalogos";

const COLOR_PIN = { A: "#1b5e20", B: "#388e3c", C: "#a5d6a7" };

function pinCatalogo(clase) {
  return (
    `<div style="background:${COLOR_PIN[clase] || "#6c2d20"};width:36px;height:36px;border-radius:50% 50% 50% 0;` +
    "transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,.4);" +
    'display:flex;align-items:center;justify-content:center;">' +
    "<i class='fa fa-home' style='transform:rotate(45deg);color:white;font-size:13px;'></i></div>"
  );
}

function ubicar(propiedades) {
  const porLocalidad = {};
  return propiedades
    .filter((p) => COORDS_LOCALIDAD[p.localidadId])
    .map((p) => {
      const exacta = COORDS_BARRIO[(p.barrio || "").toLowerCase().trim()];
      if (exacta) return { p, lat: exacta.lat, lng: exacta.lng };
      const base = COORDS_LOCALIDAD[p.localidadId];
      const idx = porLocalidad[p.localidadId] = (porLocalidad[p.localidadId] || 0) + 1;
      const ang = idx * 137.5 * Math.PI / 180;
      const r = 0.004 * Math.sqrt(idx);
      return { p, lat: base.lat + r * Math.cos(ang), lng: base.lng + r * Math.sin(ang) };
    });
}

function MapaCatalogo({ propiedades }) {
  const contenedor = useRef(null);
  const mapaRef = useRef(null);
  const listo = useLeaflet();
  const navigate = useNavigate();
  const [seleccionada, setSeleccionada] = useState(null);

  const ubicadas = useMemo(() => ubicar(propiedades), [propiedades]);

  useEffect(() => {
    if (!listo || !contenedor.current) return undefined;
    const L = window.L;

    if (mapaRef.current) { mapaRef.current.remove(); mapaRef.current = null; }

    const mapa = L.map(contenedor.current, {
      center: [-31.8, -64.2],
      zoom: 7,
      scrollWheelZoom: true,
    });
    mapaRef.current = mapa;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(mapa);

    const marcadores = ubicadas.map(({ p, lat, lng }) => {
      const icono = L.divIcon({
        html: pinCatalogo(p.categoriaEco),
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      });

      return L.marker([lat, lng], { icon: icono })
        .addTo(mapa)
        .bindPopup(
          '<div style="width:220px;font-family:\'Inter\',sans-serif;">' +
            `<img src="${p.image || IMG_PROPIEDAD_FALLBACK}" style="width:calc(100% + 16px);height:110px;object-fit:cover;border-radius:6px 6px 0 0;display:block;margin:-8px -8px 8px;">` +
            `<strong style="color:#6c2d20;font-size:13px;">${p.type} · ${p.barrio}</strong><br>` +
            `<span style="font-size:12px;color:#555;">${`${p.calle} ${p.numeracion}`.trim()} · ${p.localidad}</span><br>` +
            `<span style="font-size:15px;font-weight:700;color:#6c2d20;">${p.price}</span>` +
            `<span style="font-size:11px;color:#888;"> · ${p.surface || "—"} m²</span>` +
            (p.categoriaEco === "A" ? '<span style="background:#e8f5e9;color:#2e7d32;font-size:10px;padding:.15em .5em;border-radius:10px;margin-left:.3rem;">🌿 Eco A</span>' : "") +
            "<br><br>" +
            `<button data-id="${p.id}" class="popup-detalle" style="width:100%;background:#6c2d20;color:white;border:none;border-radius:8px;padding:.5rem;font-size:12px;font-weight:600;cursor:pointer;">Ver detalles →</button>` +
          "</div>",
          { maxWidth: 240 }
        )
        .on("click", () => setSeleccionada(p.id));
    });

    if (marcadores.length) mapa.fitBounds(L.featureGroup(marcadores).getBounds().pad(0.1));

    function onClick(e) {
      const btn = e.target.closest(".popup-detalle");
      if (btn) navigate(`/app/propiedades/${btn.dataset.id}`);
    }
    const nodo = contenedor.current;
    nodo.addEventListener("click", onClick);

    return () => {
      nodo.removeEventListener("click", onClick);
      if (mapaRef.current) { mapaRef.current.remove(); mapaRef.current = null; }
    };
  }, [listo, ubicadas, navigate]);

  return (
    <div id="catalogoMapaWrap" className="mt-3">
      {listo
        ? <div id="catalogoMapa" className="catalogo-mapa-container" ref={contenedor} />
        : <div className="mapa-placeholder">Cargando mapa…</div>}

      <div id="catalogoMapaPanel" className="catalogo-mapa-panel">
        <div className="mapa-panel-header">
          <strong>
            {ubicadas.length} propiedad{ubicadas.length !== 1 ? "es" : ""} disponible{ubicadas.length !== 1 ? "s" : ""}
          </strong>
          <small>Hacé clic en un pin o en una propiedad</small>
        </div>
        <div className="mapa-panel-lista">
          {ubicadas.map(({ p }) => (
            <div
              key={p.id}
              className={`mapa-panel-item${seleccionada === p.id ? " selected" : ""}`}
              onClick={() => navigate(`/app/propiedades/${p.id}`)}
            >
              <img src={p.image || IMG_PROPIEDAD_FALLBACK} className="mapa-panel-img" alt={p.type} />
              <div className="mapa-panel-info">
                <strong>{p.type} · {p.barrio}</strong>
                <span><i className="fa fa-map-marker-alt me-1" />{p.localidad}</span>
                <span className="mapa-panel-precio">{p.price}</span>
              </div>
              {p.categoriaEco === "A" && <span className="mapa-panel-eco">🌿 A</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MapaCatalogo;
