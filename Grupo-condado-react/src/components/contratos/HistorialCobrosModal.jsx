import Modal from "../common/Modal";
import { useCarga } from "../../hooks/useCarga";
import { pagos as pagosApi } from "../../services/entidades";

function HistorialCobrosModal({ contrato, onCerrar }) {
  const { datos, cargando, error } = useCarga(() => pagosApi.listar(), [contrato.IdContrato]);
  const signo = contrato.Moneda === "USD" ? "USD " : "$";
  const fmt = (n) => signo + Number(n || 0).toLocaleString("es-AR");

  const cobros = (datos || [])
    .filter((p) => Number(p.IdContrato) === Number(contrato.IdContrato))
    .sort((a, b) => new Date(b.Fecha || 0) - new Date(a.Fecha || 0));
  const total = cobros.reduce((s, p) => s + Number(p.Monto || 0), 0);

  let contenido;
  if (cargando) {
    contenido = (
      <div className="d-flex justify-content-center p-4">
        <i className="fa fa-spinner fa-spin fa-2x" style={{ color: "#6c2d20" }} />
      </div>
    );
  } else if (error) {
    contenido = <p className="text-danger p-3">Error al cargar los cobros.</p>;
  } else if (!cobros.length) {
    contenido = (
      <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
        <i className="fa fa-receipt fa-3x" style={{ opacity: 0.2, display: "block", marginBottom: "1rem" }} />
        <strong>Sin cobros registrados</strong><br />
        <small>Este contrato aún no tiene pagos registrados.</small>
      </div>
    );
  } else {
    contenido = (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: ".75rem", marginBottom: "1rem" }}>
          <div style={{ background: "#e3f2fd", borderRadius: 10, padding: ".75rem", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1565c0" }}>{cobros.length}</div>
            <div style={{ fontSize: 11, color: "#666" }}>Cobro{cobros.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ background: "#e8f5e9", borderRadius: 10, padding: ".75rem", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#2e7d32" }}>{fmt(total)}</div>
            <div style={{ fontSize: 11, color: "#666" }}>Total pagado</div>
          </div>
          <div style={{ background: "#f5f0ee", borderRadius: 10, padding: ".75rem", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#6c2d20" }}>{fmt(Math.round(total / cobros.length))}</div>
            <div style={{ fontSize: 11, color: "#666" }}>Promedio</div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: ".75rem" }}>
          <i className="fa fa-map-marker-alt me-1" />{contrato.InmuebleDireccion || "Inmueble"}
        </p>
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {cobros.map((p, i) => (
            <div key={p.IdPago} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: ".65rem .85rem", background: i % 2 === 0 ? "var(--surface-2)" : "var(--surface)",
              borderRadius: 8, marginBottom: ".35rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                <div style={{
                  width: 32, height: 32, background: "#e3f2fd", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <i className="fa fa-check" style={{ color: "#1565c0", fontSize: 12 }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    {p.Fecha ? new Date(p.Fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Cobro registrado</div>
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#2e7d32" }}>{fmt(p.Monto)}</div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <Modal
      abierto
      titulo={<><i className="fa fa-history me-2" style={{ color: "#1565c0" }} />Historial de cobros</>}
      onCerrar={onCerrar}
      ancho={700}
      pie={<button className="btn btn-light" onClick={onCerrar}>Cerrar</button>}
    >
      {contenido}
    </Modal>
  );
}

export default HistorialCobrosModal;
