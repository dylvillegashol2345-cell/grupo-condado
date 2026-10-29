import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { useUI } from "../../context/uiContext";
import { contarNotificaciones, itemsPanel, novedades } from "../../utils/notificaciones";

const CLAVE_VISTAS = "notifVistas";

function leerVistas() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(CLAVE_VISTAS) || "[]"));
  } catch {
    return new Set();
  }
}

function guardarVistas(set) {
  sessionStorage.setItem(CLAVE_VISTAS, JSON.stringify([...set]));
}

function Notificaciones() {
  const { usuario, rol } = useAuth();
  const { toast } = useUI();
  const navigate = useNavigate();
  const [items, setItems]       = useState([]);
  const [visible, setVisible]   = useState(false);
  const [abierto, setAbierto]   = useState(false);
  const [vistas, setVistas]     = useState(leerVistas);
  const [saliendo, setSaliendo] = useState(() => new Set());
  const panel = useRef(null);

  const previos = useRef({});

  const marcarVista = useCallback((clave) => {
    setVistas((prev) => {
      const next = new Set(prev);
      next.add(clave);
      guardarVistas(next);
      return next;
    });
    setSaliendo((prev) => new Set(prev).add(clave));
    setTimeout(() => {
      setSaliendo((prev) => {
        const next = new Set(prev);
        next.delete(clave);
        return next;
      });
    }, 200);
  }, []);

  const avisar = useRef(() => {});
  useEffect(() => {
    avisar.current = (nuevas) => {
      nuevas.forEach((n, i) => {
        setTimeout(() => {
          toast(n.titulo, "info", 6000, {
            desc: n.desc,
            icono: n.icono,
            color: n.color,
            onClick: () => navigate(n.destino),
          });
        }, i * 1000);
      });
      setVistas((prev) => {
        const next = new Set(prev);
        nuevas.forEach((n) => next.delete(n.clave));
        guardarVistas(next);
        return next;
      });
    };
  });

  useEffect(() => {
    if (!usuario) return undefined;
    let cancelado = false;
    let ivSondeo = null;
    previos.current = {};

    async function sondear() {
      const conteos = await contarNotificaciones({ usuario, rol });
      if (cancelado) return null;
      const nuevas = novedades(conteos, previos.current);
      previos.current = { ...previos.current, ...conteos };
      if (nuevas.length) {
        avisar.current(nuevas);
        setItems(itemsPanel(conteos));
      }
      return conteos;
    }

    const tPanel = setTimeout(async () => {
      setVisible(true);
      const conteos = await contarNotificaciones({ usuario, rol });
      if (!cancelado) setItems(itemsPanel(conteos));
    }, 800);

    const tSondeo = setTimeout(() => {
      sondear();
      ivSondeo = setInterval(sondear, 30 * 1000);
    }, 3000);

    const ivPanel = setInterval(async () => {
      const conteos = await sondear();
      if (conteos) setItems(itemsPanel(conteos));
    }, 2 * 60 * 1000);

    return () => {
      cancelado = true;
      clearTimeout(tPanel);
      clearTimeout(tSondeo);
      clearInterval(ivSondeo);
      clearInterval(ivPanel);
    };
  }, [usuario, rol]);

  useEffect(() => {
    function onClickFuera(e) {
      if (panel.current && !panel.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener("click", onClickFuera);
    return () => document.removeEventListener("click", onClickFuera);
  }, []);

  if (!usuario) return null;

  const pendientes = items.filter((n) => !vistas.has(n.clave));
  const enLista = items.filter((n) => !vistas.has(n.clave) || saliendo.has(n.clave));

  return (
    <div id="notifPanel" ref={panel} style={{ display: visible ? "block" : "none", margin: ".75rem 0 .25rem" }}>
      <button
        id="btnNotif"
        onClick={() => setAbierto((v) => !v)}
        style={{
          width: "100%", background: "rgba(255,255,255,.08)",
          border: "1px solid rgba(255,255,255,.12)", borderRadius: 10,
          padding: ".5rem .75rem", color: "white", fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", gap: ".5rem", textAlign: "left",
          transition: "background .15s",
        }}
      >
        <i className="fa fa-bell" />
        <span>Notificaciones</span>
        <span id="notifBadge" style={{
          display: pendientes.length > 0 ? "inline-flex" : "none",
          background: "#c62828", color: "white", fontSize: 10, fontWeight: 700,
          padding: ".15em .5em", borderRadius: 10, marginLeft: "auto",
        }}>
          {pendientes.length}
        </span>
      </button>

      <div id="notifDropdown" style={{
        display: abierto ? "block" : "none",
        background: "var(--surface)", borderRadius: 10, marginTop: ".4rem",
        border: "1px solid var(--border)", overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,.15)",
      }}>
        <div id="notifLista" style={{ maxHeight: 280, overflowY: "auto" }}>
          {pendientes.length === 0 ? (
            <div style={{ padding: "1.25rem 1rem", textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
              <i className="fa fa-check-circle me-1" style={{ color: "#2e7d32", fontSize: 18, display: "block", marginBottom: ".5rem" }} />
              Todo al día, sin notificaciones pendientes
            </div>
          ) : (
            enLista.map((n) => (
              <div
                className="notif-item"
                id={`notif-${n.clave}`}
                key={n.clave}
                style={saliendo.has(n.clave) ? { opacity: 0, transform: "translateX(20px)" } : undefined}
              >
                <div className="notif-icon" style={{ background: `${n.color}20`, color: n.color }}>
                  <i className={`fa ${n.icono}`} />
                </div>
                <div
                  className="notif-texto"
                  style={{ flex: 1, cursor: "pointer" }}
                  onClick={() => { navigate(n.destino); marcarVista(n.clave); setAbierto(false); }}
                >
                  <strong>{n.titulo}</strong>
                  <small>{n.desc}</small>
                </div>
                <button
                  className="notif-dismiss"
                  onClick={() => marcarVista(n.clave)}
                  title="Marcar como vista"
                >
                  <i className="fa fa-times" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Notificaciones;
