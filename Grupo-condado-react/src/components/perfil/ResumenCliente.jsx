import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { operaciones, contratos, pagos, consultas } from "../../services/entidades";
import { useCarga } from "../../hooks/useCarga";
import { fechaCorta, fechaLocal, diasRestantes, numero } from "../../utils/format";

function ResumenCliente({ usuario }) {
  const navigate = useNavigate();

  const { datos, cargando, error } = useCarga(async () => {
    const [ops, cts, pgs, cons] = await Promise.all([
      operaciones.listar(), contratos.listar(), pagos.listar(), consultas.listar(),
    ]);
    return { ops, cts, pgs, cons };
  }, [usuario?.IdUsuario]);

  const resumen = useMemo(() => {
    if (!datos) return null;
    const misOps = datos.ops.filter((o) => Number(o.IdCliente) === Number(usuario.IdUsuario));
    const misContratos = [];
    misOps.forEach((op) => {
      datos.cts
        .filter((c) => Number(c.IdOperacion) === Number(op.IdOperacion))
        .forEach((c) => misContratos.push({ ...c, TipoOp: op.Tipo }));
    });
    const idsContratos = new Set(misContratos.map((c) => Number(c.IdContrato)));
    const misPagos = datos.pgs.filter((p) => idsContratos.has(Number(p.IdContrato)));
    const totalPagado = misPagos.reduce((a, p) => a + (Number(p.Monto) || 0), 0);
    const misCons = datos.cons.filter(
      (c) => c.Nombre && usuario.Nombre && c.Nombre.toLowerCase().includes(usuario.Nombre.toLowerCase())
    );
    const hoy = new Date();
    const vigentes = misContratos
      .filter((c) => c.FechaFin && new Date(c.FechaFin) >= hoy)
      .sort((a, b) => new Date(a.FechaFin) - new Date(b.FechaFin));
    return { misContratos, misPagos, totalPagado, misCons, vigentes, proximo: vigentes[0] || null };
  }, [datos, usuario]);

  if (cargando) {
    return (
      <div className="d-flex justify-content-center p-3">
        <i className="fa fa-spinner fa-spin" style={{ color: "var(--condado)", fontSize: "1.5rem" }} />
      </div>
    );
  }
  if (error || !resumen) return null;

  const { misContratos, misPagos, totalPagado, misCons, vigentes, proximo } = resumen;
  const hoy = new Date();

  return (
    <>
      <div className="perfil-stats-row">
        <div className="perfil-stat-card">
          <div className="perfil-stat-icon" style={{ background: "#e8f5e9", color: "#2e7d32" }}><i className="fa fa-file-contract" /></div>
          <div><strong>{misContratos.length}</strong><span>Contrato{misContratos.length !== 1 ? "s" : ""}</span></div>
        </div>
        <div className="perfil-stat-card">
          <div className="perfil-stat-icon" style={{ background: "#e3f2fd", color: "#1565c0" }}><i className="fa fa-money-bill" /></div>
          <div><strong>${numero(totalPagado)}</strong><span>Total pagado</span></div>
        </div>
        <div className="perfil-stat-card">
          <div className="perfil-stat-icon" style={{ background: "#fff3e0", color: "#e65100" }}><i className="fa fa-comments" /></div>
          <div><strong>{misCons.length}</strong><span>Consulta{misCons.length !== 1 ? "s" : ""}</span></div>
        </div>
        {proximo && (
          <div className="perfil-stat-card">
            <div className="perfil-stat-icon" style={{ background: "#fce4ec", color: "#c62828" }}><i className="fa fa-clock" /></div>
            <div><strong>{diasRestantes(proximo.FechaFin)} días</strong><span>Próx. vencimiento</span></div>
          </div>
        )}
      </div>

      {misContratos.length > 0 && (
        <div className="perfil-seccion">
          <h6 className="perfil-seccion-titulo"><i className="fa fa-file-contract me-2" />Mis contratos</h6>
          {vigentes.map((c) => {
            const inicio = new Date(c.FechaInicio);
            const fin = new Date(c.FechaFin);
            const pct = Math.min(100, Math.max(0, Math.round(((hoy - inicio) / (fin - inicio)) * 100)));
            const dias = diasRestantes(c.FechaFin);
            const color = dias < 30 ? "#c62828" : dias < 90 ? "#e65100" : "#2e7d32";
            return (
              <div className="perfil-contrato-card" key={c.IdContrato}>
                <div className="perfil-contrato-top">
                  <span className="perfil-contrato-tipo">{c.TipoOp || "Contrato"}</span>
                  <span className="perfil-contrato-dias" style={{ color }}>{dias} días restantes</span>
                </div>
                <div className="perfil-barra-wrap">
                  <div className="perfil-barra-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
                <div className="perfil-contrato-fechas">
                  <span>{fechaLocal(c.FechaInicio)}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{pct}% transcurrido</span>
                  <span>{fechaLocal(c.FechaFin)}</span>
                </div>
              </div>
            );
          })}
          {vigentes.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>No tenés contratos vigentes.</p>
          )}
        </div>
      )}

      {misPagos.length > 0 && (
        <div className="perfil-seccion">
          <h6 className="perfil-seccion-titulo"><i className="fa fa-money-bill me-2" />Últimos pagos</h6>
          <div className="perfil-pagos-lista">
            {misPagos.slice(-5).reverse().map((p) => (
              <div className="perfil-pago-row" key={p.IdPago}>
                <div className="perfil-pago-icon"><i className="fa fa-check-circle" /></div>
                <div className="perfil-pago-info">
                  <strong>${numero(p.Monto)}</strong>
                  <span>{fechaLocal(p.Fecha)}</span>
                </div>
                <div className="perfil-pago-badge">Acreditado</div>
              </div>
            ))}
          </div>
          <div className="perfil-total-row">
            <span>Total acumulado</span>
            <strong>${numero(totalPagado)}</strong>
          </div>
        </div>
      )}

      {misCons.length > 0 && (
        <div className="perfil-seccion">
          <h6 className="perfil-seccion-titulo"><i className="fa fa-comments me-2" />Consultas enviadas</h6>
          {misCons.slice(0, 3).map((c) => (
            <div className="perfil-consulta-item" key={c.IdConsulta}>
              <div className="perfil-consulta-fecha">{fechaCorta(c.Fecha)}</div>
              <div className="perfil-consulta-msg">{c.Mensaje || ""}</div>
              {c.PropiedadInteres && (
                <div className="perfil-consulta-prop"><i className="fa fa-home me-1" />{c.PropiedadInteres}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {misContratos.length === 0 && misCons.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
          <i className="fa fa-home fa-2x" style={{ display: "block", marginBottom: ".75rem" }} />
          Aún no tenés contratos ni consultas registradas.<br />
          <a
            href="#catalogo"
            onClick={(e) => { e.preventDefault(); navigate("/app/catalogo"); }}
            style={{ color: "var(--condado)", fontWeight: 600 }}
          >
            Ver propiedades disponibles →
          </a>
        </div>
      )}
    </>
  );
}

export default ResumenCliente;
