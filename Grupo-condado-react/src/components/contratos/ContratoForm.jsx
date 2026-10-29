import { mesesEntre, numero } from "../../utils/format";
import { nombre, dni, monto, porcentaje, cbuAlias, cuil, soloLetras, sinNumeros } from "../../utils/restricciones";

export function Clausula({ num, titulo, desc, children }) {
  return (
    <div className="contrato-clausula">
      <div className="contrato-clausula-titulo"><span className="contrato-num">{num}</span>{titulo}</div>
      <div className="row g-3">
        {desc && <div className="col-12"><p className="contrato-clausula-desc">{desc}</p></div>}
        {children}
      </div>
    </div>
  );
}

export function SelectorMoneda({ name, valor, onChange }) {
  return (
    <div className="d-flex gap-2">
      {["ARS", "USD"].map((m) => (
        <label className="moneda-btn" key={m}>
          <input type="radio" name={name} value={m} checked={valor === m} onChange={() => onChange(m)} />
          <span>{m === "ARS" ? "$ ARS" : "USD"}</span>
        </label>
      ))}
    </div>
  );
}

const DOCUMENTOS = [
  { clave: "Factura Luz",    label: "Factura Luz",          icono: "fa-bolt",     color: "#f9a825" },
  { clave: "Factura Gas",    label: "Factura Gas",          icono: "fa-fire",     color: "#e65100" },
  { clave: "Factura Agua",   label: "Factura Agua",         icono: "fa-tint",     color: "#1565c0" },
  { clave: "Recibos sueldo", label: "Recibos de sueldo",    icono: "fa-file-alt", color: "#2e7d32" },
  { clave: "Garantía",       label: "Garantía propietaria", icono: "fa-home",     color: "#6a1b9a" },
  { clave: "DNI",            label: "DNI",                  icono: "fa-id-card",  color: "#546e7a" },
];

