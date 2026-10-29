import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  propiedades, propietarios, clientes, operaciones, contratos, pagos, consultas, ecoItems, citas as citasApi,
} from "../services/entidades";
import { useCarga } from "../hooks/useCarga";
import { filtrarDashboard, tendenciasDashboard, cobrosYPendientes } from "../utils/dashboard";
import { useActividad } from "../context/actividadContext";
import { useUI } from "../context/uiContext";
import KpiCard from "../components/dashboard/KpiCard";
import CobrosPorTipo from "../components/dashboard/CobrosPorTipo";
import MotivoVencido from "../components/dashboard/MotivoVencido";
import ModalReportes from "../components/dashboard/ModalReportes";
import Grafico from "../components/dashboard/Grafico";
import ErrorBanner from "../components/common/ErrorBanner";
import BotonRecordar from "../components/citas/BotonRecordar";
import { ESTADOS_CITA, proximasCitas, etiquetaDia, direccionCita, fechaISO } from "../utils/citas";
import { tipoLabel, localidadLabel, LOCALIDADES, LOCALIDADES_ORDENADAS } from "../utils/catalogos";
import { fechaCorta, fechaLocal, diasRestantes } from "../utils/format";
import { TIPOS_DOLAR, obtenerCotizacion, convertir, importe, importeCorto } from "../utils/cotizacion";

const PAL = ["#6c2d20", "#1565c0", "#2e7d32", "#e65100", "#6a1b9a", "#00838f", "#f9a825", "#37474f"];
const RANK_COLORES = ["#6c2d20", "#8c3b2a", "#b35e4e", "#d27b66"];
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const TIPOS_NOMBRES = ["Casa", "Departamento", "Lote", "Terreno"];

const TIPOS_FILTRO = { 1: "Casa", 2: "Departamento", 3: "Lote", 4: "Terreno" };
const LOCALIDADES_GRAFICO = {
  1: "Villa María", 2: "Córdoba Cap.", 3: "Río Cuarto", 4: "Río Tercero", 5: "Cosquín",
  6: "Villa Allende", 7: "Alta Gracia", 8: "Carlos Paz", 9: "Jesús María",
};
const ESTADOS_FILTRO = ["Disponible", "Reservada", "Alquilada", "Vendida"];

const FILTROS_VACIOS = { estado: "", tipo: "", localidad: "", desde: "", hasta: "" };
const COLORES_ALERTA = { danger: "#fdecea", warn: "#fff3e0", info: "#e3f2fd" };
const TEXTO_ALERTA = { danger: "#c62828", warn: "#e65100", info: "#1565c0" };

const ICONO_VERDE = { background: "rgba(46,125,50,.1)", color: "#2e7d32" };
const ICONO_AZUL = { background: "rgba(21,101,192,.1)", color: "#1565c0" };
const ICONO_ECO = { background: "rgba(56,142,60,.1)", color: "#388e3c" };

const LEYENDA = { position: "bottom", labels: { font: { size: 12 }, color: "#6b5b52" } };
const EJE_Y = { beginAtZero: true, ticks: { stepSize: 1, color: "#a0918a" }, grid: { color: "#f0ebe8" } };
const ejeMoneda = (moneda) => ({ beginAtZero: true, ticks: { color: "#a0918a", callback: (v) => importe(v, moneda) }, grid: { color: "#f0ebe8" } });
const EJE_X_CHICO = { ticks: { color: "#6b5b52", font: { size: 11 } }, grid: { display: false } };
const OPCIONES_SIN_LEYENDA = { plugins: { legend: { display: false } }, scales: { y: EJE_Y, x: EJE_X_CHICO } };

function leerPreferencia(clave, porDefecto) {
  try { return localStorage.getItem(clave) || porDefecto; } catch { return porDefecto; }
}
function guardarPreferencia(clave, valor) {
  try { localStorage.setItem(clave, valor); } catch { /* se ignora */ }
}

function tiempoRelativo(hora) {
  const mins = Math.round((new Date() - hora) / 60000);
  if (mins < 1) return "ahora mismo";
  if (mins === 1) return "hace 1 min";
  return `hace ${mins} min`;
}

