import { useEffect, useMemo, useRef, useState } from "react";
import { usePannellum } from "../../hooks/useCdn";
import { leerTour, guardarTour, nombreSala } from "../../utils/tour360";
import "./Tour360.css";

const ALTO_BARRIDO = 70;   // Grados verticales típicos de un barrido con el celular

function encuadre(ancho, alto) {
  const relacion = ancho / alto;
  if (!relacion || Math.abs(relacion - 2) < 0.1) return {};       // Esférica completa
  return { haov: Math.min(360, ALTO_BARRIDO * relacion), vaov: ALTO_BARRIDO };
}

const medir = (src) => new Promise((listo) => {
  const img = new Image();
  img.onload = () => listo([img.naturalWidth, img.naturalHeight]);
  img.onerror = () => listo([0, 0]);
  img.src = src;
});

const redondear = (n) => Math.round(n * 10) / 10;

function Tour360({ valor, titulo, onCambiar }) {
  const contenedor = useRef(null);
  const visor = useRef(null);
  const ultimaVista = useRef(null);   // Para no perder el lugar al redibujar en el editor
  const listo = usePannellum();
  const salas = useMemo(() => leerTour(valor), [valor]);
  const conFoto = salas.map((s, i) => i).filter((i) => salas[i].imagen);
  const [actual, setActual] = useState(conFoto[0] ?? 0);
  const [destino, setDestino] = useState("");
  const editable = Boolean(onCambiar);

  useEffect(() => {
    if (!listo || !contenedor.current || !salas.some((s) => s.imagen)) return undefined;

    let cancelado = false;

    const abrir = async () => {
      const medidas = await Promise.all(salas.map((s) => (s.imagen ? medir(s.imagen) : null)));
      if (cancelado || !contenedor.current) return;
      const proporcion = contenedor.current.clientWidth / (contenedor.current.clientHeight || 1);

      const escenas = {};
      salas.forEach((s, i) => {
        if (!s.imagen) return;
        const vista = encuadre(...medidas[i]);
        const hfov = vista.vaov ? Math.min(110, Math.floor(vista.vaov * proporcion * 0.9)) : 110;
        escenas[i] = {
          title: salas.length > 1 ? nombreSala(salas, i) : "",
          panorama: s.imagen,
          ...vista,
          hfov,
          maxHfov: hfov,
          autoRotate: vista.haov || editable ? 0 : -2,
          avoidShowingBackground: Boolean(vista.haov),
          minPitch: vista.vaov ? -vista.vaov / 2 : undefined,
          maxPitch: vista.vaov ? vista.vaov / 2 : undefined,
          hotSpots: s.puertas
            .filter((p) => salas[p.a]?.imagen)
            .map((p) => ({
              pitch: p.pitch,
              yaw: p.yaw,
              type: "scene",
              sceneId: String(p.a),
              text: `Ir a ${nombreSala(salas, p.a)}`,
            })),
        };
      });

      const previa = ultimaVista.current;
      const primera = previa && escenas[previa.escena] ? previa.escena : Object.keys(escenas)[0];
      if (previa && escenas[previa.escena]) Object.assign(escenas[primera], { pitch: previa.pitch, yaw: previa.yaw });

      visor.current = window.pannellum.viewer(contenedor.current, {
        default: {
          firstScene: String(primera),
          autoLoad: true,
          sceneFadeDuration: 600,
          showZoomCtrl: true,
          showFullscreenCtrl: true,
          strings: {
            loadButtonLabel: "Ver recorrido",
            loadingLabel: "Cargando recorrido...",
            bylineLabel: "",
            noPanoramaError: "No se pudo cargar la panorámica.",
            fileAccessError: "No se encontró la imagen %s.",
            malformedURLError: "La dirección de la panorámica no es válida.",
          },
        },
        scenes: escenas,
      });
      setActual(Number(primera));
      visor.current.on("scenechange", (id) => setActual(Number(id)));
    };

    const espera = setTimeout(abrir, editable ? 600 : 0);

    return () => {
      cancelado = true;
      clearTimeout(espera);
      if (visor.current) {
        const v = visor.current;
        ultimaVista.current = { escena: v.getScene(), pitch: v.getPitch(), yaw: v.getYaw() };
        v.destroy();
        visor.current = null;
      }
    };
  }, [listo, salas, editable]);

  if (!salas.some((s) => s.imagen)) return null;

  const ir = (i) => visor.current?.loadScene(String(i));

  const ponerPuerta = () => {
    if (!visor.current || destino === "") return;
    const puerta = { a: Number(destino), pitch: redondear(visor.current.getPitch()), yaw: redondear(visor.current.getYaw()) };
    onCambiar(guardarTour(salas.map((s, i) => (i === actual ? { ...s, puertas: [...s.puertas, puerta] } : s))));
    setDestino("");
  };
  const quitarPuerta = (k) => onCambiar(guardarTour(salas.map((s, i) => (
    i === actual ? { ...s, puertas: s.puertas.filter((_, j) => j !== k) } : s
  ))));

  return (
    <div className="tour360">
      {conFoto.length > 1 && (
        <div className="tour360-ambientes">
          {conFoto.map((i) => (
            <button
              key={i}
              type="button"
              className={`btn btn-sm ${i === actual ? "btn-condado" : "btn-light"}`}
              onClick={() => ir(i)}
            >
              {nombreSala(salas, i)}
            </button>
          ))}
        </div>
      )}

      {listo
        ? (
          <div className="tour360-marco">
            <div ref={contenedor} className="tour360-visor" />
            {editable && <div className="tour360-mira" />}
          </div>
        )
        : <div className="mapa-placeholder">Cargando el recorrido virtual...</div>}

      {editable ? (
        salas.length > 1 && (
          <div className="tour360-puertas">
            <div className="d-flex gap-2 flex-wrap align-items-center">
              <span className="small">Desde <strong>{nombreSala(salas, actual)}</strong>, puerta hacia</span>
              <select className="form-select form-select-sm w-auto" value={destino} onChange={(e) => setDestino(e.target.value)}>
                <option value="">Elegí un ambiente</option>
                {conFoto.filter((i) => i !== actual).map((i) => (
                  <option key={i} value={i}>{nombreSala(salas, i)}</option>
                ))}
              </select>
              <button type="button" className="btn btn-sm btn-condado" disabled={destino === ""} onClick={ponerPuerta}>
                <i className="fa fa-crosshairs me-1" />Poner puerta en la mira
              </button>
            </div>
            <small className="text-muted d-block mt-1" style={{ fontSize: 11 }}>
              Girá la foto hasta que la mira quede sobre la puerta y apretá el botón.
            </small>
            {(salas[actual]?.puertas || []).length > 0 && (
              <div className="d-flex gap-1 flex-wrap mt-2">
                {salas[actual].puertas.map((p, k) => (
                  <span key={k} className="badge text-bg-light border">
                    <i className="fa fa-arrow-right me-1" />{nombreSala(salas, p.a)}
                    <button type="button" className="btn btn-link btn-sm p-0 ms-1 text-danger" title="Quitar puerta" onClick={() => quitarPuerta(k)}>
                      <i className="fa fa-times" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      ) : (
        <p className="tour360-ayuda">
          <i className="fa fa-hand-pointer me-1" />
          Arrastrá para mirar alrededor{titulo ? ` en ${titulo}` : ""}
          {conFoto.length > 1 ? " · tocá las flechas para pasar a otro ambiente" : " · rueda del mouse para acercar"}
        </p>
      )}
    </div>
  );
}

export default Tour360;
