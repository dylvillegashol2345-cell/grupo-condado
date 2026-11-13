import { NavLink } from "react-router-dom";
import Logo from "./Logo";

// Datos de la web oficial de la inmobiliaria (grupocondado.com)
const CONTACTO = {
  direccion: "General Alvear 84 - Planta Baja - Oficina B",
  ciudad: "Córdoba, Argentina",
  telefono: "351 383 5018",
  telefonoLink: "tel:+543513835018",
  email: "grupocondado.cba@gmail.com",
};

const REDES = [
  { icono: "fa-instagram", label: "Instagram", url: "https://www.instagram.com/grupo.condado/" },
];

export default function Footer({ secciones }) {
  return (
    <footer className="pie">
      <div className="pie-columnas">
        <div>
          <div className="pie-marca">
            <Logo size={38} className="" />
            <div>
              <strong>Grupo Condado</strong>
              <span>Solidez y evolución</span>
            </div>
          </div>
          <p className="pie-texto">
            Inmobiliaria de Córdoba especializada en compra, venta y alquiler de propiedades,
            con foco en viviendas sustentables.
          </p>
          <div className="pie-redes">
            {REDES.map((r) => (
              <a key={r.label} href={r.url} target="_blank" rel="noreferrer" aria-label={r.label} title={r.label}>
                <i className={`fa-brands ${r.icono}`} />
              </a>
            ))}
            <a href={`mailto:${CONTACTO.email}`} aria-label="Email" title="Email">
              <i className="fa fa-envelope" />
            </a>
          </div>
        </div>

        <div>
          <h6 className="pie-titulo">Secciones</h6>
          <ul className="pie-lista">
            {secciones.slice(0, 6).map((s) => (
              <li key={s.path}><NavLink to={s.path}>{s.label}</NavLink></li>
            ))}
          </ul>
        </div>

        <div>
          <h6 className="pie-titulo">Contacto</h6>
          <ul className="pie-lista pie-contacto">
            <li><i className="fa fa-location-dot" />{CONTACTO.direccion}<br />{CONTACTO.ciudad}</li>
            <li><i className="fa fa-phone" /><a href={CONTACTO.telefonoLink}>{CONTACTO.telefono}</a></li>
            <li><i className="fa fa-envelope" /><a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a></li>
          </ul>
        </div>
      </div>

      <div className="pie-base">
        © {new Date().getFullYear()} Grupo Condado. Todos los derechos reservados.
      </div>
    </footer>
  );
}
