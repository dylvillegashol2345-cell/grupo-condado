import { useState } from "react";
import Modal from "../common/Modal";
import { crearContactoEco } from "../../services/entidades";
import { useAuth } from "../../context/authContext";
import { useUI } from "../../context/uiContext";
import { telSinPrefijo } from "../../utils/format";
import { soloLetras, telefono } from "../../utils/restricciones";

function ContactoModal({ idItem, onCerrar, onEnviado }) {
  const { usuario } = useAuth();
  const { toast } = useUI();
  const [form, setForm] = useState(() => ({
    nombre: usuario?.Nombre || "",
    telefono: telSinPrefijo(usuario?.Telefono),
    mensaje: "",
  }));
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const nombreFijo = Boolean(usuario?.Nombre);
  const telefonoFijo = Boolean(usuario?.Telefono);
  const estiloFijo = { background: "var(--surface-2)", color: "var(--text-muted)" };

  async function enviar() {
    if (enviando) return;
    setError("");
    if (!form.nombre.trim()) { setError("Ingresá tu nombre"); return; }
    if (!/^\d{10,11}$/.test(form.telefono)) { setError("El teléfono debe tener 10 u 11 dígitos"); return; }
    if (!form.mensaje.trim()) { setError("Escribí un mensaje"); return; }

    setEnviando(true);
    try {
      await crearContactoEco({
        IdItem: Number(idItem),
        Nombre: form.nombre.trim(),
        Telefono: "+54" + form.telefono,
        Mensaje: form.mensaje.trim(),
        IdUsuarioRemitente: usuario ? usuario.IdUsuario : null,
      });
      onCerrar();
      toast("✅ Mensaje enviado. El publicador te va a contactar.", "ok");
      onEnviado?.();
    } catch {
      setError("Error al enviar. Volvé a intentarlo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal abierto titulo="Contactar al publicador" onCerrar={onCerrar} ancho={460}>
      <form className="row g-3" onSubmit={(e) => e.preventDefault()}>
        <div className="col-12">
          <label className="form-label">Tu nombre</label>
          <input
            className="form-control"
            placeholder="Nombre completo"
            value={form.nombre}
            readOnly={nombreFijo}
            style={nombreFijo ? estiloFijo : undefined}
            onChange={(e) => setForm({ ...form, nombre: soloLetras(e.target.value) })}
          />
        </div>

        <div className="col-12">
          <label className="form-label">Teléfono</label>
          <div className="input-group">
            <span
              className="input-group-text"
              style={{ background: "var(--condado)", color: "white", fontWeight: 700, border: "none" }}
            >
              +54
            </span>
            <input
              className="form-control"
              inputMode="numeric"
             
              placeholder="11 dígitos"
              value={form.telefono}
              readOnly={telefonoFijo}
              style={telefonoFijo ? estiloFijo : undefined}
              onChange={(e) => setForm({ ...form, telefono: telefono(e.target.value) })}
            />
          </div>
        </div>

        <div className="col-12">
          <label className="form-label">Mensaje</label>
          <textarea
            className="form-control"
            rows={3}
            value={form.mensaje}
            placeholder="¿Por qué te interesa? ¿Podés acordar un encuentro?"
            onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
          />
        </div>

        {error && <div className="col-12"><span className="alertaMsg alertaRoja">❌ {error}</span></div>}

        <div className="modal-edicion-footer">
          <button type="button" className="btn btn-light" onClick={onCerrar}>Cancelar</button>
          <button type="button" className="btn btn-condado" onClick={enviar} disabled={enviando}>
            {enviando
              ? <><i className="fa fa-spinner fa-spin me-1" />Guardando...</>
              : <><i className="fa fa-paper-plane me-1" />Enviar mensaje</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ContactoModal;