function ContratoForm({ form, onChange }) {
  function set(cambios) {
    onChange({ ...form, ...cambios });
  }

  const meses = mesesEntre(form.FechaInicio, form.FechaFin);
  const comisionMonto = (Number(form.CanonMensual) || 0) * (meses > 0 ? meses : 36) * (Number(form.ComisionPct) || 0) / 100;

  function toggleDoc(clave) {
    const actual = form.Documentacion || [];
    set({ Documentacion: actual.includes(clave) ? actual.filter((d) => d !== clave) : [...actual, clave] });
  }

  const campo = (clave, extra = {}, filtro = (v) => v) => ({
    className: "form-control",
    value: form[clave],
    onChange: (e) => set({ [clave]: filtro(e.target.value) }),
    ...extra,
  });

  const opciones = (clave, valores) => (
    <select className="form-select" value={form[clave]} onChange={(e) => set({ [clave]: e.target.value })}>
      {valores.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );

  return (
    <>
      <Clausula num="I" titulo="PARTES" desc="Datos del Locador/a (propietario) y Locatario/a (inquilino)">
        <div className="col-md-4"><label className="form-label">Nombre Locador/a</label><input {...campo("LocadorNombre", {}, nombre)} /></div>
        <div className="col-md-3"><label className="form-label">DNI</label><input {...campo("LocadorDni", { inputMode: "numeric" }, dni)} /></div>
        <div className="col-md-5"><label className="form-label">Domicilio</label><input {...campo("LocadorDomicilio")} /></div>
        <div className="col-md-4"><label className="form-label">Nombre Locatario/a</label><input {...campo("LocatarioNombre", {}, nombre)} /></div>
        <div className="col-md-3"><label className="form-label">DNI</label><input {...campo("LocatarioDni", { inputMode: "numeric" }, dni)} /></div>
        <div className="col-md-5"><label className="form-label">Domicilio</label><input {...campo("LocatarioDomicilio")} /></div>
      </Clausula>

      <Clausula num="II" titulo="OBJETO — INMUEBLE">
        <div className="col-md-5"><label className="form-label">Dirección del inmueble</label><input {...campo("InmuebleDireccion")} /></div>
        <div className="col-md-3"><label className="form-label">Localidad</label><input {...campo("InmuebleLocalidad", {}, soloLetras)} /></div>
        <div className="col-md-4">
          <label className="form-label">Destino</label>
          {opciones("Destino", [["Vivienda familiar", "Vivienda familiar"], ["Comercial", "Comercial"], ["Mixto", "Mixto"]])}
        </div>
      </Clausula>

      <Clausula num="III" titulo="PLAZO" desc="Las partes acuerdan libremente la duración del contrato">
        <div className="col-md-3"><label className="form-label">Fecha de inicio</label><input type="date" {...campo("FechaInicio")} /></div>
        <div className="col-md-3"><label className="form-label">Fecha de vencimiento</label><input type="date" {...campo("FechaFin")} /></div>
        <div className="col-md-3"><label className="form-label">Duración (meses)</label>
          <input className="form-control" readOnly style={{ background: "var(--surface-2)" }} value={meses > 0 ? `${meses} meses` : ""} /></div>
      </Clausula>

      <Clausula num="IV" titulo="CANON MENSUAL">
        <div className="col-md-2">
          <label className="form-label">Moneda</label>
          <SelectorMoneda name="aMoneda" valor={form.Moneda} onChange={(m) => set({ Moneda: m })} />
        </div>
        <div className="col-md-3"><label className="form-label">Canon mensual</label><input type="text" inputMode="decimal" {...campo("CanonMensual", {}, (v) => monto(v, true))} /></div>
        <div className="col-md-2"><label className="form-label">Depósito (máx 1 mes)</label><input type="text" inputMode="decimal" {...campo("Deposito", {}, (v) => monto(v, true))} /></div>
        <div className="col-md-4">
          <label className="form-label">Índice de actualización</label>
          {opciones("IndiceActualizacion", [
            ["IPC", "IPC (Índice Precios al Consumidor)"],
            ["ICL", "ICL (Índice Contratos de Locación)"],
            ["Acuerdo", "A convenir entre partes"],
          ])}
        </div>
      </Clausula>

      <Clausula num="V" titulo="FORMA DE PAGO" desc="Entre el 1° y el 10° de cada mes, por adelantado">
        <div className="col-md-4"><label className="form-label">Banco</label><input {...campo("Banco", {}, sinNumeros)} /></div>
        <div className="col-md-4"><label className="form-label">CBU / Alias</label><input {...campo("Cbu", {}, cbuAlias)} /></div>
        <div className="col-md-4"><label className="form-label">CUIT titular cuenta</label><input {...campo("Cuit", { inputMode: "numeric" }, cuil)} /></div>
      </Clausula>

      <Clausula num="VI" titulo="EXPENSAS Y SERVICIOS">
        <div className="col-md-3"><label className="form-label">Expensas ordinarias</label>
          {opciones("ExpOrd", [["Locatario", "Locatario"], ["Locador", "Locador"], ["50/50", "50% cada parte"]])}</div>
        <div className="col-md-3"><label className="form-label">Expensas extraordinarias</label>
          {opciones("ExpExt", [["Locador", "Locador"], ["Locatario", "Locatario"]])}</div>
        <div className="col-md-3"><label className="form-label">Municipalidad / ABL</label>
          {opciones("Municipalidad", [["Locatario", "Locatario"], ["Locador", "Locador"]])}</div>
        <div className="col-md-3"><label className="form-label">Servicios (luz, gas, agua)</label>
          {opciones("Servicios", [["Locatario", "Locatario"], ["Locador", "Locador"]])}</div>
      </Clausula>

      <Clausula num="VII" titulo="COMISIÓN INMOBILIARIA">
        <div className="col-md-3"><label className="form-label">% Comisión</label>
          <input type="text" inputMode="decimal" placeholder="Ej: 4" {...campo("ComisionPct", {}, porcentaje)} /></div>
        <div className="col-md-3"><label className="form-label">A cargo de</label>
          {opciones("ComisionCargo", [["Locatario", "Locatario"], ["Locador", "Locador"], ["Ambos", "Ambos (50/50)"]])}</div>
        <div className="col-md-3"><label className="form-label">Monto comisión</label>
          <input className="form-control" readOnly placeholder="Se calcula solo" style={{ background: "var(--surface-2)" }}
            value={comisionMonto > 0 ? "$" + numero(comisionMonto.toFixed(2)) : ""} /></div>
      </Clausula>

      <Clausula num="VIII" titulo="DOCUMENTACIÓN DEL INQUILINO" desc="Documentos recibidos del locatario">
        <div className="d-flex flex-wrap gap-2 ps-3">
          {DOCUMENTOS.map((d) => (
            <label className="servicio-check" key={d.clave}>
              <input type="checkbox" checked={(form.Documentacion || []).includes(d.clave)} onChange={() => toggleDoc(d.clave)} />
              {" "}<i className={`fa ${d.icono}`} style={{ color: d.color }} /> {d.label}
            </label>
          ))}
        </div>
      </Clausula>

      <Clausula num="IX" titulo="DEUDA Y OBSERVACIONES">
        <div className="col-md-3"><label className="form-label">¿Propiedad con deuda?</label>
          <div className="d-flex gap-2">
            {["No", "Si"].map((v) => (
              <label className="moneda-btn" key={v}>
                <input type="radio" name="aDeuda" value={v} checked={form.Deuda === v} onChange={() => set({ Deuda: v })} />
                <span>{v === "Si" ? "Sí" : "No"}</span>
              </label>
            ))}
          </div></div>
        {form.Deuda === "Si" && (
          <div className="col-md-5"><label className="form-label">Detalle de la deuda</label>
            <input placeholder="Monto y tipo de deuda" {...campo("DeudaDetalle")} /></div>
        )}
        <div className="col-12">
          <textarea className="form-control" rows={3} placeholder="Cualquier acuerdo adicional entre las partes..."
            value={form.Observaciones} onChange={(e) => set({ Observaciones: e.target.value })} />
        </div>
      </Clausula>
    </>
  );
}

export default ContratoForm;
