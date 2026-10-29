import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext, puedeVer } from "./authContext";
import { login as loginApi } from "../services/entidades";

const CLAVE_USUARIO  = "usuarioLogueado";
const CLAVE_INVITADO = "sesionInvitado";

function leerSesion() {
  try {
    const raw = localStorage.getItem(CLAVE_USUARIO);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerSesion);
  const [invitado, setInvitado] = useState(
    () => localStorage.getItem(CLAVE_INVITADO) === "1"
  );

  useEffect(() => {
    if (usuario) localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    else localStorage.removeItem(CLAVE_USUARIO);
  }, [usuario]);

  useEffect(() => {
    if (invitado) localStorage.setItem(CLAVE_INVITADO, "1");
    else localStorage.removeItem(CLAVE_INVITADO);
  }, [invitado]);

  const iniciarSesion = useCallback(async (nombre, contrasena, captchaToken) => {
    const fila = await loginApi(nombre, contrasena, captchaToken);
    if (!fila) throw new Error("Usuario o contraseña incorrectos");
    setInvitado(false);
    setUsuario(fila);
    return fila;
  }, []);

  const entrarComoInvitado = useCallback(() => {
    setUsuario(null);
    setInvitado(true);
  }, []);

  const cerrarSesion = useCallback(() => {
    setUsuario(null);
    setInvitado(false);
  }, []);

  const actualizarUsuario = useCallback((cambios) => {
    setUsuario((prev) => (prev ? { ...prev, ...cambios } : prev));
  }, []);

  const valor = useMemo(() => {
    const rol = usuario ? usuario.Rol || "Cliente" : invitado ? "Invitado" : null;
    return {
      usuario,
      invitado,
      rol,
      autenticado: Boolean(usuario) || invitado,
      puede: (seccion) => (rol ? puedeVer(rol, seccion) : false),
      iniciarSesion,
      entrarComoInvitado,
      cerrarSesion,
      actualizarUsuario,
    };
  }, [usuario, invitado, iniciarSesion, entrarComoInvitado, cerrarSesion, actualizarUsuario]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
