import { useState } from "react";
import Modal from "../common/Modal";
import { Clausula, SelectorMoneda } from "./ContratoForm";
import { useUI } from "../../context/uiContext";
import {
  PERSONA_VACIA, AMBIENTE_VACIO, PERIODICIDADES, INDICES,
  calcularFechaFin, abrirContratoLocacion, guardarDocumento,
} from "../../utils/contratoLocacion";
import {
  nombre, nacionalidad, dni, cuil, telefonoCompleto, email, monto, porcentaje, entero, soloDigitos, alfanumerico, soloLetras, sinNumeros, hora,
} from "../../utils/restricciones";

function TablaFilas({ filas, columnas, vacia, onChange, textoAgregar, minimo = 0 }) {
  function setCelda(i, clave, valor) {
    onChange(filas.map((f, j) => (j === i ? { ...f, [clave]: valor } : f)));
  }
  return (
    <div className="col-12">
      <div className="table-responsive">
        <table className="table table-sm align-middle mb-2">
          <thead>
            <tr>
              {columnas.map((col) => (
                <th key={col.clave} style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, minWidth: col.ancho || 110 }}>
                  {col.label}
                </th>
              ))}
              <th style={{ width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i}>
                {columnas.map((col) => (
                  <td key={col.clave}>
                    {col.multilinea ? (
                      <textarea
                        className="form-control form-control-sm"
                        rows={2}
                        value={f[col.clave]}
                        placeholder={col.placeholder}
                        onChange={(e) => setCelda(i, col.clave, e.target.value)}
                      />
                    ) : (
                      <input
                        className="form-control form-control-sm"
                        value={f[col.clave]}
                        placeholder={col.placeholder}
                        type={col.tipo}
                        inputMode={col.inputMode}
                        onChange={(e) => setCelda(i, col.clave, col.filtro ? col.filtro(e.target.value) : e.target.value)}
                      />
                    )}
                  </td>
                ))}
                <td>
                  <button
                    type="button"
                    className="tabla-btn-del"
                    title="Quitar fila"
                    disabled={filas.length <= minimo}
                    onClick={() => onChange(filas.filter((_, j) => j !== i))}
                  >
                    <i className="fa fa-trash" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn btn-light btn-sm" style={{ border: "1px solid var(--border)" }} onClick={() => onChange([...filas, { ...vacia }])}>
        <i className="fa fa-plus me-1" />{textoAgregar}
      </button>
    </div>
  );
}

const COLS_PARTE = [
  { clave: "nombre", label: "Nombre/s", placeholder: "Andrea Fabiana", filtro: nombre },
  { clave: "apellido", label: "Apellido", placeholder: "Pérez", filtro: nombre },
  { clave: "dni", label: "DNI", placeholder: "17629821", ancho: 100, filtro: dni, max: 8, inputMode: "numeric" },
  { clave: "cuil", label: "CUIL", placeholder: "27-17629821-4", ancho: 120, filtro: cuil, max: 13, inputMode: "numeric" },
];
const COLS_CONTACTO = [
  ...COLS_PARTE,
  { clave: "tel", label: "Teléfono", placeholder: "3516666083", ancho: 110, filtro: telefonoCompleto, max: 14, inputMode: "tel" },
  { clave: "email", label: "Email", placeholder: "nombre@correo.com", ancho: 160, filtro: email, max: 100, tipo: "email" },
];
const COLS_GARANTE = [
  ...COLS_CONTACTO,
  { clave: "info", label: "Info. laboral / patrimonial", placeholder: "se desempeña en ...", ancho: 200, multilinea: true },
];
const COLS_AMBIENTE = [
  { clave: "ambiente", label: "Ambiente", placeholder: "Living-Comedor", ancho: 150 },
  { clave: "descripcion", label: "Descripción / inventario", placeholder: "pisos de madera flotante, una (1) ventana de doble hoja...", ancho: 420, multilinea: true },
];

