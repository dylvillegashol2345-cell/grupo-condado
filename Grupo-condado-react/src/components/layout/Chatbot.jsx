import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { propiedades, operaciones } from "../../services/entidades";
import { useAuth } from "../../context/authContext";
import { generarRespuesta, enriquecerConContexto, renderMarkdownBasico } from "../../utils/chatbot";

const DESTINOS = {
  catalogo:  "/app/catalogo",
  ecomarket: "/app/ecomarket",
  consulta:  "/app/consulta",
};

function Chatbot() {
  const navigate = useNavigate();
  const { usuario, puede } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [chips, setChips] = useState([]);
  const [escribiendo, setEscribiendo] = useState(0);
  const [texto, setTexto] = useState("");
  const [badge, setBadge] = useState(false);
  const datos = useRef(null);
  const historial = useRef([]);
  const listaRef = useRef(null);

  const abiertoRef = useRef(false);
  useEffect(() => { abiertoRef.current = abierto; }, [abierto]);
  useEffect(() => {
    const t = setTimeout(() => { if (!abiertoRef.current) setBadge(true); }, 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (listaRef.current) listaRef.current.scrollTop = listaRef.current.scrollHeight;
  }, [mensajes, escribiendo]);

  const cargarDatos = useCallback(async () => {
    if (datos.current) return datos.current;
    try {
      const [props, ops] = await Promise.all([propiedades.listar(), operaciones.listar()]);
      datos.current = { props: Array.isArray(props) ? props : [], ops: Array.isArray(ops) ? ops : [] };
      return datos.current;
    } catch {
      return { props: [], ops: [] };
    }
  }, []);

  const responder = useCallback(async (pregunta) => {
    const enriquecida = enriquecerConContexto(pregunta, historial.current);
    setMensajes((m) => [...m, { tipo: "usuario", texto: pregunta }]);
    setChips([]);
    setEscribiendo((n) => n + 1);

    // Simular delay de respuesta natural
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
    setEscribiendo((n) => n - 1);
    const d = await cargarDatos();
    const resp = generarRespuesta(enriquecida, d, usuario?.Nombre || usuario?.NombreUsuario || "");

    historial.current.push({ pregunta, respuesta: resp.texto.slice(0, 100) });
    if (historial.current.length > 6) historial.current.shift();

    setMensajes((m) => [...m, { tipo: "bot", texto: resp.texto }]);
    setChips(resp.chips || []);
    setTexto("");
  }, [cargarDatos, usuario]);

  function alternar() {
    const siguiente = !abierto;
    setAbierto(siguiente);
    setBadge(false);
    if (siguiente && mensajes.length === 0) responder("hola");
  }

  function reiniciar() {
    setMensajes([]);
    setChips([]);
    setTexto("");
    historial.current = [];
    datos.current = null;
    responder("hola");
  }

  function enviar() {
    const t = texto.trim();
    if (!t) return;
    responder(t);
  }

  function clickChip(c) {
    if (c.accion) {
      setAbierto(false);
      const catalogo = puede("catalogo") ? "/app/catalogo" : "/app/propiedades";
      navigate(c.accion === "catalogo" ? catalogo : DESTINOS[c.accion] || catalogo);
    } else if (c.msg) {
      responder(c.msg);
    }
  }

  return (
    <>
      <div id="chatbotBurbuja" onClick={alternar} title="Asistente virtual">
        <i className={`fa ${abierto ? "fa-times" : "fa-comment-dots"}`} id="chatbotIcon" />
        {badge && !abierto && <span id="chatbotBadge" style={{ display: "flex" }}>1</span>}
      </div>

      {abierto && (
        <div id="chatbotPanel" style={{ display: "flex" }}>
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar-header"><i className="fa fa-home" /></div>
              <div>
                <strong>Valentina · Asistente Virtual</strong>
                <span>🟢 En línea · Grupo Condado</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
              <button
                onClick={reiniciar}
                title="Reiniciar conversación"
                style={{
                  background: "rgba(255,255,255,.15)", border: "none", color: "white",
                  width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 12,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background .15s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,.3)"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,.15)"; }}
              >
                <i className="fa fa-redo-alt" />
              </button>
              <button onClick={alternar} className="chatbot-close">&times;</button>
            </div>
          </div>

          <div className="chatbot-messages" id="chatbotMessages" ref={listaRef}>
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`chatbot-msg chatbot-msg-${m.tipo}`}
                dangerouslySetInnerHTML={{ __html: renderMarkdownBasico(m.texto) }}
              />
            ))}
            {escribiendo > 0 && (
              <div className="chatbot-msg chatbot-msg-bot chatbot-typing" id="chatbotTyping">
                <span /><span /><span />
              </div>
            )}
          </div>

          <div className="chatbot-chips" id="chatbotChips">
            {chips.map((c, i) => (
              <button key={i} className="chatbot-chip" onClick={() => clickChip(c)}>{c.label}</button>
            ))}
          </div>

          <div className="chatbot-input-row">
            <input
              type="text"
              id="chatbotInput"
              className="chatbot-input"
              placeholder="Escribí tu pregunta..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") enviar(); }}
            />
            <button className="chatbot-send" onClick={enviar}>
              <i className="fa fa-paper-plane" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;
