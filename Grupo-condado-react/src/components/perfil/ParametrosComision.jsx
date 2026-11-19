import { useEffect, useState } from "react";
import { parametros } from "../../services/entidades";
import { useUI } from "../../context/uiContext";

const CAMPOS = [
  { clave: "COMISION_VENTA_COMPRADOR", label: "Venta, a cargo del comprador" },
  { clave: "COMISION_VENTA_VENDEDOR", label: "Venta, a cargo del vendedor" },
  { clave: "COMISION_ALQUILER", label: "Alquiler, sobre el total del contrato" },
];

const enPorcentaje = (valor) => String(Math.round(Number(valor || 0) * 10000) / 100);

// Solo el Administrador. Los cambios valen para las operaciones nuevas: las comisiones ya registradas no cambian.
function ParametrosComision({ estiloTitulo }) {
  const { toast } = useUI();
  const [valores, setValores] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    parametros.listar()
      .then((lista) => setValores(Object.fromEntries(
        CAMPOS.map((c) => [c.clave, enPorcentaje(lista.find((p) => p.Clave === c.clave)?.Valor)])
      )))
      .catch((e) => setError(e.message));
  }, []);

  async function guardar() {
    const lista = CAMPOS.map((c) => ({ Clave: c.clave, Valor: Number(valores[c.clave]) / 100 }));
    if (lista.some((p) => valores[p.Clave] === "" || !Number.isFinite(p.Valor) || p.Valor < 0 || p.Valor >= 1)) {
      toast("❌ Cada porcentaje tiene que estar entre 0 y 100", "error");
      return;
    }
    setGuardando(true);
    try {
      await parametros.guardar(lista);
      toast("✅ Porcentajes de comisión actualizados", "ok");
    } catch (e) {
      toast("❌ " + e.message, "error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="card-ghost fade-in-delay-1">
      <h6 style={estiloTitulo}><i className="fa fa-percent me-2" />Porcentajes de comisión</h6>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Política de los socios. Cada comisión guarda el porcentaje con el que se calculó, así que un cambio no modifica las ya registradas.
      </p>
      {error && <div className="error-banner mb-2"><span><i className="fa fa-exclamation-triangle me-2" />{error}</span></div>}
      {valores && (
        <div className="row g-3">
          {CAMPOS.map((c) => (
            <div className="col-md-4" key={c.clave}>
              <label className="form-label">{c.label} (%)</label>
              <input
                id={`param_${c.clave}`}
                type="number" min="0" max="99.99" step="0.01" className="form-control"
                value={valores[c.clave]}
                onChange={(e) => setValores({ ...valores, [c.clave]: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}
      <div className="text-end mt-3">
        <button id="btnGuardarComisiones" type="button" className="btn btn-condado" onClick={guardar} disabled={!valores || guardando}>
          <i className="fa fa-save me-2" />Guardar porcentajes
        </button>
      </div>
    </div>
  );
}

export default ParametrosComision;
