import { useEffect, useState } from "react";
import {
  estadoLogin, registrarFallo, limpiarIntentos, formatearEspera,
  generarCaptcha, captchaCoincide, svgCaptcha, MINUTOS_BLOQUEO,
} from "../utils/seguridadLogin";
import Recaptcha from "../components/common/Recaptcha";
import { recaptchaActivo } from "../utils/recaptcha";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { registrar, propiedades } from "../services/entidades";
import { validarRegistro } from "../utils/validaciones";
import { soloLetras, email, telefono } from "../utils/restricciones";
import { ApiError } from "../services/api";
import PasswordInput from "../components/common/PasswordInput";
import PasswordStrength from "../components/common/PasswordStrength";

function Login() {
  const navigate = useNavigate();
  const { iniciarSesion, entrarComoInvitado, autenticado, rol } = useAuth();

  const [panel, setPanel] = useState("login");
  const [stats, setStats] = useState(null);

  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [errorLogin, setErrorLogin] = useState("");
  const [cargando, setCargando] = useState(false);

  const [reg, setReg] = useState({
    nombre: "", email: "", telefono: "", pass: "", passConfirm: "",
  });
  const [msgReg, setMsgReg] = useState(null);
  const [regCargando, setRegCargando] = useState(false);

  useEffect(() => {
    if (!autenticado) return;
    navigate("/app/inicio", { replace: true });
  }, [autenticado, rol, navigate]);

  useEffect(() => {
    let cancelado = false;
    propiedades
      .listar()
      .then((lista) => {
        if (cancelado) return;
        setStats({
          total: lista.length,
          disponibles: lista.filter((p) => p.Estado === "Disponible").length,
          localidades: new Set(lista.map((p) => p.IdLocalidad)).size,
        });
      })
      .catch(() => { if (!cancelado) setStats(null); });
    return () => { cancelado = true; };
  }, []);

  const [seguridad, setSeguridad] = useState(estadoLogin);
  const [captcha, setCaptcha] = useState(generarCaptcha);
  const [captchaIngresado, setCaptchaIngresado] = useState("");
  const [tokenGoogle, setTokenGoogle] = useState("");
  const [reinicioCaptcha, setReinicioCaptcha] = useState(0);

  useEffect(() => {
    if (!seguridad.bloqueado) return undefined;
    const iv = setInterval(() => setSeguridad(estadoLogin()), 1000);
    return () => clearInterval(iv);
  }, [seguridad.bloqueado]);

  function renovarCaptcha() {
    setCaptcha(generarCaptcha());
    setCaptchaIngresado("");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setErrorLogin("");

    const estado = estadoLogin();
    if (estado.bloqueado) {
      setErrorLogin(`Demasiados intentos. Volvé a intentarlo en ${formatearEspera(estado.segundosRestantes)}.`);
      setSeguridad(estado);
      return;
    }
    if (!usuario.trim() || !clave) {
      setErrorLogin("Ingresá usuario y contraseña");
      return;
    }
    if (estado.pideCaptcha && !captchaCoincide(captchaIngresado, captcha)) {
      setErrorLogin("El código de verificación no coincide");
      renovarCaptcha();
      return;
    }
    if (recaptchaActivo() && !tokenGoogle) {
      setErrorLogin("Marcá la casilla «No soy un robot»");
      return;
    }

    setCargando(true);
    try {
      await iniciarSesion(usuario.trim(), clave, tokenGoogle);
      limpiarIntentos();
      navigate("/app/inicio", { replace: true });
    } catch (err) {
      const tras = registrarFallo();
      setSeguridad(tras);
      renovarCaptcha();
      setReinicioCaptcha((n) => n + 1);
      setErrorLogin(
        tras.bloqueado
          ? `Demasiados intentos fallidos. El acceso queda bloqueado por ${MINUTOS_BLOQUEO} minutos.`
          : err.message || "No se pudo iniciar sesión"
      );
    } finally {
      setCargando(false);
    }
  }

  async function handleRegistro(e) {
    e.preventDefault();
    const error = validarRegistro(reg);
    if (error) { setMsgReg({ tipo: "error", texto: error }); return; }

    setRegCargando(true);
    setMsgReg(null);
    try {
      await registrar({
        nombre: reg.nombre.trim(),
        email: reg.email.trim(),
        telefono: "+54" + reg.telefono,
        contrasena: reg.pass,
      });
      setMsgReg({ tipo: "ok", texto: "Cuenta creada. Ya podés iniciar sesión." });
      setUsuario(reg.nombre.trim());
      setTimeout(() => setPanel("login"), 1600);
    } catch (err) {
      const texto =
        err instanceof ApiError && err.status === 409
          ? "Ese email ya está registrado"
          : err.message || "Error al crear la cuenta";
      setMsgReg({ tipo: "error", texto });
    } finally {
      setRegCargando(false);
    }
  }

  function entrarInvitado() {
    entrarComoInvitado();
    navigate("/app/inicio", { replace: true });
  }

  return (
    <div id="loginBackdrop" style={{ display: "flex" }}>
      <div id="loginBox">

        <div className="login-welcome">
          <div className="login-welcome-bg" />
          <div className="login-welcome-overlay" />
          <div className="login-welcome-content">
            <div className="login-welcome-logo">
              <svg width="44" height="44" viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg">
                <rect width="42" height="42" rx="10" fill="rgba(255,255,255,0.15)" />
                <path d="M11 30V14.5L21 9l10 5.5V30h-6v-8h-8v8h-6z" fill="white" />
              </svg>
              <div>
                <span className="login-welcome-brand">Grupo Condado</span>
                <span className="login-welcome-sub">Gestión Inmobiliaria</span>
              </div>
            </div>

            <div className="login-welcome-hero">
              <h2 className="login-welcome-title">Tu próxima propiedad<br />empieza acá.</h2>
              <p className="login-welcome-desc">
                Gestioná propiedades, clientes y operaciones desde un solo lugar.
                Rápido, seguro y profesional.
              </p>
            </div>

            <div className="login-welcome-stats">
              <div className="login-stat-item">
                <span>{stats ? stats.total : "—"}</span>
                <small>Propiedades</small>
              </div>
              <div className="login-stat-sep" />
              <div className="login-stat-item">
                <span>{stats ? stats.disponibles : "—"}</span>
                <small>Disponibles</small>
              </div>
              <div className="login-stat-sep" />
              <div className="login-stat-item">
                <span>{stats ? stats.localidades : "—"}</span>
                <small>Localidades</small>
              </div>
            </div>
          </div>
        </div>

        {panel === "login" ? (
          <div className="login-form-panel">
            <div className="login-form-header">
              <h3>Bienvenido</h3>
              <p className="login-sub">Ingresá tus datos para continuar</p>
            </div>

            <div id="loginMsg">
              {errorLogin && <span className="alertaMsg alertaRoja">❌ {errorLogin}</span>}
            </div>

            <form onSubmit={handleLogin}>
              <div className="login-field">
                <label className="login-label" htmlFor="loginUser">
                  <i className="fa fa-user me-1" />Usuario
                </label>
                <input
                  id="loginUser"
                  type="text"
                  className="form-control login-input"
                  placeholder="Tu usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  autoComplete="username"
                />
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="loginPass">
                  <i className="fa fa-lock me-1" />Contraseña
                </label>
                <PasswordInput
                  id="loginPass"
                  className="form-control login-input"
                  value={clave}
                  placeholder="Tu contraseña"
                  onChange={(e) => setClave(e.target.value)}
                />
              </div>

              {seguridad.pideCaptcha && (
                <div className="login-campo">
                  <label><i className="fa fa-shield-halved me-2" />Código de verificación</label>
                  <div className="captcha-fila">
                    <span
                      className="captcha-imagen"
                      aria-hidden="true"
                      dangerouslySetInnerHTML={{ __html: svgCaptcha(captcha) }}
                    />
                    <button type="button" className="captcha-refrescar" onClick={renovarCaptcha} title="Generar otro código">
                      <i className="fa fa-rotate-right" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={captchaIngresado}
                    placeholder="Escribí el código"
                    autoComplete="off"
                    maxLength={6}
                    onChange={(e) => setCaptchaIngresado(e.target.value.toUpperCase())}
                  />
                </div>
              )}

              <Recaptcha onCambio={setTokenGoogle} reiniciar={reinicioCaptcha} />
              {seguridad.bloqueado && (
                <div className="alertaMsg alertaRoja">
                  <i className="fa fa-lock me-2" />
                  Acceso bloqueado por intentos fallidos. Esperá {formatearEspera(seguridad.segundosRestantes)}.
                </div>
              )}

              <button type="submit" className="login-btn-primary" disabled={cargando || seguridad.bloqueado}>
                <i className="fa fa-sign-in-alt me-2" />
                {cargando ? "Ingresando..." : "Ingresar"}
              </button>
            </form>

            <div className="login-divider"><span>o continuar con</span></div>

            <button type="button" className="login-btn-secondary" onClick={entrarInvitado}>
              <i className="fa fa-eye me-2" />Entrar como invitado
            </button>
            <button type="button" className="login-btn-outline" onClick={() => setPanel("registro")}>
              <i className="fa fa-user-plus me-2" />Crear cuenta
            </button>
          </div>
        ) : (
          <div className="login-form-panel">
            <div className="login-form-header">
              <h3>Crear cuenta</h3>
              <p className="login-sub">Registrate como Cliente para consultar propiedades</p>
            </div>

            <div id="registroMsg">
              {msgReg && (
                <span className={`alertaMsg ${msgReg.tipo === "ok" ? "alertaVerde" : "alertaRoja"}`}>
                  {msgReg.tipo === "ok" ? "✅" : "❌"} {msgReg.texto}
                </span>
              )}
            </div>

            <form onSubmit={handleRegistro}>
              <div className="login-field">
                <label className="login-label"><i className="fa fa-user me-1" />Nombre completo</label>
                <input
                  type="text"
                  className="form-control login-input"
                  placeholder="Tu nombre"
                  value={reg.nombre}
                  onChange={(e) =>
                    setReg({ ...reg, nombre: soloLetras(e.target.value) })
                  }
                />
              </div>

              <div className="login-field">
                <label className="login-label"><i className="fa fa-envelope me-1" />Gmail</label>
                <input
                  type="email"
                  className="form-control login-input"
                  placeholder="nombre@gmail.com"
                  value={reg.email}
                  onChange={(e) => setReg({ ...reg, email: email(e.target.value) })}
                />
              </div>

              <div className="login-field">
                <label className="login-label"><i className="fa fa-phone me-1" />Teléfono</label>
                <div className="input-group">
                  <span className="input-group-text login-prefix">+54</span>
                  <input
                    className="form-control login-input"
                    placeholder="11 dígitos"
                    inputMode="numeric"
                    value={reg.telefono}
                    onChange={(e) =>
                      setReg({ ...reg, telefono: telefono(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label"><i className="fa fa-lock me-1" />Contraseña</label>
                <PasswordInput
                  className="form-control login-input"
                  value={reg.pass}
                  placeholder="Mínimo 6 caracteres"
                  onChange={(e) => setReg({ ...reg, pass: e.target.value })}
                />
                <PasswordStrength valor={reg.pass} />
              </div>

              <div className="login-field">
                <label className="login-label"><i className="fa fa-lock me-1" />Confirmar contraseña</label>
                <PasswordInput
                  className="form-control login-input"
                  value={reg.passConfirm}
                  placeholder="Repetí tu contraseña"
                  onChange={(e) => setReg({ ...reg, passConfirm: e.target.value })}
                />
              </div>

              <button type="submit" className="login-btn-primary" style={{ marginTop: "1rem" }} disabled={regCargando}>
                <i className="fa fa-user-plus me-2" />
                {regCargando ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </form>

            <button type="button" className="login-btn-secondary" onClick={() => setPanel("login")}>
              <i className="fa fa-arrow-left me-2" />Ya tengo cuenta
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default Login;
