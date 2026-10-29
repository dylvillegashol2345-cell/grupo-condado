import { consultas, contratos, citas, ecoItemsDeUsuario, listarContactosEco } from "../services/entidades";
import { diasRestantes } from "./format";
import { proximasCitas, fechaISO } from "./citas";

export async function contarNotificaciones({ usuario, rol }) {
  const conteos = {};
  if (!usuario) return conteos;

  if (rol === "Administrador" || rol === "Agente") {
    try {
      conteos.consultas = (await consultas.listar()).length;
    } catch { /* se ignora */ }

    try {
      const hoy = fechaISO();
      const mias = (c) => rol === "Administrador" || !c.IdUsuario || Number(c.IdUsuario) === Number(usuario.IdUsuario);
      const deHoy = proximasCitas(await citas.listar()).filter((c) => c.Fecha === hoy && mias(c));
      conteos.citasHoy = deHoy.length;
      conteos.proximaCita = deHoy[0]?.Hora || "";
    } catch { /* se ignora */ }
  }

  try {
    const [mios, todos] = await Promise.all([
      ecoItemsDeUsuario(usuario.IdUsuario),
      listarContactosEco(),
    ]);
    const idsMios = new Set(mios.slice(0, 5).map((i) => Number(i.IdItem)));
    conteos.ecomarket = todos.filter((c) => idsMios.has(Number(c.IdItem))).length;
  } catch { /* se ignora */ }

  if (rol !== "Cliente") {
    try {
      conteos.contratos = (await contratos.listar()).filter((c) => {
        const d = diasRestantes(c.FechaFin);
        return d !== null && d >= 0 && d <= 30;
      }).length;
    } catch { /* se ignora */ }
  }

  return conteos;
}

export function itemsPanel(conteos) {
  const items = [];
  const n = conteos.consultas || 0;
  if (n > 0) {
    items.push({
      clave: "consultas",
      icono: "fa-comments", color: "#1565c0",
      titulo: `${n} consulta${n !== 1 ? "s" : ""} de clientes`,
      desc: "Hay clientes esperando respuesta",
      destino: "/app/consultas",
    });
  }
  const h = conteos.citasHoy || 0;
  if (h > 0) {
    items.push({
      clave: "citas",
      icono: "fa-calendar-alt", color: "#6c2d20",
      titulo: `Hoy tenés ${h} cita${h !== 1 ? "s" : ""}`,
      desc: `La próxima a las ${conteos.proximaCita}`,
      destino: "/app/citas",
    });
  }
  const m = conteos.ecomarket || 0;
  if (m > 0) {
    items.push({
      clave: "ecomarket",
      icono: "fa-leaf", color: "#2e7d32",
      titulo: `${m} mensaje${m !== 1 ? "s" : ""} en EcoMarket`,
      desc: "Alguien quiere tus artículos",
      destino: "/app/ecomarket/mis-publicaciones",
    });
  }
  const v = conteos.contratos || 0;
  if (v > 0) {
    items.push({
      clave: "contratos",
      icono: "fa-clock", color: "#e65100",
      titulo: `${v} contrato${v !== 1 ? "s" : ""} vence${v === 1 ? "" : "n"} pronto`,
      desc: "En los próximos 30 días",
      destino: "/app/contratos",
    });
  }
  return items;
}

export function novedades(conteos, previos) {
  const nuevas = [];
  const crece = (clave) =>
    conteos[clave] !== undefined && (previos[clave] || 0) > 0 && conteos[clave] > previos[clave];

  if (crece("consultas")) {
    const diff = conteos.consultas - previos.consultas;
    nuevas.push({
      clave: "consultas",
      titulo: `${diff} consulta${diff !== 1 ? "s" : ""} recibida${diff !== 1 ? "s" : ""}`,
      desc: "Un cliente envió una consulta",
      icono: "fa-comments", color: "#1565c0",
      destino: "/app/consultas",
    });
  }
  if (crece("citasHoy")) {
    nuevas.push({
      clave: "citas",
      titulo: "Cita agendada para hoy",
      desc: `Se agendó una cita para hoy. La próxima es a las ${conteos.proximaCita}`,
      icono: "fa-calendar-alt", color: "#6c2d20",
      destino: "/app/citas",
    });
  }
  if (crece("ecomarket")) {
    const diff = conteos.ecomarket - previos.ecomarket;
    nuevas.push({
      clave: "ecomarket",
      titulo: `${diff} mensaje${diff !== 1 ? "s" : ""} recibido${diff !== 1 ? "s" : ""} en EcoMarket`,
      desc: "Alguien consultó por tus artículos",
      icono: "fa-leaf", color: "#2e7d32",
      destino: "/app/ecomarket/mensajes",
    });
  }
  if (crece("contratos")) {
    nuevas.push({
      clave: "contratos",
      titulo: "Contrato próximo a vencer",
      desc: "Revisá los contratos por vencer",
      icono: "fa-clock", color: "#e65100",
      destino: "/app/contratos",
    });
  }
  return nuevas;
}
