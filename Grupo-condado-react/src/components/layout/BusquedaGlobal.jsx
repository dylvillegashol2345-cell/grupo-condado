import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { propiedades, clientes, propietarios } from "../../services/entidades";
import { precio } from "../../utils/format";
import { formatDireccion } from "../../utils/contratos";

function BusquedaGlobal() {
  const navigate = useNavigate();
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  function buscar(valor) {
    setTexto(valor);
    clearTimeout(timer.current);
    if (!valor || valor.length < 2) {
      setResultados(null);
      return;
    }
    setResultados("buscando");
    timer.current = setTimeout(async () => {
      try {
        const term = valor.toLowerCase();
        const [props, clis, duenios] = await Promise.all([
          propiedades.listar(),
          clientes.listar(),
          propietarios.listar(),
        ]);

        const propsF = props.filter((p) =>
          (p.Barrio || "").toLowerCase().includes(term) ||
          (p.Calle || "").toLowerCase().includes(term) ||
          String(p.Precio || "").includes(term)
        ).slice(0, 4);

        const clisF = clis.filter((c) =>
          (c.Nombre || "").toLowerCase().includes(term) ||
          (c.Apellido || "").toLowerCase().includes(term) ||
          String(c.DNI || "").includes(term)
        ).slice(0, 3);

        const dueniosF = duenios.filter((p) =>
          (p.Nombre || "").toLowerCase().includes(term) ||
          (p.Apellido || "").toLowerCase().includes(term) ||
          String(p.DNI || "").includes(term)
        ).slice(0, 3);

        setResultados({ propsF, clisF, dueniosF });
      } catch {
        setResultados(null);
      }
    }, 350);
  }

  function irPropiedad(id) {
    setTexto("");
    setResultados(null);
    navigate(`/app/propiedades/${id}`);
  }

  function irSeccion(destino) {
    setTexto("");
    navigate(destino);
  }

  const g = resultados && resultados !== "buscando" ? resultados : null;
  const sinResultados = g && !g.propsF.length && !g.clisF.length && !g.dueniosF.length;

  return (
    <div className="sidebar-search-wrap" id="sidebarBusquedaGlobal">
      <div className="sidebar-search-input-wrap">
        <i className="fa fa-search" />
        <input
          type="text"
          id="sidebarBusquedaInput"
          placeholder="Buscar en todo..."
          value={texto}
          autoComplete="off"
          onChange={(e) => buscar(e.target.value)}
        />
      </div>

      <div id="sidebarBusquedaResultados">
        {resultados === "buscando" && (
          <div style={{ padding: ".5rem", fontSize: 12, color: "var(--text-muted)" }}>
            <i className="fa fa-spinner fa-spin me-1" />Buscando...
          </div>
        )}

        {g && g.propsF.length > 0 && (
          <div className="sbusq-grupo">
            <div className="sbusq-grupo-titulo"><i className="fa fa-home me-1" />Propiedades</div>
            {g.propsF.map((p) => (
              <div className="sbusq-item" key={p.IdPropiedad} onClick={() => irPropiedad(p.IdPropiedad)}>
                <strong>{formatDireccion(p)}</strong>
                <span>{precio(p.Precio, p.Moneda)} · {p.Estado || ""}</span>
              </div>
            ))}
          </div>
        )}

        {g && g.clisF.length > 0 && (
          <div className="sbusq-grupo">
            <div className="sbusq-grupo-titulo"><i className="fa fa-users me-1" />Clientes</div>
            {g.clisF.map((c) => (
              <div className="sbusq-item" key={c.IdCliente} onClick={() => irSeccion("/app/clientes")}>
                <strong>{c.Apellido || ""} {c.Nombre || ""}</strong>
                <span>{c.Telefono || ""}</span>
              </div>
            ))}
          </div>
        )}

        {g && g.dueniosF.length > 0 && (
          <div className="sbusq-grupo">
            <div className="sbusq-grupo-titulo"><i className="fa fa-user me-1" />Propietarios</div>
            {g.dueniosF.map((p) => (
              <div className="sbusq-item" key={p.IdPropietario} onClick={() => irSeccion("/app/propietarios")}>
                <strong>{p.Apellido || ""} {p.Nombre || ""}</strong>
                <span>DNI {p.DNI || ""}</span>
              </div>
            ))}
          </div>
        )}

        {sinResultados && (
          <div style={{ padding: ".75rem", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
            Sin resultados
          </div>
        )}
      </div>
    </div>
  );
}

export default BusquedaGlobal;
