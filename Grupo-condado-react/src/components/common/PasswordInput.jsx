import { useState } from "react";

function PasswordInput({ value, onChange, placeholder, id, className = "form-control" }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="input-group">
      <input
        id={id}
        className={className}
        type={visible ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
      <button
        className="btn btn-light"
        type="button"
        style={{ border: "1.5px solid var(--border)" }}
        onClick={() => setVisible((v) => !v)}
        aria-label="Mostrar contraseña"
      >
        <i className={`fa ${visible ? "fa-eye-slash" : "fa-eye"}`} />
      </button>
    </div>
  );
}

export default PasswordInput;
