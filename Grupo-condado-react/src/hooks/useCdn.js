import { useEffect, useState } from "react";

const cargados = new Map();

function cargarScript(src) {
  if (cargados.has(src)) return cargados.get(src);
  const p = new Promise((resolve, reject) => {
    const existente = document.querySelector(`script[src="${src}"]`);
    if (existente) {
      if (existente.dataset.listo === "1") return resolve();
      existente.addEventListener("load", () => resolve());
      existente.addEventListener("error", () => reject(new Error(`No se pudo cargar ${src}`)));
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.addEventListener("load", () => { s.dataset.listo = "1"; resolve(); });
    s.addEventListener("error", () => reject(new Error(`No se pudo cargar ${src}`)));
    document.head.appendChild(s);
  });
  cargados.set(src, p);
  return p;
}

function cargarCss(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  document.head.appendChild(l);
}

function useGlobal(src, nombreGlobal, css) {
  const [listo, setListo] = useState(() => Boolean(window[nombreGlobal]));

  useEffect(() => {
    if (!src) return undefined;

    let cancelado = false;
    const marcar = () => { if (!cancelado) setListo(Boolean(window[nombreGlobal])); };

    if (window[nombreGlobal]) {
      Promise.resolve().then(marcar);
      return () => { cancelado = true; };
    }

    if (css) cargarCss(css);
    cargarScript(src).then(marcar).catch(marcar);
    return () => { cancelado = true; };
  }, [src, nombreGlobal, css]);

  return listo;
}

export function useChartJs() {
  return useGlobal("https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js", "Chart");
}

export function useLeaflet() {
  return useGlobal(
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
    "L",
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  );
}

export function usePannellum() {
  return useGlobal(
    "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js",
    "pannellum",
    "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"
  );
}

export function useRecaptcha(activo) {
  const listo = useGlobal(
    activo ? "https://www.google.com/recaptcha/api.js?render=explicit&hl=es" : "",
    "grecaptcha"
  );
  return activo ? listo : false;
}
