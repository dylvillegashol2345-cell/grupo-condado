import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MENSAJES_INICIO = [
  "Iniciando sistema...",
  "Conectando con la base de datos...",
  "Cargando propiedades...",
  "Preparando el catálogo...",
  "Listo para comenzar ✓",
];

function Splash({ modo = "inicio", onFin }) {
  const [pct, setPct] = useState(0);
  const [saliendo, setSaliendo] = useState(false);

  const finRef = useRef(onFin);
  useEffect(() => { finRef.current = onFin; });

  useEffect(() => {
    // Inicio: 2% cada 30 ms (~1,5 s). Salida: 5% cada 25 ms.
    const paso = modo === "salida" ? 5 : 2;
    let actual = 0;
    const iv = setInterval(() => {
      actual = Math.min(100, actual + paso);
      setPct(actual);
      if (actual >= 100) {
        clearInterval(iv);
        setTimeout(() => {
          setSaliendo(true);
          setTimeout(() => finRef.current?.(), 500);
        }, modo === "salida" ? 300 : 400);
      }
    }, modo === "salida" ? 25 : 30);
    return () => clearInterval(iv);
  }, [modo]);

  let mensaje;
  if (modo === "salida") {
    mensaje = pct >= 60 ? "Hasta pronto 👋" : "Cerrando sesión...";
  } else if (pct >= 90) mensaje = MENSAJES_INICIO[4];
  else if (pct >= 70) mensaje = MENSAJES_INICIO[3];
  else if (pct >= 45) mensaje = MENSAJES_INICIO[2];
  else if (pct >= 20) mensaje = MENSAJES_INICIO[1];
  else mensaje = MENSAJES_INICIO[0];

  return createPortal(
    <div id="splashScreen" className={saliendo ? "splash-saliendo" : ""} style={{ display: "flex" }}>
      <div className="splash-content">
        <div className="splash-logo">
          <svg width="64" height="64" viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg">
            <rect width="42" height="42" rx="12" fill="rgba(255,255,255,0.12)" />
            <path d="M11 30V14.5L21 9l10 5.5V30h-6v-8h-8v8h-6z" fill="white" />
          </svg>
        </div>
        <h1 className="splash-titulo">Grupo Condado</h1>
        <p className="splash-sub">Gestión Inmobiliaria</p>
        <div className="splash-barra-wrap">
          <div className="splash-barra" id="splashBarra" style={{ width: `${pct}%` }} />
        </div>
        <p className="splash-cargando" id="splashMsg">{mensaje}</p>
      </div>
      <div className="splash-footer">© Grupo Condado 2026 — Sistema de Gestión Inmobiliaria</div>
    </div>,
    document.body
  );
}

export default Splash;
