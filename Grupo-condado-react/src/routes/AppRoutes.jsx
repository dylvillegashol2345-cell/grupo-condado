import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../components/layout/MainLayout";
import RutaProtegida from "../components/layout/RutaProtegida";

import Login from "../pages/Login";
import Inicio from "../pages/Inicio";
import Dashboard from "../pages/Dashboard";
import Catalogo from "../pages/Catalogo";
import Propiedades from "../pages/Propiedades";
import PropertyDetail from "../pages/PropertyDetail";
import Propietarios from "../pages/Propietarios";
import Clientes from "../pages/Clientes";
import Operaciones from "../pages/Operaciones";
import Contratos from "../pages/Contratos";
import Pagos from "../pages/Pagos";
import Consultas from "../pages/Consultas";
import Citas from "../pages/Citas";
import Consulta from "../pages/Consulta";
import EcoMarket from "../pages/EcoMarket";
import EcoMarketDetalle from "../pages/EcoMarketDetalle";
import EcoMarketMisPublicaciones from "../pages/EcoMarketMisPublicaciones";
import EcoMarketMensajes from "../pages/EcoMarketMensajes";
import Usuarios from "../pages/Usuarios";
import Perfil from "../pages/Perfil";
import Ambiental from "../pages/Ambiental";

function protegida(seccion, elemento) {
  return <RutaProtegida seccion={seccion}>{elemento}</RutaProtegida>;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />

        <Route
          path="/app"
          element={
            <RutaProtegida>
              <MainLayout />
            </RutaProtegida>
          }
        >
          <Route index element={<Navigate to="/app/inicio" replace />} />

          <Route path="inicio"        element={protegida("inicio", <Inicio />)} />
          <Route path="dashboard"     element={protegida("dashboard", <Dashboard />)} />
          <Route path="catalogo"      element={protegida("catalogo", <Catalogo />)} />
          <Route path="propiedades"   element={protegida("propiedades", <Propiedades />)} />
          <Route path="propiedades/:id" element={protegida(["catalogo", "propiedades"], <PropertyDetail />)} />
          <Route path="propietarios"  element={protegida("propietarios", <Propietarios />)} />
          <Route path="clientes"      element={protegida("clientes", <Clientes />)} />
          <Route path="operaciones"   element={protegida("operaciones", <Operaciones />)} />
          <Route path="contratos"     element={protegida("contratos", <Contratos />)} />
          <Route path="pagos"         element={protegida("pagos", <Pagos />)} />
          <Route path="consultas"     element={protegida("consultas", <Consultas />)} />
          <Route path="citas"         element={protegida("citas", <Citas />)} />
          <Route path="consulta"      element={protegida("consulta", <Consulta />)} />
          <Route path="ecomarket"     element={protegida("ecomarket", <EcoMarket />)} />
          <Route path="ecomarket/mis-publicaciones" element={protegida("ecomarket", <EcoMarketMisPublicaciones />)} />
          <Route path="ecomarket/mensajes" element={protegida("ecomarket", <EcoMarketMensajes />)} />
          <Route path="ecomarket/:id" element={protegida("ecomarket", <EcoMarketDetalle />)} />
          <Route path="usuarios"      element={protegida("usuarios", <Usuarios />)} />
          <Route path="ambiental"     element={protegida("ambiental", <Ambiental />)} />
          <Route path="perfil"        element={protegida("perfil", <Perfil />)} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
