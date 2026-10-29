import { useState } from "react";
import { usuarios, login as loginApi } from "../services/entidades";
import { useAuth } from "../context/authContext";
import { useUI } from "../context/uiContext";
import { EMAIL_LIBRE } from "../utils/validaciones";
import { email as sinEspacios } from "../utils/restricciones";
import { ROL_A_ID } from "../utils/catalogos";
import PasswordInput from "../components/common/PasswordInput";
import PasswordStrength from "../components/common/PasswordStrength";
import ResumenCliente from "../components/perfil/ResumenCliente";

const TITULO_ROL = {
  Administrador: "Administrador",
  Agente: "Agente",
  Cliente: "Cliente",
};

const TITULO_CARD = {
  fontSize: ".78rem", fontWeight: 700, textTransform: "uppercase",
  letterSpacing: ".07em", color: "var(--text-secondary)", marginBottom: "1rem",
};

function inicialesPerfil(nombre) {
  return (nombre || "U").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function Perfil() {
  const { usuario, rol, actualizarUsuario } = useAuth();
  const { toast } = useUI();

  const [nombre, setNombre] = useState(usuario?.Nombre || "");
  const [email, setEmail] = useState(usuario?.Email || "");
  const [guardandoDatos, setGuardandoDatos] = useState(false);

  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [guardandoPass, setGuardandoPass] = useState(false);

  if (!usuario) {
    return <p className="text-muted">Necesitás iniciar sesión con una cuenta para ver tu perfil.</p>;
  }

  const idRol = usuario.IdRol || ROL_A_ID[rol] || ROL_A_ID.Cliente;

  async function guardarDatos() {
    const n = nombre.trim();
    const em = email.trim();
    if (!n) { toast("El nombre no puede estar vacío", "error"); return; }
    if (!em || !EMAIL_LIBRE.test(em)) { toast("Ingresá un email válido", "error"); return; }

    setGuardandoDatos(true);
    try {
      await usuarios.actualizar(usuario.IdUsuario, {
        IdUsuario: usuario.IdUsuario,
        Nombre: n,
        Email: em,
        Contrasena: "___NOCHANGE___",
        IdRol: idRol,
      });
      actualizarUsuario({ Nombre: n, Email: em });
      setNombre(n);
      setEmail(em);
      toast("✅ Perfil actualizado correctamente", "ok");
    } catch {
      toast("Error al actualizar el perfil", "error");
    } finally {
      setGuardandoDatos(false);
    }
  }

  async function cambiarPassword() {
    if (!passActual) { toast("Ingresá tu contraseña actual", "error"); return; }
    if (passNueva.length < 6) { toast("La contraseña debe tener al menos 6 caracteres", "error"); return; }
    if (passNueva !== passConfirm) { toast("Las contraseñas no coinciden", "error"); return; }

    setGuardandoPass(true);
    try {
      const ok = await loginApi(usuario.Nombre, passActual);
      if (!ok) {
        toast("La contraseña actual es incorrecta", "error");
        return;
      }

      await usuarios.actualizar(usuario.IdUsuario, {
        IdUsuario: usuario.IdUsuario,
        Nombre: usuario.Nombre,
        Email: usuario.Email,
        Contrasena: passNueva,
        IdRol: idRol,
      });

      setPassActual("");
      setPassNueva("");
      setPassConfirm("");
      toast("🔒 Contraseña actualizada correctamente", "ok");
    } catch {
      toast("Error al cambiar la contraseña", "error");
    } finally {
      setGuardandoPass(false);
    }
  }

  return (
    <section className="mt-3" id="perfilAdmin">
      <div className="perfil-header card-ghost mb-3 fade-in">
        <div className="perfil-avatar" id="perfilAvatar">{inicialesPerfil(usuario.Nombre)}</div>
        <div className="perfil-info">
          <h3 id="perfilNombreDisplay">{usuario.Nombre || "—"}</h3>
          <span className="perfil-rol-badge" id="perfilRolBadge">{TITULO_ROL[rol] || rol}</span>
          <p className="perfil-email-display" id="perfilEmailDisplay">{usuario.Email || "—"}</p>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card-ghost fade-in">
            <h6 style={TITULO_CARD}><i className="fa fa-user me-2" />Datos personales</h6>
            <div className="mb-3">
              <label className="form-label">Nombre</label>
              <input id="perfilNombre" type="text" className="form-control" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input id="perfilEmail" type="email" className="form-control" value={email} onChange={(e) => setEmail(sinEspacios(e.target.value))} />
            </div>
            <div className="text-end">
              <button id="btnActualizarPerfil" type="button" className="btn btn-condado" onClick={guardarDatos} disabled={guardandoDatos}>
                <i className="fa fa-save me-2" />Guardar cambios
              </button>
            </div>
            <div id="perfilMsg" className="mt-2" />
          </div>
        </div>

        <div className="col-md-6">
          <div className="card-ghost fade-in-delay-1">
            <h6 style={TITULO_CARD}><i className="fa fa-lock me-2" />Cambiar contraseña</h6>
            <div className="mb-3">
              <label className="form-label">Contraseña actual</label>
              <PasswordInput id="perfilPassActual" value={passActual} onChange={(e) => setPassActual(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label">Contraseña a usar</label>
              <PasswordInput id="perfilPassNueva" value={passNueva} onChange={(e) => setPassNueva(e.target.value)} />
              <PasswordStrength valor={passNueva} inicial="Ingresá la contraseña que vas a usar" alto={4} margen=".5rem" />
            </div>
            <div className="mb-3">
              <label className="form-label">Confirmar contraseña</label>
              <PasswordInput id="perfilPassConfirm" value={passConfirm} onChange={(e) => setPassConfirm(e.target.value)} />
            </div>
            <div className="text-end">
              <button id="btnCambiarPass" type="button" className="btn btn-condado" onClick={cambiarPassword} disabled={guardandoPass}>
                <i className="fa fa-key me-2" />Cambiar contraseña
              </button>
            </div>
            <div id="passMsg" className="mt-2" />
          </div>
        </div>
      </div>

      <div id="perfilClienteResumen" className="mt-3">
        {rol === "Cliente" && <ResumenCliente usuario={usuario} />}
      </div>
    </section>
  );
}

export default Perfil;
