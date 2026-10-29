import { useEffect, useRef } from "react";
import { useLeaflet } from "../../hooks/useCdn";
import { COORDS_BARRIO, COORDS_LOCALIDAD, LOCALIDADES } from "../../utils/catalogos";

function iconoCondado(L) {
  return L.divIcon({
    html:
      '<div style="background:#6c2d20;width:40px;height:40px;' +
      "border-radius:50% 50% 50% 0;transform:rotate(-45deg);" +
      "border:3px solid white;box-shadow:0 3px 12px rgba(108,45,32,.5);" +
      'display:flex;align-items:center;justify-content:center;">' +
      "<i class='fa fa-home' style='transform:rotate(45deg);color:white;font-size:14px;'></i></div>",
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
}

function MapaPropiedad({ idLocalidad, barrio, calle, numeracion }) {
  const contenedor = useRef(null);
  const mapaRef = useRef(null);
  const listo = useLeaflet();

  useEffect(() => {
    if (!listo || !contenedor.current) return undefined;
    const L = window.L;
    const coords = COORDS_LOCALIDAD[idLocalidad] || COORDS_LOCALIDAD[2];
    const nombreLocalidad = LOCALIDADES[idLocalidad] || "Córdoba";
    const exacta = COORDS_BARRIO[(barrio || "").toLowerCase().trim()];

    if (mapaRef.current) { mapaRef.current.remove(); mapaRef.current = null; }

    const inicio = exacta || coords;
    const mapa = L.map(contenedor.current, {
      center: [inicio.lat, inicio.lng],
      zoom: exacta ? 15 : 14,
      zoomControl: true,
      scrollWheelZoom: false,
    });
    mapaRef.current = mapa;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapa);
    mapa.invalidateSize();

    const direccion = `${calle || ""} ${numeracion || ""}`.trim();
    const popup =
      "<div style=\"font-family:'Inter',sans-serif;\">" +
      `<strong style="color:#6c2d20;">${barrio ? barrio + " · " : ""}${direccion}</strong><br>` +
      `<span style="font-size:12px;color:#6b5b52;">${nombreLocalidad}</span></div>`;

    const marcar = (lat, lng) =>
      L.marker([lat, lng], { icon: iconoCondado(L) }).addTo(mapa).bindPopup(popup, { maxWidth: 240 }).openPopup();

    if (exacta) {
      marcar(exacta.lat, exacta.lng);
      return () => {
        if (mapaRef.current) { mapaRef.current.remove(); mapaRef.current = null; }
      };
    }

    let cancelado = false;
    const partes = [barrio, calle, numeracion].map((s) => (s || "").trim()).filter(Boolean);
    partes.push(nombreLocalidad, "Córdoba", "Argentina");
    const query = encodeURIComponent(partes.join(", "));

    fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=ar`, {
      headers: { "Accept-Language": "es" },
    })
      .then((r) => r.json())
      .then((resultados) => {
        if (cancelado || !mapaRef.current) return;
        let { lat, lng } = coords;
        if (Array.isArray(resultados) && resultados.length) {
          lat = parseFloat(resultados[0].lat);
          lng = parseFloat(resultados[0].lon);
          mapa.setView([lat, lng], 16);
        }
        marcar(lat, lng);
      })
      .catch(() => {
        if (cancelado || !mapaRef.current) return;
        marcar(coords.lat, coords.lng);
      });

    return () => {
      cancelado = true;
      if (mapaRef.current) { mapaRef.current.remove(); mapaRef.current = null; }
    };
  }, [listo, idLocalidad, barrio, calle, numeracion]);

  if (!listo) {
    return <div className="mapa-placeholder">Cargando mapa…</div>;
  }

  return <div id="mapaPropiedad" className="detalle-v2-mapa" ref={contenedor} />;
}

export default MapaPropiedad;
