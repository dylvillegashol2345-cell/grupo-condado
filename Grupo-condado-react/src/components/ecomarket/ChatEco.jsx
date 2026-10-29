import { useCallback, useEffect, useRef, useState } from "react";
import { mensajesDeConversacion, enviarMensajeEco, marcarMensajesLeidos } from "../../services/entidades";
import { fechaCorta } from "../../utils/format";

function ChatEco({ idContacto, idUsuario, contacto, placeholder = "Escribí tu mensaje...", bandeja = false, onEnviado }) {
  const [mensajes, setMensajes] = useState(null);
  const [error, setError] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const lista = useRef(null);

  const cargar = useCallback(async () => {
    try {
      const data = await mensajesDeConversacion(idContacto);
      setMensajes(data);
      setError(false);
      marcarMensajesLeidos(idContacto, idUsuario).catch(() => {});
    } catch {
      setError(true);
    }
  }, [idContacto, idUsuario]);

  useEffect(() => {
    let cancelado = false;
    mensajesDeConversacion(idContacto)
      .then((data) => {
        if (cancelado) return;
        setMensajes(data);
        marcarMensajesLeidos(idContacto, idUsuario).catch(() => {});
      })
      .catch(() => { if (!cancelado) setError(true); });
    return () => { cancelado = true; };
  }, [idContacto, idUsuario]);

  useEffect(() => {
    if (lista.current) lista.current.scrollTop = lista.current.scrollHeight;
  }, [mensajes]);

  async function enviar() {
    const t = texto.trim();
    if (!t || enviando) return;
    setTexto("");
    setEnviando(true);
    try {
      await enviarMensajeEco({ IdContacto: idContacto, IdUsuario: idUsuario, Texto: t });
      await cargar();
      onEnviado?.();
    } catch { /* se ignora */ } finally {
      setEnviando(false);
    }
  }

  const inicialEsMio = contacto?.IdUsuarioRemitente && Number(contacto.IdUsuarioRemitente) === Number(idUsuario);
  const vacio = mensajes && mensajes.length === 0 && !contacto?.Mensaje;

  return (
    <div className="eco-chat-box" style={{ display: "flex" }}>
      <div className="eco-chat-messages" ref={lista}>
        {error ? (
          <p style={{ color: "red", fontSize: 12, padding: ".5rem" }}>
            {bandeja ? "Error" : "Error al cargar mensajes"}
          </p>
        ) : mensajes === null ? (
          <div className="eco-chat-loading"><i className="fa fa-spinner fa-spin" /></div>
        ) : vacio ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12, padding: bandeja ? ".75rem" : "1rem" }}>
            Sin mensajes aún
          </p>
        ) : (
          <>
            {contacto?.Mensaje && (
              <div className={`eco-msg ${inicialEsMio ? "eco-msg-yo" : "eco-msg-ellos"}`}>
                <div className="eco-msg-burbuja">{contacto.Mensaje}</div>
                <div className="eco-msg-meta">
                  {contacto.Nombre || (bandeja ? "" : "Usuario")} · {fechaCorta(contacto.Fecha)}{" "}
                  <em style={{ fontSize: 10, opacity: bandeja ? 0.6 : 0.7 }}>(mensaje inicial)</em>
                </div>
              </div>
            )}
            {mensajes.map((m) => {
              const mio = Number(m.IdUsuario) === Number(idUsuario);
              return (
                <div key={m.IdMensaje} className={`eco-msg ${mio ? "eco-msg-yo" : "eco-msg-ellos"}`}>
                  <div className="eco-msg-burbuja">{m.Texto}</div>
                  <div className="eco-msg-meta">{m.NombreUsuario} · {fechaCorta(m.Fecha)}</div>
                </div>
              );
            })}
          </>
        )}
      </div>
      <div className="eco-chat-input-row">
        <input
          type="text"
          className="eco-chat-input"
          placeholder={placeholder}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") enviar(); }}
        />
        <button className="eco-chat-send" onClick={enviar} disabled={enviando}>
          <i className="fa fa-paper-plane" />
        </button>
      </div>
    </div>
  );
}

export default ChatEco;
