export function filtrarPorFecha(items, campo, desde, hasta) {
  if (!desde && !hasta) return items;
  const min = desde ? new Date(`${desde}T00:00:00`) : null;
  const max = hasta ? new Date(`${hasta}T23:59:59`) : null;
  return items.filter((i) => {
    if (!i[campo]) return true;
    const f = new Date(i[campo]);
    if (min && f < min) return false;
    if (max && f > max) return false;
    return true;
  });
}

export function filtrarDashboard(datos, filtros) {
  const propsFiltradas = (datos.props || []).filter((p) => {
    if (filtros.estado && p.Estado !== filtros.estado) return false;
    if (filtros.tipo && String(p.IdTipo) !== filtros.tipo) return false;
    if (filtros.localidad && String(p.IdLocalidad) !== filtros.localidad) return false;
    return true;
  });
  return {
    propsFiltradas,
    opsFiltradas: filtrarPorFecha(datos.ops || [], "Fecha", filtros.desde, filtros.hasta),
    pgsFiltrados: filtrarPorFecha(datos.pgs || [], "Fecha", filtros.desde, filtros.hasta),
  };
}

function tendencia(id, actual) {
  const key = "dash_snap_" + id;
  try {
    const prev = Number(localStorage.getItem(key) || 0);
    localStorage.setItem(key, String(actual));
    return prev === 0 ? 0 : actual - prev;
  } catch {
    return 0;
  }
}

let ultimoCalculo = { datos: null, filtros: null, resultado: {} };

export function tendenciasDashboard(datos, filtros, filtrados) {
  if (ultimoCalculo.datos === datos && ultimoCalculo.filtros === filtros) {
    return ultimoCalculo.resultado;
  }
  const resultado = {
    pagos: tendencia("tendPagos", filtrados.pgsFiltrados.length),
    contratos: tendencia("tendContratos", (datos.cts || []).length),
    clientes: tendencia("tendClientes", (datos.clis || []).length),
    consultas: tendencia("tendConsultas", (datos.cons || []).length),
    propietarios: tendencia("tendPropietarios", (datos.duenios || []).length),
    operaciones: tendencia("tendOperaciones", filtrados.opsFiltradas.length),
    propiedades: tendencia("tendPropiedades", filtrados.propsFiltradas.length),
    eco: tendencia("tendEcoMarket", (datos.eco || []).length),
  };
  ultimoCalculo = { datos, filtros, resultado };
  return resultado;
}

export function cobrosYPendientes(pagos, contratos, operaciones) {
  const opTipo = new Map(operaciones.map((o) => [o.IdOperacion, o.Tipo]));
  const tipoContrato = new Map(
    contratos.map((c) => [c.IdContrato, opTipo.get(c.IdOperacion) || "Alquiler"])
  );

  let cobrosAlq = 0, cobrosVenta = 0, cantAlq = 0, cantVenta = 0;
  pagos.forEach((p) => {
    const tipo = tipoContrato.get(p.IdContrato) || "Alquiler";
    if (tipo === "Alquiler") { cobrosAlq += Number(p.Monto || 0); cantAlq++; }
    else { cobrosVenta += Number(p.Monto || 0); cantVenta++; }
  });

  const conPago = new Set(pagos.map((p) => p.IdContrato));
  const contratosAlq = contratos.filter((c) => tipoContrato.get(c.IdContrato) === "Alquiler");
  const contratosVenta = contratos.filter((c) => tipoContrato.get(c.IdContrato) !== "Alquiler");
  const alqConPago = contratosAlq.filter((c) => conPago.has(c.IdContrato)).length;
  const ventaConPago = contratosVenta.filter((c) => conPago.has(c.IdContrato)).length;

  const totalConPago = alqConPago + ventaConPago;

  return {
    alquiler: { cobrado: cobrosAlq, cantidad: cantAlq, conCobros: alqConPago, pendientes: contratosAlq.length - alqConPago },
    venta: { cobrado: cobrosVenta, cantidad: cantVenta, conCobros: ventaConPago, pendientes: contratosVenta.length - ventaConPago },
    totalCobrado: cobrosAlq + cobrosVenta,
    pct: contratos.length ? Math.round((totalConPago / contratos.length) * 100) : 0,
    sinPago: contratos.length - totalConPago,
  };
}