function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useUI();
  const { actividad } = useActividad();
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [pendientes, setPendientes] = useState(FILTROS_VACIOS);
  const [reportesAbierto, setReportesAbierto] = useState(false);

  const [monedaElegida, setMonedaElegida] = useState(() => leerPreferencia("dashMoneda", "ARS"));
  const [tipoDolar, setTipoDolar] = useState(() => leerPreferencia("dashTipoDolar", "oficial"));
  const [cotizacion, setCotizacion] = useState(null);

  useEffect(() => {
    let cancelado = false;
    const actualizar = () => obtenerCotizacion(tipoDolar).then((c) => { if (!cancelado && c) setCotizacion(c); });
    actualizar();
    const iv = setInterval(actualizar, 15 * 60 * 1000);
    return () => { cancelado = true; clearInterval(iv); };
  }, [tipoDolar]);

  const valorDolar = cotizacion?.valor || 0;
  const moneda = monedaElegida === "USD" && valorDolar ? "USD" : "ARS";

  function elegirMoneda(m) {
    setMonedaElegida(m);
    guardarPreferencia("dashMoneda", m);
  }
  function elegirTipoDolar(t) {
    setTipoDolar(t);
    guardarPreferencia("dashTipoDolar", t);
  }

  const { datos, error, recargar } = useCarga(async () => {
    const [props, duenios, clis, ops, cts, pgs, cons, eco, cits] = await Promise.all([
      propiedades.listar(),
      propietarios.listar(),
      clientes.listar(),
      operaciones.listar(),
      contratos.listar(),
      pagos.listar(),
      consultas.listar(),
      ecoItems.listar(),
      citasApi.listar().catch(() => []),
    ]);
    return { props, duenios, clis, ops, cts, pgs, cons, eco: Array.isArray(eco) ? eco : [], citas: cits };
  }, []);

  useEffect(() => {
    if (error) toast("❌ Error al cargar el dashboard", "error");
  }, [error, toast]);

  const listo = Boolean(datos);
  const v = (x) => (listo ? x : "—");

  const d = useMemo(() => datos || {}, [datos]);
  const props = useMemo(() => d.props || [], [d.props]);
  const { propsFiltradas, opsFiltradas, pgsFiltrados } = useMemo(() => filtrarDashboard(d, filtros), [d, filtros]);
  const pgsMon = useMemo(
    () => pgsFiltrados.map((p) => ({ ...p, Monto: convertir(p.Monto, p.Moneda, moneda, valorDolar) })),
    [pgsFiltrados, moneda, valorDolar]
  );
  const propsMon = useMemo(
    () => propsFiltradas.map((p) => ({ ...p, Precio: convertir(p.Precio, p.Moneda, moneda, valorDolar) })),
    [propsFiltradas, moneda, valorDolar]
  );

  const tend = useMemo(
    () => (datos ? tendenciasDashboard(datos, filtros, { propsFiltradas, opsFiltradas, pgsFiltrados }) : {}),
    [datos, filtros, propsFiltradas, opsFiltradas, pgsFiltrados]
  );

  const m = useMemo(() => {
    const cts = d.cts || [];
    const eco = d.eco || [];
    const total = propsFiltradas.length || 1;

    const disponibles = propsFiltradas.filter((p) => p.Estado === "Disponible").length;
    const alquiladas = propsFiltradas.filter((p) => p.Estado === "Alquilada").length;
    const vendidas = propsFiltradas.filter((p) => p.Estado === "Vendida").length;
    const totalCobrado = pgsMon.reduce((a, p) => a + (Number(p.Monto) || 0), 0);

    return {
      disponibles, alquiladas, vendidas, totalCobrado,
      promCobro: pgsFiltrados.length ? Math.round(totalCobrado / pgsFiltrados.length) : 0,
      valorPortafolio: propsMon.reduce((a, p) => a + (Number(p.Precio) || 0), 0),
      porVencer: cts.filter((c) => {
        const dias = diasRestantes(c.FechaFin);
        return dias !== null && dias >= 0 && dias <= 30;
      }).length,
      ventas: opsFiltradas.filter((o) => o.Tipo === "Venta").length,
      alquileres: opsFiltradas.filter((o) => o.Tipo === "Alquiler").length,
      tasaOcupacion: Math.round(((alquiladas + vendidas) / total) * 100),
      pctAlquiladas: Math.round((alquiladas / total) * 100),
      pctVendidas: Math.round((vendidas / total) * 100),
      ecoDisponibles: eco.filter((i) => i.Estado === "Disponible").length,
      ecoEntregados: eco.filter((i) => i.Estado === "Entregado").length,
      claseA: propsFiltradas.filter((p) => p.CategoriaEco === "A").length,
      conPaneles: propsFiltradas.filter((p) => p.PanelesSolares).length,
    };
  }, [d, propsFiltradas, opsFiltradas, pgsFiltrados, pgsMon, propsMon]);

  const graficoTipos = useMemo(() => {
    const hayOps = opsFiltradas.length > 0;
    const tipoDeProp = new Map(propsFiltradas.map((p) => [p.IdPropiedad, TIPOS_FILTRO[p.IdTipo]]));
    const alq = { Casa: 0, Departamento: 0, Lote: 0, Terreno: 0 };
    const venta = { Casa: 0, Departamento: 0, Lote: 0, Terreno: 0 };
    opsFiltradas.forEach((o) => {
      const t = tipoDeProp.get(o.IdPropiedad);
      if (!t) return;
      if (o.Tipo === "Alquiler") alq[t] += 1;
      if (o.Tipo === "Venta") venta[t] += 1;
    });
    const cont = { Casa: 0, Departamento: 0, Lote: 0, Terreno: 0 };
    propsFiltradas.forEach((p) => { const t = TIPOS_FILTRO[p.IdTipo]; if (t) cont[t] += 1; });

    return {
      tipo: hayOps ? "bar" : "doughnut",
      data: {
        labels: TIPOS_NOMBRES,
        datasets: hayOps ? [
          { label: "Alquiler", data: Object.values(alq), backgroundColor: "#1565c0", borderRadius: 6, borderWidth: 0 },
          { label: "Venta", data: Object.values(venta), backgroundColor: "#6c2d20", borderRadius: 6, borderWidth: 0 },
        ] : [{ data: Object.values(cont), backgroundColor: PAL.slice(0, 4), borderColor: "#fff", borderWidth: 3, hoverOffset: 8 }],
      },
      options: {
        plugins: {
          legend: { display: hayOps, position: "bottom", labels: { font: { size: 12 }, padding: 12, color: "#6b5b52" } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label || ctx.label}: ${ctx.raw}` } },
        },
        ...(hayOps ? {
          scales: {
            x: { ticks: { color: "#6b5b52", font: { weight: "600" } }, grid: { display: false } },
            y: EJE_Y,
          },
        } : { cutout: "60%" }),
      },
    };
  }, [propsFiltradas, opsFiltradas]);

  const dataEstados = useMemo(() => {
    const conteo = { Disponible: 0, Reservada: 0, Alquilada: 0, Vendida: 0 };
    propsFiltradas.forEach((p) => { if (p.Estado in conteo) conteo[p.Estado] += 1; });
    return {
      labels: Object.keys(conteo),
      datasets: [{
        label: "Cantidad",
        data: Object.values(conteo),
        backgroundColor: ["#2e7d32", "#e65100", "#1565c0", "#546e7a"],
        borderRadius: 8, borderWidth: 0,
      }],
    };
  }, [propsFiltradas]);

  const dataEvolucion = useMemo(() => {
    const alq = {};
    const venta = {};
    opsFiltradas.forEach((o) => {
      if (!o.Fecha) return;
      const mes = String(o.Fecha).substring(0, 7);
      if (o.Tipo === "Alquiler") alq[mes] = (alq[mes] || 0) + 1;
      if (o.Tipo === "Venta") venta[mes] = (venta[mes] || 0) + 1;
    });
    const meses = [...new Set([...Object.keys(alq), ...Object.keys(venta)])].sort();
    const hay = meses.length > 0;
    return {
      labels: hay ? meses.map((k) => { const [y, mo] = k.split("-"); return `${MESES[Number(mo) - 1]} ${y}`; }) : ["Sin datos"],
      datasets: [
        {
          label: "Alquileres", data: hay ? meses.map((k) => alq[k] || 0) : [0],
          borderColor: "#1565c0", backgroundColor: "rgba(21,101,192,.1)",
          fill: true, tension: 0.4, pointBackgroundColor: "#1565c0", pointRadius: 4,
        },
        {
          label: "Ventas", data: hay ? meses.map((k) => venta[k] || 0) : [0],
          borderColor: "#6c2d20", backgroundColor: "rgba(108,45,32,.1)",
          fill: true, tension: 0.4, pointBackgroundColor: "#6c2d20", pointRadius: 4,
        },
      ],
    };
  }, [opsFiltradas]);

  const graficoLocalidad = useMemo(() => {
    const hayOps = opsFiltradas.length > 0;
    const locDeProp = new Map(propsFiltradas.map((p) => [p.IdPropiedad, LOCALIDADES_GRAFICO[p.IdLocalidad] || "Otra"]));
    const alq = {};
    const venta = {};
    opsFiltradas.forEach((o) => {
      const l = locDeProp.get(o.IdPropiedad);
      if (!l) return;
      if (o.Tipo === "Alquiler") alq[l] = (alq[l] || 0) + 1;
      if (o.Tipo === "Venta") venta[l] = (venta[l] || 0) + 1;
    });
    const cont = {};
    propsFiltradas.forEach((p) => { const l = LOCALIDADES_GRAFICO[p.IdLocalidad] || "Otra"; cont[l] = (cont[l] || 0) + 1; });
    const labels = Object.keys(hayOps ? { ...alq, ...venta } : cont).sort();

    return {
      data: {
        labels,
        datasets: hayOps ? [
          { label: "Alquiler", data: labels.map((l) => alq[l] || 0), backgroundColor: "#1565c0", borderRadius: 6, borderWidth: 0 },
          { label: "Venta", data: labels.map((l) => venta[l] || 0), backgroundColor: "#6c2d20", borderRadius: 6, borderWidth: 0 },
        ] : [{ label: "Propiedades", data: labels.map((l) => cont[l] || 0), backgroundColor: "#8c3b2a", borderRadius: 6, borderWidth: 0 }],
      },
      options: {
        plugins: { legend: { ...LEYENDA, display: hayOps } },
        scales: { y: EJE_Y, x: { ticks: { color: "#6b5b52", font: { size: 11 } }, grid: { display: false } } },
      },
    };
  }, [propsFiltradas, opsFiltradas]);

  const dataPrecioTipo = useMemo(() => {
    const suma = { Casa: 0, Departamento: 0, Lote: 0, Terreno: 0 };
    const cant = { Casa: 0, Departamento: 0, Lote: 0, Terreno: 0 };
    propsMon.forEach((p) => {
      const t = TIPOS_FILTRO[p.IdTipo];
      if (t && Number(p.Precio)) { suma[t] += Number(p.Precio); cant[t] += 1; }
    });
    return {
      labels: TIPOS_NOMBRES,
      datasets: [{
        label: "Precio promedio",
        data: TIPOS_NOMBRES.map((t) => (cant[t] > 0 ? Math.round(suma[t] / cant[t]) : 0)),
        backgroundColor: PAL.slice(0, 4), borderRadius: 8, borderWidth: 0,
      }],
    };
  }, [propsMon]);

  const dataTipoOperacion = useMemo(() => ({
    labels: ["Venta", "Alquiler"],
    datasets: [{
      data: [m.ventas, m.alquileres],
      backgroundColor: ["#6c2d20", "#1565c0"], borderColor: "#fff", borderWidth: 3, hoverOffset: 8,
    }],
  }), [m.ventas, m.alquileres]);

  const dataIngresos = useMemo(() => {
    const porMes = {};
    pgsMon.forEach((p) => {
      if (!p.Fecha) return;
      const mes = String(p.Fecha).substring(0, 7);
      porMes[mes] = (porMes[mes] || 0) + Number(p.Monto || 0);
    });
    const clave = (f) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`;
    let meses;
    if (filtros.desde || filtros.hasta) {
      meses = Object.keys(porMes).sort();
      if (!meses.length) {
        const desde = new Date(filtros.desde || filtros.hasta);
        const hasta = new Date(filtros.hasta || filtros.desde);
        const cur = new Date(desde.getFullYear(), desde.getMonth(), 1);
        while (cur <= hasta) {
          meses.push(clave(cur));
          cur.setMonth(cur.getMonth() + 1);
        }
      }
    } else {
      const hoy = new Date();
      meses = [];
      for (let i = 11; i >= 0; i--) meses.push(clave(new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)));
    }
    const valores = meses.map((k) => Math.round(porMes[k] || 0));
    const maximo = Math.max(...valores);
    return {
      labels: meses.map((k) => { const [y, mo] = k.split("-"); return `${MESES[Number(mo) - 1]} ${y.slice(2)}`; }),
      datasets: [{
        label: `Ingresos (${moneda === "USD" ? "USD" : "$"})`,
        data: valores,
        backgroundColor: valores.map((x) => (x === maximo ? "#2e7d32" : "rgba(108,45,32,.6)")),
        borderRadius: 8, borderWidth: 0,
      }],
    };
  }, [pgsMon, moneda, filtros.desde, filtros.hasta]);

  const dataPropsLocalidad = useMemo(() => {
    const conteo = {};
    propsFiltradas.forEach((p) => {
      const l = LOCALIDADES[p.IdLocalidad] || "Otra";
      conteo[l] = (conteo[l] || 0) + 1;
    });
    const ordenado = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
    return {
      labels: ordenado.map(([k]) => k),
      datasets: [{ label: "Propiedades", data: ordenado.map(([, x]) => x), backgroundColor: "#8c3b2a", borderRadius: 8, borderWidth: 0 }],
    };
  }, [propsFiltradas]);

  const citasProximas = useMemo(() => proximasCitas(d.citas || [], new Date(), 5), [d.citas]);
  const citasHoy = useMemo(() => proximasCitas(d.citas || []).filter((c) => c.Fecha === fechaISO()).length, [d.citas]);

  const proximosVencer = useMemo(
    () => (d.cts || [])
      .map((c) => ({ c, dias: diasRestantes(c.FechaFin) }))
      .filter(({ dias }) => dias !== null && dias >= 0 && dias <= 90)
      .sort((a, b) => a.dias - b.dias),
    [d.cts]
  );

  const alertas = useMemo(() => {
    const salida = [];
    (d.cts || []).forEach((c) => {
      const dias = diasRestantes(c.FechaFin);
      if (dias === null) return;
      const detalle = `Locatario: ${c.LocatarioNombre || "—"} · ${c.InmuebleDireccion || "—"}`;
      const cual = c.InmuebleDireccion ? `El contrato de ${c.InmuebleDireccion}` : "Un contrato";
      if (dias >= 0 && dias <= 30) {
        salida.push({
          tipo: dias <= 7 ? "danger" : "warn", icono: "fa-clock",
          titulo: `${cual} vence en ${dias} día${dias !== 1 ? "s" : ""}`,
          detalle, destino: "/app/contratos", accionLabel: "Ver contrato",
        });
      }
      if (dias < 0) {
        salida.push({
          tipo: "danger", icono: "fa-exclamation-circle",
          titulo: `${cual} venció hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? "s" : ""}`,
          detalle, idContrato: c.IdContrato, destino: "/app/contratos", accionLabel: "Ver contrato",
        });
      }
    });

    if (m.disponibles > 0) {
      salida.push({
        tipo: "info", icono: "fa-home",
        titulo: `${m.disponibles} propiedad${m.disponibles !== 1 ? "es" : ""} disponible${m.disponibles !== 1 ? "s" : ""} esperando operación`,
        destino: "/app/propiedades", accionLabel: "Ver propiedades",
      });
    }

    const cons = d.cons || [];
    if (cons.length > 0) {
      salida.push({
        tipo: "info", icono: "fa-comments",
        titulo: `${cons.length} consulta${cons.length !== 1 ? "s" : ""} de clientes para atender`,
        destino: "/app/consultas", accionLabel: "Ver consultas",
      });
    }

    return salida.slice(0, 8);
  }, [d, m.disponibles]);

  const topPropiedades = useMemo(
    () => [...propsMon].sort((a, b) => Number(b.Precio || 0) - Number(a.Precio || 0)).slice(0, 4),
    [propsMon]
  );

  const ultimasOperaciones = useMemo(
    () => [...(d.ops || [])].sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha)).slice(0, 5),
    [d.ops]
  );

  const cobranza = useMemo(
    () => cobrosYPendientes(pgsMon, d.cts || [], d.ops || []),
    [pgsMon, d.cts, d.ops]
  );

  const hayFiltros = filtros.estado || filtros.tipo || filtros.localidad || filtros.desde || filtros.hasta;
  const etiquetaFiltros = [
    filtros.estado && `Estado: ${filtros.estado}`,
    filtros.tipo && `Tipo: ${TIPOS_FILTRO[filtros.tipo] || filtros.tipo}`,
    filtros.localidad && `Localidad: ${localidadLabel(filtros.localidad)}`,
    filtros.desde && `Desde: ${filtros.desde}`,
    filtros.hasta && `Hasta: ${filtros.hasta}`,
  ].filter(Boolean).join(" · ");

  const grafico = (alto, p) => (
    listo ? <Grafico alto={alto} {...p} /> : <div style={{ position: "relative", height: alto }} />
  );

  const fechaHoy = new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <section className="mt-3" id="dashboard">

      <div className="dash-header mb-3">
        <div>
          <h2 className="dash-title">Panel de control</h2>
          <p className="dash-sub">Resumen operativo en tiempo real</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="dash-date">{fechaHoy}</div>
          <button className="btn btn-light btn-sm" style={{ border: "1px solid var(--border)" }} onClick={recargar}>
            <i className="fa fa-sync me-1" />Actualizar
          </button>
          <button className="btn btn-condado btn-sm" onClick={() => setReportesAbierto(true)}>
            <i className="fa fa-file-export me-1" />Reportes
          </button>
        </div>
      </div>

      <div className="card-ghost mb-3" style={{ padding: ".75rem 1.25rem" }}>
        <div className="d-flex align-items-center flex-wrap gap-3">
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-secondary)" }}>
            <i className="fa fa-coins me-1" />Ver montos en
          </span>
          <div className="catalogo-toggle-bar">
            <button type="button" className={`catalogo-toggle-btn${moneda === "ARS" ? " active" : ""}`} onClick={() => elegirMoneda("ARS")}>
              $ Pesos
            </button>
            <button
              type="button"
              className={`catalogo-toggle-btn${moneda === "USD" ? " active" : ""}`}
              disabled={!valorDolar}
              title={valorDolar ? "" : "Sin cotización del dólar por ahora"}
              onClick={() => elegirMoneda("USD")}
            >
              USD Dólares
            </button>
          </div>

          <div className="d-flex align-items-center gap-2" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            <span>Dólar</span>
            <select className="form-select form-select-sm" style={{ width: "auto" }} value={tipoDolar} onChange={(e) => elegirTipoDolar(e.target.value)}>
              {Object.entries(TIPOS_DOLAR).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <strong style={{ color: "var(--condado)" }}>{valorDolar ? importe(valorDolar, "ARS") : "sin cotización"}</strong>
            <small className="text-muted">
              {cotizacion
                ? `${cotizacion.origen === "api" ? "actualizado" : "última conocida"} · ${new Date(cotizacion.fecha).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}`
                : "buscando cotización..."}
            </small>
          </div>
        </div>
      </div>

      <ErrorBanner mensaje={error} onReintentar={recargar} />

      <div className="dash-objetivo mb-4">
        <div className="dash-objetivo-left">
          <i className="fa fa-bullseye me-2" />
          <strong>Objetivo:</strong>
          <span>
            Monitorear el desempeño operativo de Grupo Condado para detectar oportunidades,
            controlar recursos y tomar decisiones estratégicas basadas en datos.
          </span>
        </div>
        <div className="dash-objetivo-right">
          <span className="dash-live-dot" />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Datos en tiempo real</span>
        </div>
      </div>

      <div className="card-ghost mb-4" style={{ padding: "1rem 1.25rem" }}>
        <div className="d-flex align-items-center flex-wrap gap-3">
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-secondary)" }}>
            <i className="fa fa-search me-1" />Buscar por
          </span>

          <select className="form-select form-select-sm" style={{ maxWidth: 160 }}
            value={pendientes.estado} onChange={(e) => setPendientes({ ...pendientes, estado: e.target.value })}>
            <option value="">Todos los estados</option>
            {ESTADOS_FILTRO.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>

          <select className="form-select form-select-sm" style={{ maxWidth: 160 }}
            value={pendientes.tipo} onChange={(e) => setPendientes({ ...pendientes, tipo: e.target.value })}>
            <option value="">Todos los tipos</option>
            {Object.entries(TIPOS_FILTRO).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>

          <select className="form-select form-select-sm" style={{ maxWidth: 180 }}
            value={pendientes.localidad} onChange={(e) => setPendientes({ ...pendientes, localidad: e.target.value })}>
            <option value="">Todas las localidades</option>
            {LOCALIDADES_ORDENADAS.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>

          <div className="d-flex align-items-center gap-2">
            <label style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Desde</label>
            <input type="date" className="form-control form-control-sm" style={{ maxWidth: 145 }}
              value={pendientes.desde} onChange={(e) => setPendientes({ ...pendientes, desde: e.target.value })} />
            <label style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Hasta</label>
            <input type="date" className="form-control form-control-sm" style={{ maxWidth: 145 }}
              value={pendientes.hasta} onChange={(e) => setPendientes({ ...pendientes, hasta: e.target.value })} />
          </div>

          <button className="btn btn-condado btn-sm" onClick={() => setFiltros({ ...pendientes })}>
            <i className="fa fa-search me-1" />Buscar
          </button>
          <button className="btn btn-light btn-sm" style={{ border: "1px solid var(--border)" }}
            onClick={() => { setPendientes(FILTROS_VACIOS); setFiltros({ ...FILTROS_VACIOS }); }}>
            <i className="fa fa-times me-1" />Limpiar
          </button>

          <div style={{ display: hayFiltros ? "block" : "none", marginLeft: "auto" }}>
            <span style={{ fontSize: 11, background: "var(--condado-light)", color: "var(--condado)", padding: ".25em .75em", borderRadius: 20, fontWeight: 600 }}>
              <i className="fa fa-info-circle me-1" />{etiquetaFiltros || "Activos"}
            </span>
          </div>
        </div>
      </div>

      <div className="dash-perspectiva mb-3">
        <div className="dash-perspectiva-header">
          <span className="dash-perspectiva-badge" style={{ background: "#e8f5e9", color: "#2e7d32" }}>
            <i className="fa fa-dollar-sign me-1" />Perspectiva Financiera
          </span>
          <small>¿Cómo está la salud económica del negocio?</small>
        </div>
        <div className="row g-3">
          <div className="col-6 col-md-3"><KpiCard tono="fin" icono="fa-money-bill" estiloIcono={ICONO_VERDE} etiqueta="Total cobrado" valor={v(importeCorto(m.totalCobrado, moneda))} detalle="en cobros registrados" tendencia={0} /></div>
          <div className="col-6 col-md-3"><KpiCard tono="fin" icono="fa-file-invoice-dollar" estiloIcono={ICONO_VERDE} etiqueta="Cobros registrados" valor={v(pgsFiltrados.length)} detalle={listo ? (m.promCobro > 0 ? `Prom: ${importe(m.promCobro, moneda)} por cobro` : "Sin cobros aún") : ""} tendencia={tend.pagos || 0} /></div>
          <div className="col-6 col-md-3"><KpiCard tono="fin" icono="fa-building" estiloIcono={ICONO_VERDE} etiqueta="Valor catálogo de propiedades" valor={v(importeCorto(m.valorPortafolio, moneda))} detalle="propiedades disponibles" /></div>
          <div className="col-6 col-md-3"><KpiCard tono="fin" icono="fa-file-contract" estiloIcono={ICONO_VERDE} etiqueta="Contratos activos" valor={v((d.cts || []).length)} detalle="vigentes" tendencia={tend.contratos || 0} /></div>
        </div>
      </div>

      <div className="dash-perspectiva mb-3">
        <div className="dash-perspectiva-header">
          <span className="dash-perspectiva-badge" style={{ background: "#e3f2fd", color: "#1565c0" }}>
            <i className="fa fa-users me-1" />Perspectiva Clientes
          </span>
          <small>¿Cómo gestionamos la relación con los clientes?</small>
        </div>
        <div className="row g-3">
          <div className="col-6 col-md-3"><KpiCard tono="cli" icono="fa-user-friends" estiloIcono={ICONO_AZUL} etiqueta="Clientes" valor={v((d.clis || []).length)} detalle="" tendencia={tend.clientes || 0} /></div>
          <div className="col-6 col-md-3"><KpiCard tono="cli" icono="fa-comments" estiloIcono={ICONO_AZUL} etiqueta="Consultas recibidas" valor={v((d.cons || []).length)} detalle="de clientes interesados" tendencia={tend.consultas || 0} /></div>
          <div className="col-6 col-md-3"><KpiCard tono="cli" icono="fa-user" estiloIcono={ICONO_AZUL} etiqueta="Propietarios" valor={v((d.duenios || []).length)} detalle="registrados" tendencia={tend.propietarios || 0} /></div>
          <div className="col-6 col-md-3"><KpiCard tono="cli" icono="fa-search" estiloIcono={ICONO_AZUL} etiqueta="Propiedades disponibles" valor={v(String(m.disponibles))} detalle="listas para ofrecer" /></div>
        </div>
      </div>

      <div className="dash-perspectiva mb-3">
        <div className="dash-perspectiva-header">
          <span className="dash-perspectiva-badge" style={{ background: "var(--condado-light)", color: "var(--condado)" }}>
            <i className="fa fa-cogs me-1" />Perspectiva Procesos Internos
          </span>
          <small>¿Qué tan eficientes son nuestras operaciones?</small>
        </div>
        <div className="row g-3">
          <div className="col-6 col-md-3"><KpiCard tono="proc" icono="fa-home" etiqueta="Propiedades totales" valor={v(propsFiltradas.length)} detalle={listo ? `${m.disponibles} disp · ${m.alquiladas} alq · ${m.vendidas} vend` : ""} tendencia={tend.propiedades || 0} /></div>
          <div className="col-6 col-md-3"><KpiCard tono="proc" icono="fa-key" estiloIcono={ICONO_AZUL} etiqueta="Alquiladas" valor={v(String(m.alquiladas))} detalle={listo ? `${m.pctAlquiladas}% del total` : ""} /></div>
          <div className="col-6 col-md-3"><KpiCard tono="proc" icono="fa-handshake" estiloIcono={ICONO_VERDE} etiqueta="Vendidas" valor={v(String(m.vendidas))} detalle={listo ? `${m.pctVendidas}% del total` : ""} /></div>
          <div className="col-6 col-md-3"><KpiCard tono="proc" icono="fa-percentage" etiqueta="Ocupación total" valor={v(`${m.tasaOcupacion}%`)} detalle={listo ? `${m.alquiladas} alq + ${m.vendidas} vend / ${propsFiltradas.length} total` : "alquiladas + vendidas / total"} /></div>
        </div>

        <div className="row g-3 mt-1">
          <div className="col-6 col-md-3"><KpiCard tono="proc" icono="fa-chart-bar" etiqueta="Operaciones totales" valor={v(opsFiltradas.length)} detalle={listo ? `${m.ventas} ventas · ${m.alquileres} alquileres` : ""} tendencia={tend.operaciones || 0} /></div>
          <div className="col-6 col-md-3"><KpiCard tono="proc" icono="fa-key" estiloIcono={ICONO_AZUL} etiqueta="Alquileres" valor={v(String(m.alquileres))} detalle="operaciones de alquiler" /></div>
          <div className="col-6 col-md-3"><KpiCard tono="proc" icono="fa-home" estiloIcono={ICONO_VERDE} etiqueta="Ventas" valor={v(String(m.ventas))} detalle="operaciones de venta" /></div>
          <div className="col-6 col-md-3"><KpiCard tono="proc" icono="fa-clock" etiqueta="Contratos por vencer" valor={v(String(m.porVencer))} colorValor={listo && m.porVencer > 0 ? "#e65100" : undefined} detalle="en los próximos 30 días" /></div>
        </div>
      </div>

      <div className="dash-perspectiva mb-4">
        <div className="dash-perspectiva-header">
          <span className="dash-perspectiva-badge" style={{ background: "#e8f5e9", color: "#388e3c" }}>
            <i className="fa fa-leaf me-1" />Perspectiva Sustentabilidad
          </span>
          <small>¿Cuál es nuestro impacto en la comunidad?</small>
        </div>
        <div className="row g-3">
          <div className="col-6 col-md-3"><KpiCard tono="eco" icono="fa-leaf" estiloIcono={ICONO_ECO} etiqueta="EcoMarket publicados" valor={v((d.eco || []).length)} detalle={listo ? `${m.ecoDisponibles} disponible${m.ecoDisponibles !== 1 ? "s" : ""}` : ""} tendencia={tend.eco || 0} /></div>
          <div className="col-6 col-md-3"><KpiCard tono="eco" icono="fa-recycle" estiloIcono={ICONO_ECO} etiqueta="Artículos entregados" valor={v(String(m.ecoEntregados))} detalle="reutilizados" /></div>
          <div className="col-6 col-md-3"><KpiCard tono="eco" icono="fa-sun" estiloIcono={ICONO_ECO} etiqueta="Propiedades Clase A" valor={v(String(m.claseA))} detalle="máxima eficiencia energética" /></div>
          <div className="col-6 col-md-3"><KpiCard tono="eco" icono="fa-bolt" estiloIcono={ICONO_ECO} etiqueta="Con paneles solares" valor={v(String(m.conPaneles))} detalle="propiedades sustentables" /></div>
        </div>
      </div>

      <div className="dash-portfolio mb-4">
        <div className="dash-portfolio-inner">
          <div>
            <span className="dash-portfolio-label">Valor total del catálogo de propiedades</span>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: ".2rem" }}>
              {listo && (hayFiltros
                ? `${propsFiltradas.length} de ${props.length} propiedades según la búsqueda`
                : `${propsFiltradas.length} propiedades en total`)}
            </div>
          </div>
          <span className="dash-portfolio-value">{listo ? importe(m.valorPortafolio, moneda) : "$—"}</span>
        </div>
        <div className="dash-portfolio-bg" />
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-5">
          <div className="card-ghost">
            <h6 className="chart-title"><i className="fa fa-chart-bar me-2" />Tipo de propiedades</h6>
            <p className="chart-sub">Cantidad de propiedades por tipo, separadas por alquiler y venta</p>
            {grafico(260, graficoTipos)}
          </div>
        </div>
        <div className="col-md-7">
          <div className="card-ghost">
            <h6 className="chart-title"><i className="fa fa-chart-bar me-2" />Estado de propiedades</h6>
            <p className="chart-sub">Disponibles, alquiladas, vendidas y reservadas</p>
            {grafico(260, {
              tipo: "bar", data: dataEstados,
              options: {
                indexAxis: "y",
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} propiedad${ctx.raw !== 1 ? "es" : ""}` } },
                },
                scales: {
                  x: EJE_Y,
                  y: { ticks: { color: "#6b5b52", font: { weight: "600", size: 13 } }, grid: { display: false } },
                },
              },
            })}
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-8">
          <div className="card-ghost">
            <h6 className="chart-title"><i className="fa fa-chart-line me-2" />Operaciones por mes</h6>
            <p className="chart-sub">Evolución de alquileres y ventas en el período seleccionado</p>
            {grafico(240, {
              tipo: "line", data: dataEvolucion,
              options: {
                plugins: { legend: LEYENDA },
                scales: { y: EJE_Y, x: { ticks: { color: "#a0918a" }, grid: { display: false } } },
              },
            })}
          </div>
        </div>
        <div className="col-md-4">
          <div className="card-ghost">
            <h6 className="chart-title"><i className="fa fa-chart-pie me-2" />Tipo de operación</h6>
            <p className="chart-sub">Distribución entre ventas y alquileres</p>
            {grafico(240, {
              tipo: "doughnut", data: dataTipoOperacion,
              options: {
                plugins: {
                  legend: { position: "bottom", labels: { font: { size: 12 }, padding: 12, color: "#6b5b52" } },
                  tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}` } },
                },
                cutout: "55%",
              },
            })}
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card-ghost">
            <h6 className="chart-title"><i className="fa fa-chart-bar me-2" />Precio promedio por tipo</h6>
            <p className="chart-sub">Valor de mercado promedio según el tipo de propiedad</p>
            {grafico(220, {
              tipo: "bar", data: dataPrecioTipo,
              options: {
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: (ctx) => ` ${importe(ctx.raw, moneda)}` } },
                },
                scales: { y: ejeMoneda(moneda), x: { ticks: { color: "#6b5b52", font: { weight: "600" } }, grid: { display: false } } },
              },
            })}
          </div>
        </div>
        <div className="col-md-6">
          <div className="card-ghost">
            <h6 className="chart-title"><i className="fa fa-map-marker-alt me-2" />Operaciones por localidad</h6>
            <p className="chart-sub">Alquileres y ventas distribuidos por ciudad</p>
            {grafico(220, { tipo: "bar", ...graficoLocalidad })}
          </div>
        </div>
      </div>

      <div className="row g-3 mt-1 mb-3">
        <div className="col-md-12">
          <div className="card-ghost">
            <h6 className="chart-title"><i className="fa fa-map-marker-alt me-2" />Propiedades por localidad</h6>
            <p className="chart-sub">Distribución geográfica de la cartera</p>
            {grafico(220, { tipo: "bar", data: dataPropsLocalidad, options: OPCIONES_SIN_LEYENDA })}
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-8">
          <div className="card-ghost">
            <h6 className="chart-title"><i className="fa fa-dollar-sign me-2" style={{ color: "#2e7d32" }} />Ingresos por mes</h6>
            <p className="chart-sub">Total de cobros registrados en el período seleccionado</p>
            {grafico(240, {
              tipo: "bar", data: dataIngresos,
              options: {
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: (ctx) => ` ${importe(ctx.raw, moneda)}` } },
                },
                scales: { y: ejeMoneda(moneda), x: { ticks: { color: "#a0918a", font: { size: 10 } }, grid: { display: false } } },
              },
            })}
          </div>
        </div>
        <div className="col-md-4">
          <div className="card-ghost">
            <h6 className="chart-title"><i className="fa fa-clock me-2" style={{ color: "#e65100" }} />Contratos por vencer</h6>
            <p className="chart-sub">Próximos 90 días</p>
            <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", maxHeight: 240, overflowY: "auto" }}>
              {!listo ? null : proximosVencer.length === 0 ? (
                <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)", fontSize: 13 }}>
                  <i className="fa fa-check-circle" style={{ color: "#2e7d32", fontSize: "1.5rem", display: "block", marginBottom: ".5rem" }} />
                  Sin contratos por vencer en los próximos 90 días
                </div>
              ) : (
                proximosVencer.map(({ c, dias }) => {
                  const color = dias <= 15 ? "#c62828" : dias <= 30 ? "#e65100" : "#f9a825";
                  const pct = Math.round((dias / 90) * 100);
                  const label = dias <= 15 ? "URGENTE" : dias <= 30 ? "Próximo" : "En plazo";
                  return (
                    <div key={c.IdContrato} style={{ padding: ".85rem 1rem", background: "var(--surface-2)", borderRadius: 10, borderLeft: `5px solid ${color}`, marginBottom: ".5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".4rem" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                          {c.InmuebleDireccion || c.LocatarioNombre || "Contrato de locación"}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 800, color, background: `${color}18`, padding: ".2em .6em", borderRadius: 8 }}>{dias} días</span>
                      </div>
                      <div style={{ height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden", marginBottom: ".4rem" }}>
                        <div style={{ height: "100%", width: `${100 - pct}%`, background: color, borderRadius: 3, transition: "width .4s" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Vence: <strong>{fechaLocal(c.FechaFin)}</strong></span>
                        <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mt-1">
        <div className="col-12">
          <div className="card-ghost">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
              <div>
                <h6 className="chart-title mb-0"><i className="fa fa-calendar-alt me-2" style={{ color: "var(--condado)" }} />Próximas citas</h6>
                <p className="chart-sub mb-2">
                  {!listo ? "Cargando..." : citasHoy ? `Hoy quedan ${citasHoy} cita${citasHoy !== 1 ? "s" : ""}` : "No quedan citas para hoy"}
                </p>
              </div>
              <button className="btn btn-sm btn-light" style={{ border: "1px solid var(--border)", fontSize: 12 }} onClick={() => navigate("/app/citas")}>
                <i className="fa fa-calendar me-1" />Ver todas
              </button>
            </div>
            {!listo ? null : citasProximas.length === 0 ? (
              <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)", fontSize: 13 }}>
                <i className="fa fa-calendar-check" style={{ fontSize: "1.5rem", display: "block", marginBottom: ".5rem", opacity: 0.5 }} />
                No hay citas próximas. Se agendan desde Consultas o desde el apartado Citas.
              </div>
            ) : (
              <div className="dash-citas">
                {citasProximas.map((c) => {
                  const e = ESTADOS_CITA[c.Estado] || ESTADOS_CITA.Pendiente;
                  return (
                    <div key={c.IdCita} className="dash-cita" style={{ borderLeftColor: e.color }}>
                      <div className="dash-cita-cuando">
                        <span>{etiquetaDia(c.Fecha)}</span>
                        <strong>{c.Hora}</strong>
                      </div>
                      <div className="dash-cita-info">
                        <strong>{c.Contacto || c.ClienteNombre || "Sin contacto"}</strong>
                        <span><i className="fa fa-building me-1" />{direccionCita(c)}</span>
                        <span><i className="fa fa-user-tie me-1" />{c.Agente || "Sin agente"} · <b style={{ color: e.color }}>{c.Estado}</b></span>
                      </div>
                      <BotonRecordar cita={c} compacto />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row g-3 mt-1">
        <div className="col-md-6">
          <div className="card-ghost">
            <h6 className="chart-title"><i className="fa fa-exclamation-triangle me-2" style={{ color: "#e65100" }} />Alertas operativas</h6>
            {!listo ? (
              <p className="text-muted" style={{ fontSize: 13 }}>Cargando alertas...</p>
            ) : alertas.length === 0 ? (
              <div className="actividad-item" style={{ color: "#2e7d32" }}>
                <div className="actividad-icon" style={{ background: "#e8f5e9", color: "#2e7d32" }}><i className="fa fa-check-circle" /></div>
                <div className="actividad-body"><strong>Todo en orden</strong><span>No hay alertas operativas pendientes</span></div>
              </div>
            ) : (
              alertas.map((a, i) => {
                const fg = TEXTO_ALERTA[a.tipo];
                return (
                  <div key={i} style={{ background: COLORES_ALERTA[a.tipo], borderLeft: `4px solid ${fg}`, borderRadius: 10, padding: ".75rem 1rem", marginBottom: ".6rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: ".5rem", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".25rem" }}>
                          <i className={`fa ${a.icono}`} style={{ color: fg, fontSize: 13, flexShrink: 0 }} />
                          <strong style={{ color: fg, fontSize: 13 }}>{a.titulo}</strong>
                        </div>
                        <div style={{ fontSize: 11, color: "#6b5b52", marginBottom: a.idContrato ? ".5rem" : 0 }}>
                          {a.detalle || ""}
                        </div>
                        {a.idContrato && <MotivoVencido idContrato={a.idContrato} color={fg} />}
                      </div>
                      <button className="btn btn-sm btn-light" onClick={() => navigate(a.destino)}
                        style={{ fontSize: 11, whiteSpace: "nowrap", border: `1px solid ${fg}40`, flexShrink: 0 }}>
                        {a.accionLabel}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="card-ghost">
            <h6 className="chart-title"><i className="fa fa-history me-2" />Actividad reciente</h6>
            {actividad.length === 0 ? (
              <p className="text-muted" style={{ fontSize: 13, padding: ".5rem 0" }}>Sin actividad reciente en esta sesión.</p>
            ) : (
              actividad.map((a, i) => (
                <div className="actividad-item" key={i}>
                  <div className="actividad-icon"><i className={`fa ${a.icono}`} /></div>
                  <div className="actividad-body">
                    <strong>{a.accion}</strong>
                    <span>{a.detalle}</span>
                  </div>
                  <span className="actividad-tiempo">{tiempoRelativo(a.hora)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="row g-3 mt-1">
        <div className="col-md-6">
          <div className="card-ghost">
            <h6 className="chart-title"><i className="fa fa-trophy me-2" style={{ color: "#e65100" }} />Top propiedades por precio</h6>
            {!listo ? (
              <p className="text-muted" style={{ fontSize: 13 }}>Cargando...</p>
            ) : topPropiedades.length === 0 ? (
              <p className="text-muted" style={{ fontSize: 13 }}>Sin datos</p>
            ) : (
              topPropiedades.map((p, i) => {
                const maximo = Math.max(...propsMon.map((x) => Number(x.Precio || 0)));
                const pct = Math.round((Number(p.Precio || 0) / maximo) * 100);
                return (
                  <div className="dash-top-prop" key={p.IdPropiedad}>
                    <div className="dash-top-prop-rank" style={{ background: RANK_COLORES[i] }}>{i + 1}</div>
                    <div className="dash-top-prop-info">
                      <strong>{p.Barrio || "—"} · {p.Calle || ""}</strong>
                      <span>{tipoLabel(p.IdTipo)} · {p.Estado}</span>
                    </div>
                    <div className="dash-top-prop-pct">
                      <span style={{ color: RANK_COLORES[i], fontWeight: 700 }}>{importe(p.Precio, moneda)}</span>
                      <div className="dash-top-prop-bar">
                        <div style={{ width: `${pct}%`, background: RANK_COLORES[i], height: 4, borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="card-ghost">
            <h6 className="chart-title"><i className="fa fa-hand-holding-usd me-2" style={{ color: "#2e7d32" }} />Cobros y pendientes</h6>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: ".5rem 0" }}>
              {listo && <CobrosPorTipo cobranza={cobranza} moneda={moneda} />}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mt-1">
        <div className="col-md-12">
          <div className="card-ghost">
            <h6 className="chart-title"><i className="fa fa-receipt me-2" />Últimas operaciones</h6>
            <div style={{ overflowX: "auto" }}>
              {!listo ? null : ultimasOperaciones.length === 0 ? (
                <p className="text-muted" style={{ fontSize: 13 }}>Sin transacciones</p>
              ) : (
                <table className="dash-tx-table">
                  <thead>
                    <tr><th>Tipo</th><th>Propiedad</th><th>Fecha</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {ultimasOperaciones.map((o) => {
                      const prop = props.find((p) => p.IdPropiedad === o.IdPropiedad);
                      return (
                        <tr key={o.IdOperacion}>
                          <td><span className={`dash-tx-badge dash-tx-${(o.Tipo || "").toLowerCase()}`}>{o.Tipo || "—"}</span></td>
                          <td>{prop ? `${prop.Barrio} · ${prop.Calle}` : "—"}</td>
                          <td>{fechaCorta(o.Fecha)}</td>
                          <td><span style={{ color: "#2e7d32", fontSize: 12, fontWeight: 600 }}>Completada</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      <ModalReportes abierto={reportesAbierto} onCerrar={() => setReportesAbierto(false)} />
    </section>
  );
}

export default Dashboard;
