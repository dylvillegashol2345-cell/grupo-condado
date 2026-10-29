import { useState } from "react";
import Modal from "../common/Modal";
import { ecoItems } from "../../services/entidades";
import { CATEGORIAS_ECOMARKET } from "../../utils/catalogos";
import { EXTS_IMAGEN, extensionValida, leerComoBase64 } from "../../utils/archivos";
import { monto } from "../../utils/restricciones";
import { useAuth } from "../../context/authContext";
import { useUI } from "../../context/uiContext";
import "./ecomarket.css";

const VACIO = { Titulo: "", Categoria: "Muebles", EsGratis: false, Precio: "", Descripcion: "" };

function PublicarItemModal({ onCerrar, onPublicado }) {
  const { usuario } = useAuth();
  const { toast } = useUI();
  const [form, setForm] = useState(VACIO);
  const [foto, setFoto] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  function set(clave, valor) {
    setForm((f) => ({ ...f, [clave]: valor }));
  }

  async function publicar() {
    if (guardando) return;
    if (!usuario) { toast("Necesitás iniciar sesión", "error"); return; }
    setError("");
    if (!form.Titulo.trim()) { setError("Ingresá un título"); return; }
    if (!form.Descripcion.trim()) { setError("Ingresá una descripción"); return; }
    const precio = Number(form.Precio) || 0;
    const esGratis = form.EsGratis || precio === 0;

    setGuardando(true);
    try {
      const imagen = await leerComoBase64(foto);
      await ecoItems.crear({
        IdUsuario: usuario.IdUsuario,
        Titulo: form.Titulo.trim(),
        Descripcion: form.Descripcion.trim(),
        Categoria: form.Categoria,
        Precio: esGratis ? null : precio,
        EsGratis: esGratis,
        Imagen: imagen || "",
      });
      onCerrar();
      toast("✅ Artículo publicado en EcoMarket", "ok");
      onPublicado();
    } catch {
      setError("Error al publicar. Volvé a intentarlo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal abierto titulo="Publicar artículo en EcoMarket" onCerrar={onCerrar} ancho={560}>
      <form className="row g-3" onSubmit={(e) => e.preventDefault()}>
        <div className="col-12">
          <label className="form-label">Título del artículo <span style={{ color: "var(--condado)" }}>*</span></label>
          <input
            className="form-control"
            value={form.Titulo}
            placeholder="Ej: Sillón de 3 cuerpos"
            onChange={(e) => set("Titulo", e.target.value)}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Categoría</label>
          <select className="form-select" value={form.Categoria} onChange={(e) => set("Categoria", e.target.value)}>
            {CATEGORIAS_ECOMARKET.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label">Precio</label>
          <div className="input-group">
            <span className="input-group-text">$</span>
            <input
              className="form-control"
              type="text"
              inputMode="decimal"
              disabled={form.EsGratis}
              value={form.EsGratis ? "" : form.Precio}
              placeholder={form.EsGratis ? "Gratis" : "0 = Gratis"}
              onChange={(e) => set("Precio", monto(e.target.value, true))}
            />
          </div>
          <label className="check-inline">
            <input
              type="checkbox"
              checked={form.EsGratis}
              onChange={(e) => set("EsGratis", e.target.checked)}
            />
            Lo regalo (gratis)
          </label>
        </div>

        <div className="col-12">
          <label className="form-label">Descripción</label>
          <textarea
            className="form-control"
            rows={3}
            value={form.Descripcion}
            placeholder="Describí el estado y características..."
            onChange={(e) => set("Descripcion", e.target.value)}
          />
        </div>

        <div className="col-12">
          <label className="form-label">Foto (opcional)</label>
          <input
            className="form-control"
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file && !extensionValida(file, EXTS_IMAGEN)) {
                toast(`❌ Archivo no permitido en "Foto EcoMarket". Solo se aceptan: ${EXTS_IMAGEN.join(", ").toUpperCase()}`, "error", 5000);
                e.target.value = "";
                setFoto(null);
                return;
              }
              setFoto(file || null);
            }}
          />
          {foto && <small className="ayuda">✅ {foto.name}</small>}
        </div>

        <div className="col-12">
          {error && <span className="alertaMsg alertaRoja">❌ {error}</span>}
        </div>

        <div className="modal-edicion-footer">
          <button type="button" className="btn btn-light" onClick={onCerrar}>Cancelar</button>
          <button type="button" className="btn btn-condado" onClick={publicar} disabled={guardando}>
            {guardando
              ? <><i className="fa fa-spinner fa-spin me-1" />Guardando...</>
              : <><i className="fa fa-leaf me-1" />Publicar</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default PublicarItemModal;