function GeneradorContratoModal({ contrato, guardado, iniciales, onCerrar }) {
  const { toast } = useUI();
  const [d, setD] = useState(() => guardado || iniciales);
  const [guardando, setGuardando] = useState(false);

  function set(cambios) {
    setD((prev) => {
      const sig = { ...prev, ...cambios };
      if ("fechaInicio" in cambios || "plazoMeses" in cambios) {
        sig.fechaFin = calcularFechaFin(sig.fechaInicio, sig.plazoMeses) || sig.fechaFin;
      }
      return sig;
    });
  }

  const campo = (clave, extra = {}, filtro = (v) => v) => ({
    className: "form-control",
    value: d[clave] ?? "",
    onChange: (e) => set({ [clave]: filtro(e.target.value) }),
    ...extra,
  });

  async function guardar(silencioso) {
    setGuardando(true);
    try {
      const donde = await guardarDocumento(contrato.IdContrato, d);
      if (donde === "navegador") {
        toast("⚠ La API no tiene el parche de ContratoDocumento: se guardó solo en este navegador", "warn");
      } else if (!silencioso) {
        toast("✅ Datos del contrato guardados", "ok");
      }
    } catch {
      toast("No se pudieron guardar los datos del contrato", "error");
    } finally {
      setGuardando(false);
    }
  }

  function restablecer() {
    setD(iniciales);
    toast("Datos restablecidos desde el sistema. Guardá para aplicarlos.", "ok");
  }

  async function descargar() {
    const faltan = [];
    if (!d.locadores.some((p) => (p.nombre + p.apellido).trim())) faltan.push("al menos un locador");
    if (!d.locatarios.some((p) => (p.nombre + p.apellido).trim())) faltan.push("al menos un locatario");
    if (!d.direccion.trim()) faltan.push("la dirección del inmueble");
    if (!d.fechaInicio) faltan.push("la fecha de inicio");
    if (!Number(d.canon)) faltan.push("el canon mensual");
    if (faltan.length) {
      toast(`❌ Falta completar ${faltan.join(", ")}`, "error");
      return;
    }
    try {
      const apellido = d.locatarios[0]?.apellido || "";
      abrirContratoLocacion(d, `Contrato de Locacion ${apellido} ${d.direccion}`.trim());
    } catch (err) {
      toast(err.message, "error");
      return;
    }
    await guardar(true);
  }

  const per = PERIODICIDADES[d.periodicidad] || PERIODICIDADES[3];

  return (
    <Modal
      abierto
      titulo={`Contrato de locación${contrato.InmuebleDireccion ? ` · ${contrato.InmuebleDireccion}` : ""}`}
      onCerrar={onCerrar}
      ancho={1100}
      pie={
        <>
          <button type="button" className="btn btn-light" style={{ border: "1px solid var(--border)" }} onClick={restablecer}>
            <i className="fa fa-undo me-1" />Restablecer
          </button>
          <button type="button" className="btn btn-light" style={{ border: "1px solid var(--border)" }} disabled={guardando} onClick={() => guardar(false)}>
            <i className={`fa ${guardando ? "fa-spinner fa-spin" : "fa-save"} me-1`} />Guardar
          </button>
          <button type="button" className="btn btn-condado" disabled={guardando} onClick={descargar}>
            <i className="fa fa-file-pdf me-1" />Generar y descargar contrato
          </button>
        </>
      }
    >
      <p className="text-muted" style={{ fontSize: 13 }}>
        Completá los datos y generá el contrato con el texto completo de las cláusulas. Los datos
        quedan guardados en el sistema para este contrato, así el cliente descarga el mismo documento.
      </p>

      <Clausula num="1" titulo="Lugar, fecha y partes">
        <div className="col-md-4"><label className="form-label">Ciudad de firma</label><input {...campo("ciudad", {}, soloLetras)} /></div>
        <div className="col-md-4"><label className="form-label">Fecha de firma</label><input type="date" {...campo("fechaFirma")} /></div>
        <div className="col-12"><label className="form-label fw-bold">Locadores (propietarios)</label></div>
        <TablaFilas filas={d.locadores} columnas={COLS_PARTE} vacia={PERSONA_VACIA} minimo={1} onChange={(v) => set({ locadores: v })} textoAgregar="Agregar locador" />
        <div className="col-md-4"><label className="form-label">Nacionalidad de los locadores</label><input {...campo("nacLocadores", { placeholder: "argentinos / argentinas" }, nacionalidad)} /></div>
        <div className="col-12 mt-3"><label className="form-label fw-bold">Locatarios (inquilinos)</label></div>
        <TablaFilas filas={d.locatarios} columnas={COLS_CONTACTO} vacia={PERSONA_VACIA} minimo={1} onChange={(v) => set({ locatarios: v })} textoAgregar="Agregar locatario" />
        <div className="col-md-4"><label className="form-label">Nacionalidad de los locatarios</label><input {...campo("nacLocatarios", { placeholder: "argentinos / argentinas" }, nacionalidad)} /></div>
      </Clausula>

      <Clausula num="2" titulo="Objeto (inmueble)">
        <div className="col-md-6"><label className="form-label">Dirección</label><input {...campo("direccion", { placeholder: "calle Rodríguez del Busto N° 4086" })} /></div>
        <div className="col-md-6"><label className="form-label">Unidad (torre, piso, depto.)</label><input {...campo("unidad", { placeholder: "Torre N° 6, primer piso, letra “D”" })} /></div>
        <div className="col-md-6"><label className="form-label">Cochera (opcional)</label><input {...campo("cochera", { placeholder: "una (1) cochera subterránea designada con el N° 87" })} /></div>
        <div className="col-md-6"><label className="form-label">Complejo / edificio (opcional)</label><input {...campo("complejo", { placeholder: "Parque Milenica II" })} /></div>
        <div className="col-md-4"><label className="form-label">Ciudad</label><input {...campo("inmuebleCiudad", {}, soloLetras)} /></div>
        <div className="col-md-4"><label className="form-label">Provincia</label><input {...campo("provincia", {}, soloLetras)} /></div>
        <div className="col-md-4"><label className="form-label">Destino</label><input {...campo("destino", {}, soloLetras)} /></div>
        <div className="col-12"><label className="form-label">Composición</label><input {...campo("composicion", { placeholder: "un departamento de dos (2) dormitorios, dos (2) baños, cocina separada y living/comedor" })} /></div>
      </Clausula>

      <Clausula num="3" titulo="Plazo">
        <div className="col-md-4"><label className="form-label">Plazo (meses)</label><input type="text" inputMode="numeric" {...campo("plazoMeses", {}, (v) => soloDigitos(v, 3))} /></div>
        <div className="col-md-4"><label className="form-label">Inicio</label><input type="date" {...campo("fechaInicio")} /></div>
        <div className="col-md-4"><label className="form-label">Finalización</label><input type="date" {...campo("fechaFin")} /></div>
      </Clausula>

      <Clausula num="4" titulo="Precio y actualización">
        <div className="col-md-4"><label className="form-label">Moneda</label><SelectorMoneda name="monedaGen" valor={d.moneda} onChange={(m) => set({ moneda: m })} /></div>
        <div className="col-md-4"><label className="form-label">Canon mensual inicial</label><input type="text" inputMode="decimal" {...campo("canon", { placeholder: "1700000" }, (v) => monto(v, true))} /></div>
        <div className="col-md-4">
          <label className="form-label">Actualización</label>
          <select className="form-select" value={d.periodicidad} onChange={(e) => set({ periodicidad: Number(e.target.value) })}>
            {Object.entries(PERIODICIDADES).map(([meses, p]) => <option key={meses} value={meses}>{p.forma[0].toUpperCase() + p.forma.slice(1)}</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Índice</label>
          <select className="form-select" value={d.indice} onChange={(e) => set({ indice: e.target.value })}>
            {Object.keys(INDICES).map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="col-md-6"><label className="form-label">Índice supletorio (opcional)</label><input {...campo("indiceSupletorio")} /></div>
        <div className="col-12"><small className="text-muted">El canon inicial rige durante el primer {per.periodo}; después se actualiza en forma {per.forma}.</small></div>
      </Clausula>

      <Clausula num="5" titulo="Pago, servicios, seguro y mora">
        <div className="col-md-6"><label className="form-label">Domicilio de pago</label><input {...campo("domicilioPago", { placeholder: "calle ..., B° ..., de la ciudad de Córdoba" })} /></div>
        <div className="col-md-6"><label className="form-label">Días y horario de pago</label><input {...campo("horarioPago")} /></div>
        <div className="col-md-3"><label className="form-label">Pagar hasta el día</label><input type="text" inputMode="numeric" {...campo("diaLimitePago", {}, (v) => entero(v, 28))} /></div>
        <div className="col-md-3"><label className="form-label">Transferencia hasta (hora)</label><input inputMode="numeric" {...campo("horaTransferencia", { placeholder: "14:00" }, hora)} /></div>
        <div className="col-md-3"><label className="form-label">Interés punitorio diario (%)</label><input type="text" inputMode="decimal" {...campo("interesDiario", {}, porcentaje)} /></div>
        <div className="col-md-3"><label className="form-label">Días para acreditar seguro</label><input type="text" inputMode="numeric" {...campo("seguroDias", {}, (v) => soloDigitos(v, 3))} /></div>
        <div className="col-md-3"><label className="form-label">Días para pasar servicios</label><input type="text" inputMode="numeric" {...campo("serviciosDias", {}, (v) => soloDigitos(v, 3))} /></div>
        <div className="col-md-5"><label className="form-label">Empresa de electricidad</label><input {...campo("empresaLuz", {}, sinNumeros)} /></div>
        <div className="col-md-4"><label className="form-label">Empresa de gas</label><input {...campo("empresaGas", {}, sinNumeros)} /></div>
      </Clausula>

      <Clausula num="6" titulo="Estado del inmueble y obligaciones">
        <div className="col-12">
          <label className="form-label">Estado particular del inmueble (pintura, aberturas, baños, pisos, placares, aires...)</label>
          <textarea className="form-control" rows={4} value={d.estadoParticular} onChange={(e) => set({ estadoParticular: e.target.value })} />
        </div>
        <div className="col-md-4"><label className="form-label">Días para reclamar defectos</label><input type="text" inputMode="numeric" {...campo("verificacionDias", {}, (v) => soloDigitos(v, 3))} /></div>
        <div className="col-md-4"><label className="form-label">Indemnización por rescisión (%)</label><input type="text" inputMode="decimal" {...campo("rescisionPct", {}, porcentaje)} /></div>
        <div className="col-md-4"><label className="form-label">Penalidad diaria por no restituir (%)</label><input type="text" inputMode="decimal" {...campo("ocupacionPct", {}, porcentaje)} /></div>
        <div className="col-12">
          <label className="cfiltro-check">
            <input type="checkbox" checked={d.prohibeAnimales} onChange={(e) => set({ prohibeAnimales: e.target.checked })} />
            <span>Prohibir animales en el inmueble</span>
          </label>
        </div>
      </Clausula>

      <Clausula num="7" titulo="Honorarios y gastos">
        <div className="col-md-3"><label className="form-label">Honorarios ($)</label><input type="text" inputMode="decimal" {...campo("honorarios", {}, (v) => monto(v, true))} /></div>
        <div className="col-md-3"><label className="form-label">Informes patrimoniales ($)</label><input type="text" inputMode="decimal" {...campo("informes", {}, (v) => monto(v, true))} /></div>
        <div className="col-md-3"><label className="form-label">Se adeudan desde</label><input type="date" {...campo("honorariosDesde")} /></div>
        <div className="col-md-3"><label className="form-label">Domicilio del profesional</label><input {...campo("domicilioProfesional")} /></div>
      </Clausula>

      <Clausula num="8" titulo="Garantes" desc="Fiadores solidarios y principales pagadores. Si no hay garantes, la cláusula de garantía no se incluye.">
        <TablaFilas filas={d.garantes} columnas={COLS_GARANTE} vacia={PERSONA_VACIA} onChange={(v) => set({ garantes: v })} textoAgregar="Agregar garante" />
        <div className="col-12"><label className="form-label">Domicilio común de los garantes</label><input {...campo("domicilioGarantes", { placeholder: "calle ..., B° ..., de esta ciudad de Córdoba" })} /></div>
      </Clausula>

      <Clausula num="9" titulo="Corredor, administrador y domicilios">
        <div className="col-md-4"><label className="form-label">Corredor inmobiliario</label><input {...campo("corredor", {}, nombre)} /></div>
        <div className="col-md-4"><label className="form-label">Matrícula del corredor</label><input {...campo("corredorMatricula", { placeholder: "CPI 0000" }, (v) => alfanumerico(v, 20))} /></div>
        <div className="col-md-4"><label className="form-label">Administrador del inmueble</label><input {...campo("administrador", {}, nombre)} /></div>
        <div className="col-md-8"><label className="form-label">Domicilio especial del locador</label><input {...campo("domicilioLocador")} /></div>
        <div className="col-md-4"><label className="form-label">Ejemplares a firmar</label><input type="text" inputMode="numeric" {...campo("ejemplares", {}, (v) => soloDigitos(v, 2))} /></div>
      </Clausula>

      <Clausula num="10" titulo="Anexo I — Inventario por ambiente">
        <TablaFilas filas={d.ambientes} columnas={COLS_AMBIENTE} vacia={AMBIENTE_VACIO} onChange={(v) => set({ ambientes: v })} textoAgregar="Agregar ambiente" />
        <div className="col-md-6"><label className="form-label">Email al que se envían las fotos del inmueble</label><input type="email" {...campo("emailFotos", {}, email)} /></div>
      </Clausula>
    </Modal>
  );
}

export default GeneradorContratoModal;
