
export function Spinner({ texto = "Cargando..." }) {
  return (
    <div className="loader">
      <i className="fa fa-spinner fa-spin" style={{ color: "var(--condado)", fontSize: 20 }} />
      <span>{texto}</span>
    </div>
  );
}

export function SkeletonCards({ cantidad = 3 }) {
  return (
    <div className="grid-propiedades">
      {Array.from({ length: cantidad }, (_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton skeleton-img" />
          <div style={{ padding: "1rem" }}>
            <div className="skeleton skeleton-line w-60" />
            <div className="skeleton skeleton-line w-40" />
            <div className="skeleton skeleton-line w-80" />
            <div className="skeleton skeleton-btn" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonFilas({ columnas = 5, filas = 4 }) {
  return Array.from({ length: filas }, (_, f) => (
    <tr key={f}>
      {Array.from({ length: columnas }, (_, c) => (
        <td key={c}><div className="skeleton skeleton-line" /></td>
      ))}
    </tr>
  ));
}
