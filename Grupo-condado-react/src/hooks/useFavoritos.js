import { useCallback, useState } from "react";
import { useAuth } from "../context/authContext";
import { alternarFavorito, guardarFavoritos, leerFavoritos } from "../utils/favoritos";

export function useFavoritos() {
  const { usuario } = useAuth();
  const [favoritos, setFavoritos] = useState(() => leerFavoritos(usuario));

  const alternar = useCallback((id) => {
    setFavoritos((actuales) => {
      const nuevos = alternarFavorito(actuales, id);
      guardarFavoritos(usuario, nuevos);
      return nuevos;
    });
  }, [usuario]);

  const esFavorito = useCallback((id) => favoritos.includes(Number(id)), [favoritos]);

  const vaciar = useCallback(() => {
    guardarFavoritos(usuario, []);
    setFavoritos([]);
  }, [usuario]);

  return { favoritos, esFavorito, alternar, vaciar };
}
