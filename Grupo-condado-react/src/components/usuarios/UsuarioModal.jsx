import { useState } from "react";
import Modal from "../common/Modal";
import PasswordInput from "../common/PasswordInput";
import PasswordStrength from "../common/PasswordStrength";
import { registrar } from "../../services/entidades";
import { ApiError } from "../../services/api";
import { useUI } from "../../context/uiContext";
import { validarRegistro } from "../../utils/validaciones";
import { nombre as soloNombre, email as soloEmail, telefono } from "../../utils/restricciones";
import { ROLES } from "../../utils/catalogos";

const VACIO = { nombre: "", email: "", telefono: "", pass: "", passConfirm: "", rol: "Agente" };

function UsuarioModal({ onCerrar, onCreado }) {
  const { toast } = useUI();
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    if (guardando) return;
    const invalido = validarRegistro(form);
    if (invalido) { setError(invalido); return; }

    setError("");
    setGuardando(true);
    try {
      await registrar({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        telefono: "+549" + form.telefono,
        contrasena: form.pass,
        rol: form.rol,
      });
      onCerrar();
      toast(`✅ Usuario creado con rol ${form.rol}`, "ok");
      onCreado?.();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? "Ese email ya está registrado"
          : "Error al crear el usuario"
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal abierto titulo="Nuevo usuario" onCerrar={onCerrar} ancho={460}>
      <form className="row g-3" onSubmit={(e) => e.preventDefault()}>
        <div className="col-12">
          <label className="form-label">Nombre completo</label>
          <input
            className="form-control"
            placeholder="Nombre y apellido"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: soloNombre(e.target.value, 60) })}
          />
        </div>

        <div className="col-12">
          <label className="form-label">Email</label>
          <input
            className="form-control"
            type="email"
            placeholder="nombre@correo.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: soloEmail(e.target.value) })}
          />
        </div>

        <div className="col-12">
          <label className="form-label">Teléfono</label>
          <div className="input-group">
            <span className="input-group-text login-prefix">+54 9</span>
            <input
              className="form-control"
              inputMode="numeric"
              placeholder="Código de área + número"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: telefono(e.target.value, 10) })}
            />
          </div>
        </div>

        <div className="col-12">
          <label className="form-label">Rol</label>
          <select
            className="form-select"
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value })}
          >
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="col-12">
          <label className="form-label">Contraseña</label>
          <PasswordInput
            value={form.pass}
            placeholder="Mínimo 6 caracteres"
            onChange={(e) => setForm({ ...form, pass: e.target.value })}
          />
          <PasswordStrength valor={form.pass} />
        </div>

        <div className="col-12">
          <label className="form-label">Confirmar contraseña</label>
          <PasswordInput
            value={form.passConfirm}
            placeholder="Repetí la contraseña"
            onChange={(e) => setForm({ ...form, passConfirm: e.target.value })}
          />
        </div>

        {error && <div className="col-12"><span className="alertaMsg alertaRoja">❌ {error}</span></div>}

        <div className="modal-edicion-footer">
          <button type="button" className="btn btn-light" onClick={onCerrar}>Cancelar</button>
          <button type="button" className="btn btn-condado" onClick={guardar} disabled={guardando}>
            {guardando
              ? <><i className="fa fa-spinner fa-spin me-1" />Guardando...</>
              : <><i className="fa fa-user-plus me-1" />Crear usuario</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default UsuarioModal;
