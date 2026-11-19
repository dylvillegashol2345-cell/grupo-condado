import { Fragment, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Notificaciones from "./Notificaciones";
import BusquedaGlobal from "./BusquedaGlobal";
import Chatbot from "./Chatbot";
import Footer from "./Footer";
import Logo from "./Logo";
import ToastStack from "../common/ToastStack";
import ConfirmDialog from "../common/ConfirmDialog";
import Splash from "../common/Splash";
import ErrorBoundary from "../common/ErrorBoundary";
import { useAuth } from "../../context/authContext";
import { useTheme } from "../../context/themeContext";
import { useActividad } from "../../context/actividadContext";
import { propiedades } from "../../services/entidades";

const NAV = [
  { seccion: "inicio",       path: "/app/inicio",       icon: "fa-search",        label: "Buscar propiedades" },
  { seccion: "dashboard",    path: "/app/dashboard",    icon: "fa-chart-pie",     label: "Dashboard" },
  { seccion: "propiedades",  path: "/app/propiedades",  icon: "fa-building",      label: "Propiedades" },
  { seccion: "propietarios", path: "/app/propietarios", icon: "fa-user",          label: "Propietarios" },
  { seccion: "clientes",     path: "/app/clientes",     icon: "fa-users",         label: "Clientes" },
  { seccion: "operaciones",  path: "/app/operaciones",  icon: "fa-handshake",     label: "Operaciones" },
  { seccion: "catalogo",     path: "/app/catalogo",     icon: "fa-th-large",      label: "Catálogo", contador: true },
  { seccion: "contratos",    path: "/app/contratos",    icon: "fa-file-contract", label: "Contratos", labelCliente: "Mis contratos" },
  { seccion: "pagos",        path: "/app/pagos",        icon: "fa-hand-holding-usd", label: "Cobros", labelCliente: "Mis pagos" },
  { seccion: "consultas",    path: "/app/consultas",    icon: "fa-comments",      label: "Consultas" },
  { seccion: "citas",        path: "/app/citas",        icon: "fa-calendar-alt",  label: "Citas" },
  { seccion: "usuarios",     path: "/app/usuarios",     icon: "fa-users-cog",     label: "Usuarios" },
  { seccion: "ecomarket",    path: "/app/ecomarket",    icon: "fa-leaf",          label: "EcoMarket" },
  { seccion: "ambiental",    path: "/app/ambiental",    icon: "fa-seedling",      label: "Impacto Ambiental" },
  { seccion: "consulta",     path: "/app/consulta",     icon: "fa-envelope",      label: "Hacer consulta" },
  { seccion: "perfil",       path: "/app/perfil",       icon: "fa-user-circle",   label: "Mi perfil" },
];

const CINCO_MINUTOS = 5 * 60 * 1000;

function MainLayout() {
  const { rol, invitado, puede, cerrarSesion } = useAuth();
  const { oscuro, alternar } = useTheme();
  const { limpiar: limpiarActividad } = useActividad();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [colapsado, setColapsado] = useState(false);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [disponibles, setDisponibles] = useState(0);

  const items = useMemo(
    () =>
      NAV.filter((i) => puede(i.seccion))
        .filter((i) => i.seccion !== "inicio" || (rol !== "Cliente" && !invitado))
        .map((i) => ({
          ...i,
          label: rol === "Cliente" && i.labelCliente ? i.labelCliente : i.label,
        })),
    [puede, rol, invitado]
  );

  const veCatalogo = puede("catalogo");
  useEffect(() => {
    if (!veCatalogo) return undefined;
    let cancelado = false;
    async function contar() {
      try {
        const lista = await propiedades.listar();
        if (!cancelado) setDisponibles(lista.filter((p) => p.Estado === "Disponible").length);
      } catch { /* se ignora */ }
    }
    const inicial = setTimeout(contar, 1500);
    const iv = setInterval(contar, CINCO_MINUTOS);
    return () => { cancelado = true; clearTimeout(inicial); clearInterval(iv); };
  }, [veCatalogo]);

  function clickLogout() {
    if (!invitado) { setConfirmarSalida(true); return; }
    cerrarSesion();
    navigate("/login", { replace: true });
  }

  function salir() {
    setConfirmarSalida(false);
    setSaliendo(true);
  }

  function finSalida() {
    limpiarActividad();
    cerrarSesion();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <button id="miniToggle" onClick={() => setColapsado((v) => !v)} aria-label="Menú" />

      <aside className={`sidebar${colapsado ? " collapsed" : ""}`}>
        <div>
          <div className="brand" onClick={() => setColapsado((v) => !v)}>
            <Logo />
            <div>
              Grupo Condado<br />
              <span style={{ fontSize: 11, opacity: 0.9 }}>Gestión Inmobiliaria</span>
            </div>
          </div>

          <Notificaciones />

          <nav className="mt-3" id="sidebarNav">
            {items.map((item) => (
              <Fragment key={item.path}>
                <NavLink
                  to={item.path}
                  id={`link-${item.seccion}`}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <i className={`fa ${item.icon} me-2`} />
                  {item.label}
                  {item.contador && disponibles > 0 && (
                    <span
                      id="sidebarContadorDisp"
                      style={{
                        display: "inline-flex", background: "rgba(255,255,255,.18)", color: "white",
                        fontSize: 10, fontWeight: 700, padding: ".15em .5em", borderRadius: 10,
                        marginLeft: "auto", minWidth: 18, height: 18,
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {disponibles}
                    </span>
                  )}
                </NavLink>
                {item.seccion === "inicio" && puede("busqueda") && <BusquedaGlobal />}
              </Fragment>
            ))}
          </nav>
        </div>

        <div className="mt-4">
          <button id="btnDarkMode" onClick={alternar} title="Cambiar tema">
            <i
              className={`fa ${oscuro ? "fa-sun" : "fa-moon"}`}
              id="darkModeIcon"
              style={oscuro ? { color: "#f9a825", filter: "drop-shadow(0 0 4px #f9a825)" } : undefined}
            />
            <span id="darkModeLabel">{oscuro ? "Modo claro" : "Modo oscuro"}</span>
          </button>
          <button id="btnLogout" className="btn btn-light w-100 mb-2" onClick={clickLogout}>
            {invitado ? "Iniciar sesión" : "Cerrar sesión"}
          </button>
        </div>
      </aside>

      <main className={`main${colapsado ? " shifted" : ""}`} id="mainContent">
        {/* La clave reinicia el aviso de error al cambiar de pantalla */}
        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
        <Footer secciones={items} />
      </main>

      {confirmarSalida && (
        <div
          id="modalLogout"
          style={{
            display: "flex", position: "fixed", inset: 0, zIndex: 9998,
            background: "rgba(0,0,0,.5)", backdropFilter: "blur(3px)",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "var(--surface)", borderRadius: 18, padding: "2rem 2.25rem",
              width: "100%", maxWidth: 380, textAlign: "center",
              boxShadow: "0 20px 50px rgba(0,0,0,.35)", animation: "modalIn .2s ease",
            }}
          >
            <div
              style={{
                width: 56, height: 56, borderRadius: "50%", background: "var(--condado-light)",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem",
              }}
            >
              <i className="fa fa-sign-out-alt" style={{ fontSize: 22, color: "var(--condado)" }} />
            </div>
            <h5 style={{ fontFamily: "'Playfair Display',serif", color: "var(--condado)", marginBottom: ".4rem" }}>
              Cerrar sesión
            </h5>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: "1.5rem" }}>
              ¿Seguro que querés salir del sistema?
            </p>
            <div style={{ display: "flex", gap: ".75rem", justifyContent: "center" }}>
              <button
                className="btn btn-light"
                style={{ border: "1.5px solid var(--border)", padding: ".55rem 1.4rem" }}
                onClick={() => setConfirmarSalida(false)}
              >
                Cancelar
              </button>
              <button className="btn btn-condado" style={{ padding: ".55rem 1.4rem" }} onClick={salir}>
                <i className="fa fa-sign-out-alt me-2" />Sí, salir
              </button>
            </div>
          </div>
        </div>
      )}

      {saliendo && <Splash modo="salida" onFin={finSalida} />}

      <Chatbot />
      <ToastStack />
      <ConfirmDialog />
    </>
  );
}

export default MainLayout;
