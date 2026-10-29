import { useCallback, useState } from "react";
import { useUI } from "../context/uiContext";
import { MAX_COMPARAR } from "../utils/comparador";

export function useComparador() {
  const { toast } = useUI();
  const [ids, setIds] = useState([]);

  const alternar = useCallback((id) => {
    const n = Number(id);
    if (ids.includes(n)) {
      setIds(ids.filter((x) => x !== n));
      return;
    }
    if (ids.length >= MAX_COMPARAR) {
      toast(`Máximo ${MAX_COMPARAR} propiedades para comparar`, "error");
      return;
    }
    setIds([...ids, n]);
  }, [ids, toast]);

  const enComparador = useCallback((id) => ids.includes(Number(id)), [ids]);
  const limpiar = useCallback(() => setIds([]), []);

  return { ids, enComparador, alternar, limpiar };
}
