import { useCallback, useMemo, useRef, useState } from "react";
import { UIContext } from "./uiContext";

function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmacion, setConfirmacion] = useState(null);
  const siguienteId = useRef(1);

  const cerrarToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (mensaje, tipo = "ok", duracion = 3000, extras) => {
      const id = siguienteId.current++;
      setToasts((prev) => [...prev, { id, mensaje, tipo, ...extras }]);
      setTimeout(() => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, saliendo: true } : t)));
        setTimeout(() => cerrarToast(id), extras?.desc ? 300 : 280);
      }, duracion);
      return id;
    },
    [cerrarToast]
  );

  const confirmar = useCallback(
    ({ titulo, descripcion, textoConfirmar = "Sí, eliminar", peligro = true, variante }) =>
      new Promise((resolve) => {
        setConfirmacion({
          titulo,
          descripcion,
          textoConfirmar,
          peligro,
          variante: variante || (peligro ? "eliminar" : "borrado"),
          resolver: (valor) => {
            setConfirmacion(null);
            resolve(valor);
          },
        });
      }),
    []
  );

  const valor = useMemo(
    () => ({ toast, confirmar, toasts, cerrarToast, confirmacion }),
    [toast, confirmar, toasts, cerrarToast, confirmacion]
  );

  return <UIContext.Provider value={valor}>{children}</UIContext.Provider>;
}

export default UIProvider;
