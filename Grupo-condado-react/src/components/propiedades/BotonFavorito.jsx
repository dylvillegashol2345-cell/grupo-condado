function BotonFavorito({ activo, onClick }) {
  return (
    <button
      type="button"
      className="btn-fav"
      title={activo ? "Quitar de favoritos" : "Agregar a favoritos"}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,.92)",
        border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center",
        justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.15)",
        fontSize: 15, zIndex: 5,
      }}
    >
      <i className="fa fa-heart" style={{ color: activo ? "#e53935" : "#ccc" }} />
    </button>
  );
}

export default BotonFavorito;
