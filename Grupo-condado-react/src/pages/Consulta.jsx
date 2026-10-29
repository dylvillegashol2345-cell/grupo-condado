import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { consultas } from "../services/entidades";
import { useAuth } from "../context/authContext";
import { useUI } from "../context/uiContext";
import { validarConsulta } from "../utils/validaciones";
import { telSinPrefijo } from "../utils/format";
import { soloLetras, telefono } from "../utils/restricciones";

const CLAVE_LIMITE = "consultasHoy";
const MAX_POR_DIA = 3;

function leerLimite() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_LIMITE) || '{"fecha":"","count":0}');
  } catch {
    return { fecha: "", count: 0 };
  }
}

function Consulta() {
  const { usuario } = useAuth();
  const { toast } = useUI();
  const [searchParams] = useSearchParams();
  const desdeDetalle = searchParams.get("desde") === "detalle";

  const [form, setForm] = useState({
    nombre: usuario?.Nombre || "",
    telefono: telSinPrefijo(usuario?.Telefono),
    propiedad: desdeDetalle ? searchParams.get("propiedad") || "" : "",
    mensaje: "",
  });
  const [mensajeUI, setMensajeUI] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const nombreFijo = Boolean(usuario?.Nombre);
  const propiedadFija = desdeDetalle && Boolean(form.propiedad);

  function set(clave, valor) {
    setForm((f) => ({ ...f, [clave]: valor }));
  }

  async function enviar(e) {
    e.preventDefault();
    clearTimeout(timer.current);

    const problema = validarConsulta(form);
    if (problema) { setMensajeUI({ tipo: "error", texto: problema }); return; }

    const hoy = new Date().toISOString().split("T")[0];
    const limite = leerLimite();
    if (limite.fecha === hoy && limite.count >= MAX_POR_DIA) {
      setMensajeUI({
        tipo: "error",
        texto: `Ya enviaste ${MAX_POR_DIA} consultas hoy. Podés volver a consultar mañana.`,
      });
      return;
    }

    setEnviando(true);
    try {
      await consultas.crear({
        Nombre: form.nombre.trim(),
        Telefono: "+54" + form.telefono,
        Mensaje: form.mensaje.trim(),
        PropiedadInteres: form.propiedad.trim() || null,
        Fecha: new Date().toISOString(),
      });

      localStorage.setItem(
        CLAVE_LIMITE,
        JSON.stringify({ fecha: hoy, count: limite.fecha === hoy ? limite.count + 1 : 1 })
      );

      setMensajeUI({ tipo: "ok", texto: "Consulta enviada. Te contactaremos pronto." });
      toast("Consulta enviada", "ok");
      setForm((f) => ({ ...f, propiedad: propiedadFija ? f.propiedad : "", mensaje: "" }));
      timer.current = setTimeout(() => setMensajeUI(null), 5000);
    } catch {
      setMensajeUI({ tipo: "error", texto: "Error al enviar. Verificá tu conexión y volvé a intentarlo." });
    } finally {
      setEnviando(false);
    }
  }

  const restantes = (() => {
    const hoy = new Date().toISOString().split("T")[0];
    const limite = leerLimite();
    return limite.fecha === hoy ? Math.max(0, MAX_POR_DIA - limite.count) : MAX_POR_DIA;
  })();

  return (
    <section className="card-ghost mt-3" id="consultaForm">
      <h5><i className="fa fa-envelope me-2" />Hacer una consulta</h5>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Te quedan {restantes} consulta{restantes !== 1 ? "s" : ""} disponible{restantes !== 1 ? "s" : ""} hoy
      </p>

      <form id="formConsulta" className="row g-3" onSubmit={enviar}>
        <div className="col-md-6">
          <label className="form-label">Nombre</label>
          <input
            id="consNombre"
            className="form-control"
            value={form.nombre}
            placeholder="Tu nombre"
            readOnly={nombreFijo}
            style={nombreFijo ? { background: "var(--surface-2)", color: "var(--text-muted)" } : undefined}
            onChange={(e) => set("nombre", soloLetras(e.target.value))}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Teléfono</label>
          <div className="input-group">
            <span className="input-group-text" style={{ background: "var(--condado)", color: "white", fontWeight: 700, border: "none" }}>+54</span>
            <input
              id="consTelefono"
              className="form-control"
              inputMode="numeric"
             
              placeholder="11 dígitos"
              value={form.telefono}
              onChange={(e) => set("telefono", telefono(e.target.value))}
            />
          </div>
        </div>

        <div className="col-md-12">
          <label className="form-label">Propiedad de interés</label>
          <input
            id="consPropInteres"
            className="form-control"
            value={form.propiedad}
            placeholder="Dirección o descripción de la propiedad"
            readOnly={propiedadFija}
            style={propiedadFija ? {
              background: "var(--condado-light)", borderColor: "var(--condado)",
              color: "var(--condado)", fontWeight: 600,
            } : undefined}
            onChange={(e) => set("propiedad", e.target.value)}
          />
        </div>

        <div className="col-md-12">
          <label className="form-label">Mensaje</label>
          <textarea
            id="consMensaje"
            className="form-control"
            rows={4}
            value={form.mensaje}
            placeholder="Tu consulta..."
            onChange={(e) => set("mensaje", e.target.value)}
          />
        </div>

        <div id="consultaFormMsg" className="col-12">
          {mensajeUI && (
            <span className={`alertaMsg ${mensajeUI.tipo === "ok" ? "alertaVerde" : "alertaRoja"}`}>
              {mensajeUI.tipo === "ok" ? "✅" : "❌"} {mensajeUI.texto}
            </span>
          )}
        </div>

        <div className="col-12 text-end">
          <button id="btnEnviarConsulta" className="btn btn-condado" type="submit" disabled={enviando || restantes === 0}>
            <i className="fa fa-paper-plane me-2" />Enviar consulta
          </button>
        </div>
      </form>
    </section>
  );
}

export default Consulta;
