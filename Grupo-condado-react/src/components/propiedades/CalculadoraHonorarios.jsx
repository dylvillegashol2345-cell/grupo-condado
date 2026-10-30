import { calcularHonorarios } from "../../utils/honorarios";
import { importe } from "../../utils/cotizacion";
import { entero, monto } from "../../utils/restricciones";

function CalculadoraHonorarios({ precio, moneda, valores, onCambiar, dolar }) {
  const h = calcularHonorarios(precio, valores);
  const set = (campo, v) => onCambiar({ ...valores, [campo]: v });
  const alquiler = valores.operacion === "Alquiler";
  const monedaBase = alquiler ? "ARS" : moneda;
  const enPesos = monedaBase === "USD" && dolar && h.total > 0;

  return (
    <div className="calc-cuotas">
      <div className="calc-cuotas-datos">
        <label>
          Operación
          <div className="calc-cuotas-input">
            <select value={valores.operacion} onChange={(e) => set("operacion", e.target.value)}>
              <option value="Venta">Venta</option>
              <option value="Alquiler">Alquiler</option>
            </select>
          </div>
          <small>Comisión del {h.pct}%</small>
        </label>
        <label>
          Pago
          <div className="calc-cuotas-input">
            <select value={valores.cuotas} onChange={(e) => set("cuotas", e.target.value)}>
              <option value="1">1 pago</option>
              <option value="2">2 cuotas</option>
              <option value="3">3 cuotas</option>
            </select>
          </div>
          <small>Sin interés</small>
        </label>
        {alquiler && (
          <>
            <label>
              Alquiler mensual
              <div className="calc-cuotas-input">
                <input inputMode="decimal" value={valores.canon} onChange={(e) => set("canon", monto(e.target.value))} />
                <span>$</span>
              </div>
            </label>
            <label>
              Duración
              <div className="calc-cuotas-input">
                <input inputMode="numeric" value={valores.meses} onChange={(e) => set("meses", entero(e.target.value, 120))} />
                <span>meses</span>
              </div>
              <small>Total del contrato: {importe(h.base, monedaBase)}</small>
            </label>
          </>
        )}
      </div>

      <div className="calc-cuotas-resultado">
        <span>{h.cuotas === 1 ? "Honorarios" : `Cuota de honorarios (${h.cuotas})`}</span>
        <strong>{importe(h.cuota, monedaBase)}</strong>
        {enPesos && <small>≈ {importe(h.cuota * dolar, "ARS")} al dólar oficial</small>}
        <div className="calc-cuotas-detalle">
          <div><span>{alquiler ? "Total del contrato" : "Precio"}</span><b>{importe(h.base, monedaBase)}</b></div>
          <div><span>Honorarios totales</span><b>{importe(h.total, monedaBase)}</b></div>
        </div>
      </div>

      <p className="calc-cuotas-aviso">
        Honorarios de Grupo Condado: {h.pct}% {alquiler ? "del total del contrato" : "del precio"}, en 1 a 3 cuotas.
      </p>
    </div>
  );
}

export default CalculadoraHonorarios;
