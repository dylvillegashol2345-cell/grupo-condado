import { clienteDelUsuario } from "./privacidad";
import { direccion, fechaInput } from "./format";

export const CONTRATO_VACIO = {
  LocadorNombre: "", LocadorDni: "", LocadorDomicilio: "",
  LocatarioNombre: "", LocatarioDni: "", LocatarioDomicilio: "",
  InmuebleDireccion: "", InmuebleLocalidad: "", Destino: "Vivienda familiar",
  FechaInicio: "", FechaFin: "",
  Moneda: "ARS", CanonMensual: "", Deposito: "", IndiceActualizacion: "IPC",
  Banco: "", Cbu: "", Cuit: "",
  ExpOrd: "Locatario", ExpExt: "Locador", Municipalidad: "Locatario", Servicios: "Locatario",
  ComisionPct: "", ComisionCargo: "Locatario",
  Documentacion: [],
  Deuda: "No", DeudaDetalle: "",
  Observaciones: "",
};

function filaAForm(vacio, c) {
  return {
    ...vacio,
    ...Object.fromEntries(Object.entries(c || {}).filter(([k, v]) => k in vacio && v !== null && v !== undefined)),
    FechaInicio: fechaInput(c?.FechaInicio),
    FechaFin: fechaInput(c?.FechaFin),
  };
}

export function contratoAForm(c) {
  const f = filaAForm(CONTRATO_VACIO, c);
  return {
    ...f,
    Documentacion: c?.Documentacion ? String(c.Documentacion).split(",").map((s) => s.trim()).filter(Boolean) : [],
  };
}

export function ventaAForm(c) {
  return { ...filaAForm(CONTRATO_VENTA_VACIO, c), FechaPosesion: fechaInput(c?.FechaPosesion) };
}

export function formAContrato(f, idOperacion) {
  return {
    TipoContrato: "Alquiler",
    IdOperacion: Number(idOperacion) || 0,
    FechaInicio: f.FechaInicio || "",
    FechaFin: f.FechaFin || "",
    LocadorNombre: f.LocadorNombre || "",
    LocadorDni: f.LocadorDni || "",
    LocadorDomicilio: f.LocadorDomicilio || "",
    LocatarioNombre: f.LocatarioNombre || "",
    LocatarioDni: f.LocatarioDni || "",
    LocatarioDomicilio: f.LocatarioDomicilio || "",
    InmuebleDireccion: f.InmuebleDireccion || "",
    InmuebleLocalidad: f.InmuebleLocalidad || "",
    Destino: f.Destino || "Vivienda familiar",
    Moneda: f.Moneda || "ARS",
    CanonMensual: Number(f.CanonMensual) || 0,
    Deposito: Number(f.Deposito) || 0,
    IndiceActualizacion: f.IndiceActualizacion || "ICL",
    Banco: f.Banco || "",
    Cbu: f.Cbu || "",
    Cuit: f.Cuit || "",
    ExpOrd: f.ExpOrd || "Locatario",
    ExpExt: f.ExpExt || "Locador",
    Municipalidad: f.Municipalidad || "Locatario",
    Servicios: f.Servicios || "Locatario",
    ComisionPct: Number(f.ComisionPct) || 0,
    ComisionCargo: f.ComisionCargo || "Locatario",
    Documentacion: (f.Documentacion || []).join(","),
    Deuda: f.Deuda || "No",
    DeudaDetalle: f.Deuda === "Si" ? f.DeudaDetalle || "" : "",
    Observaciones: f.Observaciones || "",
  };
}

