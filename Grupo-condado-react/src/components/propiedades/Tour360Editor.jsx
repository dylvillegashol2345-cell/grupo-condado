import { leerTour, guardarTour, quitarSala } from "../../utils/tour360";
import Tour360 from "./Tour360";

function Tour360Editor({ valor, onCambiar }) {
  const salas = leerTour(valor);
  const cambiar = (nuevas) => onCambiar(guardarTour(nuevas));
  const editar = (i, campo, texto) => cambiar(salas.map((s, j) => (j === i ? { ...s, [campo]: texto } : s)));

  return (
    <div>
      {salas.map((s, i) => (
        <div className="d-flex gap-2 mb-2" key={i}>
          <input
            className="form-control"
            style={{ maxWidth: 170 }}
            placeholder={salas.length > 1 ? `Ambiente ${i + 1}` : "Nombre (opcional)"}
            value={s.nombre}
            onChange={(e) => editar(i, "nombre", e.target.value)}
          />
          <input
            className="form-control"
            placeholder="/img/tours/casa1.jpeg  o  https://..."
            list="toursDisponibles"
            value={s.imagen}
            onChange={(e) => editar(i, "imagen", e.target.value.trim())}
          />
          <button type="button" className="btn btn-light" title="Quitar ambiente" onClick={() => cambiar(quitarSala(salas, i))}>
            <i className="fa fa-trash text-danger" />
          </button>
        </div>
      ))}
      <datalist id="toursDisponibles">
        <option value="/img/tours/casa1.jpeg">Casa 1 (panorámica)</option>
        <option value="/img/tours/casa2.jpeg">Casa 2 (panorámica)</option>
      </datalist>

      <button
        type="button"
        className="btn btn-sm btn-light border"
        onClick={() => cambiar([...salas, { nombre: "", imagen: "", puertas: [] }])}
      >
        <i className="fa fa-plus me-1" />Agregar ambiente
      </button>
      <small className="text-muted d-block mt-1" style={{ fontSize: 11 }}>
        Cada ambiente lleva una foto esférica 2:1 o una panorámica del celular. Con dos o más,
        abajo ubicás las puertas para pasar de uno a otro. Sin ambientes, la propiedad no muestra el recorrido.
      </small>

      {salas.some((s) => s.imagen) && (
        <div className="mt-2">
          <Tour360 valor={valor} onCambiar={onCambiar} />
        </div>
      )}
    </div>
  );
}

export default Tour360Editor;
