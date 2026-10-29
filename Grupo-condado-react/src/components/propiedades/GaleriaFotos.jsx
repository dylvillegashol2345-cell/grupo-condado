import { comprimirImagen } from "../../utils/archivos";
import { useUI } from "../../context/uiContext";

function GaleriaFotos({ fotos, onChange, onQuitarExistente }) {
  const { toast } = useUI();

  async function agregar(e) {
    const archivos = Array.from(e.target.files || []);
    e.target.value = "";
    const nuevas = [];
    for (const file of archivos) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast("Solo se aceptan JPG y PNG", "error");
        continue;
      }
      try {
        const base64 = await comprimirImagen(file, 1200, 0.75);
        nuevas.push({ base64, nombre: file.name, existente: false });
      } catch {
        toast(`No se pudo procesar ${file.name}`, "error");
      }
    }
    if (nuevas.length) onChange([...fotos, ...nuevas]);
  }

  async function quitar(idx) {
    const foto = fotos[idx];
    if (foto.existente && foto.idImagen && onQuitarExistente) {
      await onQuitarExistente(foto);
    }
    onChange(fotos.filter((_, i) => i !== idx));
  }

  return (
    <div id="galeriaFotosWrap">
      <div className="galeria-preview-grid">
        {fotos.map((f, i) => (
          <div className="galeria-item" key={f.idImagen ? `db-${f.idImagen}` : `new-${i}-${f.nombre}`}>
            <img src={f.base64} className="galeria-thumb" alt={f.nombre} />
            <button type="button" className="galeria-remove" onClick={() => quitar(i)} title="Eliminar">✕</button>
            <div className="galeria-nombre">{f.existente ? `📁 ${f.nombre}` : f.nombre}</div>
          </div>
        ))}
      </div>
      <label className="galeria-add-btn">
        <i className="fa fa-plus me-2" />Agregar foto
        <input type="file" accept=".jpg,.jpeg,.png" multiple style={{ display: "none" }} onChange={agregar} />
      </label>
    </div>
  );
}

export default GaleriaFotos;
