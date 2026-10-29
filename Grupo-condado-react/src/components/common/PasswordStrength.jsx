import { fortalezaPassword, NIVELES_PASSWORD } from "../../utils/validaciones";

function PasswordStrength({ valor, inicial = "Ingresá la contraseña", alto = 3, margen = ".4rem" }) {
  const nivel = NIVELES_PASSWORD[fortalezaPassword(valor)];
  const pct = valor ? nivel.pct : 0;
  return (
    <>
      <div style={{ marginTop: margen, height: alto, borderRadius: 2, background: "#e8e0db", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: nivel.color,
          borderRadius: 2, transition: "width .3s, background .3s",
        }} />
      </div>
      <small style={{ fontSize: 11, color: valor ? nivel.color : "var(--text-muted)" }}>
        {valor ? nivel.texto : inicial}
      </small>
    </>
  );
}

export default PasswordStrength;
