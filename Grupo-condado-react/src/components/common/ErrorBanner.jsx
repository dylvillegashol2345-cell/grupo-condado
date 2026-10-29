function ErrorBanner({ mensaje, onReintentar }) {
  if (!mensaje) return null;
  return (
    <div className="error-banner">
      <span><i className="fa fa-exclamation-triangle me-2" />{mensaje}</span>
      {onReintentar && (
        <button className="btn btn-light btn-sm" onClick={onReintentar}>
          <i className="fa fa-sync me-1" />Reintentar
        </button>
      )}
    </div>
  );
}

export default ErrorBanner;
