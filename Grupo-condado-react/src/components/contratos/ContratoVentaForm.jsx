import { Clausula, SelectorMoneda } from "./ContratoForm";
import { saldoVenta } from "../../utils/contratos";
import { nombre, dni, cuil, monto, cbuAlias, alfanumerico, soloLetras, sinNumeros } from "../../utils/restricciones";

const ESTADOS_CIVILES = ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a"];
const CARGO = [["Comprador", "Comprador"], ["Vendedor", "Vendedor"], ["50/50", "50% cada parte"]];

function ContratoVentaForm({ form, onChange }) {
  function set(cambios) {
    onChange({ ...form, ...cambios });
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

  const estadoCivil = (clave) => opciones(clave, ESTADOS_CIVILES.map((v) => [v, v]));

  return (
    <>
      <Clausula num="I" titulo="PARTES" desc="Datos del Vendedor/a y Comprador/a">
        <div className="col-md-4"><label className="form-label">Nombre Vendedor/a</label><input {...campo("LocadorNombre", {}, nombre)} /></div>
        <div className="col-md-3"><label className="form-label">DNI</label><input {...campo("LocadorDni", { inputMode: "numeric" }, dni)} /></div>
        <div className="col-md-5"><label className="form-label">Domicilio</label><input {...campo("LocadorDomicilio")} /></div>
        <div className="col-md-4"><label className="form-label">CUIT Vendedor/a</label><input {...campo("VendedorCuit", { inputMode: "numeric" }, cuil)} /></div>
        <div className="col-md-4"><label className="form-label">Estado civil Vendedor/a</label>{estadoCivil("VendedorEstadoCivil")}</div>
        <div className="col-md-4"><label className="form-label">Nombre Comprador/a</label><input {...campo("LocatarioNombre", {}, nombre)} /></div>
        <div className="col-md-3"><label className="form-label">DNI</label><input {...campo("LocatarioDni", { inputMode: "numeric" }, dni)} /></div>
        <div className="col-md-5"><label className="form-label">Domicilio</label><input {...campo("LocatarioDomicilio")} /></div>
        <div className="col-md-4"><label className="form-label">Estado civil Comprador/a</label>{estadoCivil("CompradorEstadoCivil")}</div>
      </Clausula>

      <Clausula num="II" titulo="OBJETO — INMUEBLE">
        <div className="col-md-5"><label className="form-label">Dirección del inmueble</label><input {...campo("InmuebleDireccion")} /></div>
        <div className="col-md-3"><label className="form-label">Localidad</label><input {...campo("InmuebleLocalidad", {}, soloLetras)} /></div>
        <div className="col-md-2"><label className="form-label">N° Matrícula</label><input {...campo("Matricula", {}, (v) => alfanumerico(v, 20))} /></div>
        <div className="col-md-2"><label className="form-label">Superficie m²</label><input {...campo("SuperficieM2", { inputMode: "decimal" }, (v) => monto(v, true))} /></div>
      </Clausula>

      <Clausula num="III" titulo="PRECIO TOTAL Y SEÑA">
        <div className="col-md-2">
          <label className="form-label">Moneda</label>
          <SelectorMoneda name="vMoneda" valor={form.Moneda} onChange={(m) => set({ Moneda: m })} />
        </div>
        <div className="col-md-3"><label className="form-label">Precio total</label><input type="text" inputMode="decimal" {...campo("PrecioTotal", {}, (v) => monto(v, true))} /></div>
        <div className="col-md-3"><label className="form-label">Seña / Anticipo</label><input type="text" inputMode="decimal" {...campo("Sena", {}, (v) => monto(v, true))} /></div>
        <div className="col-md-2"><label className="form-label">Tipo de seña</label>
          {opciones("TipoSena", [["Penitencial", "Penitencial"], ["Confirmatoria", "Confirmatoria"]])}</div>
        <div className="col-md-3"><label className="form-label">Saldo pendiente</label>
          <input className="form-control" readOnly style={{ background: "var(--surface-2)" }} value={saldoVenta(form)} /></div>
      </Clausula>

      <Clausula num="IV" titulo="FORMA DE PAGO">
        <div className="col-md-4"><label className="form-label">Banco</label><input {...campo("Banco", {}, sinNumeros)} /></div>
        <div className="col-md-4"><label className="form-label">CBU / Alias</label><input {...campo("Cbu", {}, cbuAlias)} /></div>
        <div className="col-md-4"><label className="form-label">CUIT titular cuenta</label><input {...campo("Cuit", { inputMode: "numeric" }, cuil)} /></div>
      </Clausula>

      <Clausula num="V" titulo="PLAZOS Y POSESIÓN">
        <div className="col-md-3"><label className="form-label">Fecha de firma</label><input type="date" {...campo("FechaInicio")} /></div>
        <div className="col-md-3"><label className="form-label">Fecha de escrituración</label><input type="date" {...campo("FechaFin")} /></div>
        <div className="col-md-3"><label className="form-label">Fecha entrega de llaves</label><input type="date" {...campo("FechaPosesion")} /></div>
      </Clausula>

      <Clausula num="VI" titulo="ESTADO DEL INMUEBLE">
        <div className="col-md-3"><label className="form-label">Estado</label>
          {opciones("EstadoInmueble", [["Sin ocupantes", "Sin ocupantes"], ["Con ocupantes", "Con ocupantes"], ["En alquiler", "En alquiler"]])}</div>
        <div className="col-md-3"><label className="form-label">Deudas (expensas/ABL)</label>
          {opciones("Deuda", [["Sin deudas", "Sin deudas"], ["Con deudas", "Con deudas"]])}</div>
        <div className="col-md-3"><label className="form-label">Detalle deudas</label><input {...campo("DeudaDetalle")} /></div>
        <div className="col-md-3"><label className="form-label">Gastos escrituración</label>{opciones("GastosEscritura", CARGO)}</div>
        <div className="col-md-3"><label className="form-label">Impuestos y sellos</label>{opciones("Impuestos", CARGO)}</div>
      </Clausula>

      <Clausula num="VII" titulo="PENALIDADES POR INCUMPLIMIENTO"
        desc="Si el comprador desiste: pierde la seña. Si el vendedor desiste: devuelve el doble de la seña (arts. 1059-1060 CCyCN)">
        <div className="col-12">
          <textarea className="form-control" rows={2} placeholder="Penalidades adicionales acordadas..."
            value={form.Penalidades} onChange={(e) => set({ Penalidades: e.target.value })} />
        </div>
      </Clausula>

      <Clausula num="VIII" titulo="OBSERVACIONES">
        <div className="col-12">
          <textarea className="form-control" rows={3} placeholder="Cualquier acuerdo adicional entre las partes..."
            value={form.Observaciones} onChange={(e) => set({ Observaciones: e.target.value })} />
        </div>
      </Clausula>
    </>
  );
}

export default ContratoVentaForm;
