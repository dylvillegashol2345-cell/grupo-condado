import { simularCredito } from "../../utils/credito";
import { importe } from "../../utils/cotizacion";
import { porcentaje, entero } from "../../utils/restricciones";

function CalculadoraCuotas({ precio, moneda, valores, onCambiar, dolar }) {
  const s = simularCredito(precio, valores);
  const set = (campo, v) => onCambiar({ ...valores, [campo]: v });
  const enPesos = moneda === "USD" && dolar && s.cuota > 0;

  return (
    <div className="calc-cuotas">
      <div className="calc-cuotas-datos">
        <label>
          Anticipo
          <div className="calc-cuotas-input">
            <input inputMode="decimal" value={valores.anticipoPct} onChange={(e) => set("anticipoPct", porcentaje(e.target.value))} />
            <span>%</span>
          </div>
          <small>{importe(s.anticipo, moneda)}</small>
        </label>
        <label>
          Plazo
          <div className="calc-cuotas-input">
            <input inputMode="numeric" value={valores.anios} onChange={(e) => set("anios", entero(e.target.value, 40))} />
            <span>años</span>
          </div>
          <small>{s.meses} cuotas</small>
        </label>
        <label>
          Tasa anual (TNA)
          <div className="calc-cuotas-input">
            <input inputMode="decimal" value={valores.tnaPct} onChange={(e) => set("tnaPct", porcentaje(e.target.value))} />
            <span>%</span>
          </div>
          <small>Sistema francés</small>
        </label>
      </div>

      <div className="calc-cuotas-resultado">
        <span>Cuota mensual estimada</span>
        <strong>{importe(s.cuota, moneda)}</strong>
        {enPesos && <small>≈ {importe(s.cuota * dolar, "ARS")} al dólar oficial</small>}
        <div className="calc-cuotas-detalle">
          <div><span>A financiar</span><b>{importe(s.financiado, moneda)}</b></div>
          <div><span>Intereses</span><b>{importe(s.intereses, moneda)}</b></div>
        </div>
      </div>

      <p className="calc-cuotas-aviso">
        Simulación orientativa: no incluye seguros, gastos ni ajuste por UVA. Las condiciones reales las define cada banco.
      </p>
    </div>
  );
}

export default CalculadoraCuotas;
