import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useCarga(fn, deps = []) {
  const [resultado, setResultado] = useState({ clave: null, datos: null, error: "" });
  const [tick, setTick] = useState(0);

  const serializadas = JSON.stringify(deps);
  const clave = useMemo(() => `${tick}|${serializadas}`, [tick, serializadas]);

  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; });

  useEffect(() => {
    let cancelado = false;

    Promise.resolve()
      .then(() => fnRef.current())
      .then((datos) => {
        if (!cancelado) setResultado({ clave, datos, error: "" });
      })
      .catch((e) => {
        if (!cancelado) setResultado({ clave, datos: null, error: e.message || "Error inesperado" });
      });

    return () => { cancelado = true; };
  }, [clave]);

  const recargar = useCallback(() => setTick((t) => t + 1), []);

  return {
    datos: resultado.datos,
    cargando: resultado.clave !== clave,
    error: resultado.error,
    recargar,
  };
}
