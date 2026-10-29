import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/authContext";

function RutaProtegida({ seccion, children }) {
  const { autenticado, puede } = useAuth();
  const location = useLocation();

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }

  if (seccion && !puede(seccion)) {
    const destino = "/app/inicio";
    return <Navigate to={destino} replace />;
  }

  return children;
}

export default RutaProtegida;
