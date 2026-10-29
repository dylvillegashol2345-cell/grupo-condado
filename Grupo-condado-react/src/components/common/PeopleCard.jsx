function PeopleCard({ iniciales, nombre, filas, color, onEditar, onEliminar, extra, idCard, tituloEditar, tituloEliminar }) {
  return (
    <div className="people-card fade-in" id={idCard}>
      <div className="people-card-header" style={{ background: `linear-gradient(135deg,${color}22,${color}11)` }}>
        <div className="people-card-avatar" style={{ background: color }}>{iniciales}</div>
      </div>
      <div className="people-card-body">
        <h4 className="people-card-name">{nombre}</h4>
        <div className="people-card-info">
          {filas.filter((f) => f && f.texto).map((f, i) => (
            <span key={i}><i className={`fa ${f.icono} me-1`} />{f.texto}</span>
          ))}
        </div>
        {extra}
      </div>
      <div className="people-card-footer">
        <button className="people-card-btn-edit" onClick={onEditar} title={tituloEditar}>
          <i className="fa fa-pen me-1" />Editar
        </button>
        <button className="people-card-btn-del" onClick={onEliminar} title={tituloEliminar}>
          <i className="fa fa-trash" />
        </button>
      </div>
    </div>
  );
}

export default PeopleCard;
