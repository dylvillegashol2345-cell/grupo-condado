import PropertyCard from "./PropertyCard";
import EmptyState from "../common/EmptyState";
import { SkeletonCards } from "../common/Loader";

function PropertyGrid({ propiedades, cargando, renderAcciones, vacio, id, esFavorito, onFavorito, enComparador, onComparar }) {
  if (cargando) return <SkeletonCards cantidad={3} />;

  if (!propiedades.length) {
    return (
      vacio || (
        <EmptyState
          icono="fa-home"
          titulo="Sin propiedades"
          descripcion="No hay propiedades que coincidan con la búsqueda."
        />
      )
    );
  }

  return (
    <div className="grid-propiedades" id={id}>
      {propiedades.map((p) => (
        <PropertyCard
          key={p.id}
          propiedad={p}
          acciones={renderAcciones ? renderAcciones(p) : null}
          favorito={esFavorito ? esFavorito(p.id) : false}
          onFavorito={onFavorito}
          comparando={enComparador ? enComparador(p.id) : false}
          onComparar={onComparar}
        />
      ))}
    </div>
  );
}

export default PropertyGrid;
