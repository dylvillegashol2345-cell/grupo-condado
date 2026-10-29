import { linkRecordatorio } from "../../utils/citas";

function BotonRecordar({ cita, compacto }) {
  const link = linkRecordatorio(cita);
  const estilo = { background: link ? "#25D366" : undefined, color: link ? "white" : undefined, fontSize: 12, fontWeight: 600 };
  if (!link) {
    return (
      <button className="btn btn-sm btn-light" disabled title="La cita no tiene un teléfono válido" style={estilo}>
        <i className="fa-brands fa-whatsapp me-1" />{compacto ? "" : "Sin teléfono"}
      </button>
    );
  }
  return (
    <a className="btn btn-sm" style={estilo} href={link} target="_blank" rel="noopener noreferrer"
      title={cita.Estado === "Pendiente" ? "Pedir confirmación por WhatsApp" : "Recordar la visita por WhatsApp"}>
      <i className="fa-brands fa-whatsapp me-1" />{compacto ? "" : "Recordar"}
    </a>
  );
}

export default BotonRecordar;