export const CONTRATO_VENTA_VACIO = {
  LocadorNombre: "", LocadorDni: "", LocadorDomicilio: "",
  VendedorCuit: "", VendedorEstadoCivil: "Soltero/a",
  LocatarioNombre: "", LocatarioDni: "", LocatarioDomicilio: "",
  CompradorEstadoCivil: "Soltero/a",
  InmuebleDireccion: "", InmuebleLocalidad: "", Matricula: "", SuperficieM2: "",
  Moneda: "ARS", PrecioTotal: "", Sena: "", TipoSena: "Penitencial",
  Banco: "", Cbu: "", Cuit: "",
  FechaInicio: "", FechaFin: "", FechaPosesion: "",
  EstadoInmueble: "Sin ocupantes", Deuda: "Sin deudas", DeudaDetalle: "",
  GastosEscritura: "Comprador", Impuestos: "Comprador",
  Penalidades: "", Observaciones: "",
};

export function formAVenta(f, idOperacion) {
  return {
    TipoContrato: "Venta",
    IdOperacion: Number(idOperacion) || 0,
    FechaInicio: f.FechaInicio || "",
    FechaFin: f.FechaFin || "",
    FechaPosesion: f.FechaPosesion || "",
    LocadorNombre: f.LocadorNombre || "",
    LocadorDni: f.LocadorDni || "",
    LocadorDomicilio: f.LocadorDomicilio || "",
    VendedorCuit: f.VendedorCuit || "",
    VendedorEstadoCivil: f.VendedorEstadoCivil || "",
    LocatarioNombre: f.LocatarioNombre || "",
    LocatarioDni: f.LocatarioDni || "",
    LocatarioDomicilio: f.LocatarioDomicilio || "",
    CompradorEstadoCivil: f.CompradorEstadoCivil || "",
    InmuebleDireccion: f.InmuebleDireccion || "",
    InmuebleLocalidad: f.InmuebleLocalidad || "",
    Matricula: f.Matricula || "",
    SuperficieM2: Number(f.SuperficieM2) || 0,
    Moneda: f.Moneda || "ARS",
    PrecioTotal: Number(f.PrecioTotal) || 0,
    Sena: Number(f.Sena) || 0,
    TipoSena: f.TipoSena || "Penitencial",
    Banco: f.Banco || "",
    Cbu: f.Cbu || "",
    Cuit: f.Cuit || "",
    EstadoInmueble: f.EstadoInmueble || "",
    GastosEscritura: f.GastosEscritura || "",
    Impuestos: f.Impuestos || "",
    Deuda: f.Deuda || "Sin deudas",
    DeudaDetalle: f.DeudaDetalle || "",
    Penalidades: f.Penalidades || "",
    Observaciones: f.Observaciones || "",
  };
}

export function saldoVenta(f) {
  const precio = Number(f.PrecioTotal) || 0;
  const sena = Number(f.Sena) || 0;
  return precio > 0 ? "$" + (precio - sena).toLocaleString("es-AR") : "";
}

export function formatDireccion(p) {
  const piso = p.Piso ? ` · Piso ${p.Piso}` : "";
  const depto = p.NroDepto ? ` Depto ${p.NroDepto}` : "";
  if (p.Manzana || p.Lote) {
    const mz = p.Manzana ? `Mz ${p.Manzana}` : "";
    const lote = p.Lote ? `Lote ${p.Lote}` : "";
    return [p.Barrio, mz, lote].filter(Boolean).join(" · ") + piso + depto;
  }
  return direccion(p.Barrio, p.Calle, p.Numeracion) + piso + depto;
}

export function contratosConOperacion(contratos, operaciones) {
  const opMap = new Map(operaciones.map((o) => [Number(o.IdOperacion), o]));
  return contratos.map((c) => {
    const op = opMap.get(Number(c.IdOperacion));
    return { ...c, _tipoOp: op?.Tipo || c.TipoContrato || "Alquiler", _idCliente: op?.IdCliente ?? null };
  });
}

export function contratosDelUsuario(contratos, clientes, usuario) {
  if (!usuario) return [];
  const cliente = clienteDelUsuario(clientes, usuario);
  return cliente
    ? contratos.filter((c) => Number(c._idCliente) === Number(cliente.IdCliente))
    : contratos.filter((c) => Number(c.IdUsuario) === Number(usuario.IdUsuario));
}

export function esVenta(c) {
  return (c?._tipoOp || c?.TipoContrato) === "Venta";
}
