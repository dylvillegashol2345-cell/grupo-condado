import { useEffect, useRef } from "react";
import { useRecaptcha } from "../../hooks/useCdn";
import { RECAPTCHA_SITE_KEY, recaptchaActivo } from "../../utils/recaptcha";

function Recaptcha({ onCambio, reiniciar }) {
  const caja = useRef(null);
  const widget = useRef(null);
  const listo = useRecaptcha(recaptchaActivo());

  const avisar = useRef(onCambio);
  useEffect(() => { avisar.current = onCambio; });

  useEffect(() => {
    if (!listo || !caja.current || widget.current !== null) return undefined;
    const g = window.grecaptcha;
    if (!g) return undefined;

    let cancelado = false;
    const dibujar = () => {
      if (cancelado || widget.current !== null || !caja.current) return;
      widget.current = window.grecaptcha.render(caja.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: (token) => avisar.current(token),
        "expired-callback": () => avisar.current(""),
        "error-callback": () => avisar.current(""),
      });
    };

    if (typeof g.ready === "function") g.ready(dibujar);
    else dibujar();

    return () => { cancelado = true; };
  }, [listo]);

  useEffect(() => {
    if (!reiniciar || widget.current === null) return;
    window.grecaptcha?.reset(widget.current);
    avisar.current("");
  }, [reiniciar]);

  if (!recaptchaActivo()) return null;

  return (
    <div className="login-campo">
      <div ref={caja} className="recaptcha-caja" />
      {!listo && <small className="text-muted">Cargando verificación...</small>}
    </div>
  );
}

export default Recaptcha;
