function EmptyState({ icono = "fa-inbox", titulo, descripcion, accion }) {
  return (
    <div className="empty-state">
      <i className={`fa ${icono}`} />
      <h6>{titulo}</h6>
      {descripcion && <p>{descripcion}</p>}
      {accion}
    </div>
  );
}

export default EmptyState;
