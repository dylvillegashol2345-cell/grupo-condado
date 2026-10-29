import { useState } from "react";
import { useUI } from "../../context/uiContext";
import { MOTIVOS_CONTRATO_VENCIDO } from "../../utils/catalogos";

function MotivoVencido({ idContrato, color }) {
  const { toast } = useUI();
  const clave = `motivo_contrato_${idContrato}`;
  const [motivo, setMotivo] = useState(() => {
    try { return localStorage.getItem(clave) || ""; } catch { return ""; }
  });

  function elegir(valor) {
    setMotivo(valor);
    try {
      if (valor) localStorage.setItem(clave, valor);
      else localStorage.removeItem(clave);
    } catch { /* se ignora */ }
    if (valor) toast(`✅ Motivo guardado: ${valor}`, "ok", 2500);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
      <select
        style={{
          fontSize: 11, border: `1px solid ${color}40`, borderRadius: 6,
          padding: ".2rem .5rem", background: "white", color: "#444", maxWidth: 200,
        }}
        value={motivo}
        onChange={(e) => elegir(e.target.value)}
      >
        <option value="">— Especificar motivo —</option>
        {MOTIVOS_CONTRATO_VENCIDO.map((m) => (
          <option key={m.valor} value={m.valor}>{m.icono} {m.valor}</option>
        ))}
      </select>
      {motivo && (
        <span style={{ fontSize: 11, background: color, color: "white", padding: ".15em .6em", borderRadius: 8, fontWeight: 600 }}>
          {motivo}
        </span>
      )}
    </div>
  );
}

export default MotivoVencido;
