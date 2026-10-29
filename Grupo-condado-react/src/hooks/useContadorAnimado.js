import { useEffect, useState } from "react";

export function useContadorAnimado(objetivo) {
  const meta = Number(objetivo) || 0;
  const [valor, setValor] = useState(0);

  useEffect(() => {
    let actual = 0;
    const paso = Math.max(1, Math.ceil(meta / 30));
    const iv = setInterval(() => {
      actual = Math.min(actual + paso, meta);
      setValor(actual);
      if (actual >= meta) clearInterval(iv);
    }, 40);
    return () => clearInterval(iv);
  }, [meta]);

  return valor;
}
