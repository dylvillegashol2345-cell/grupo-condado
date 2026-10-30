import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { propiedades, propietarios, imagenesDePropiedad } from "../services/entidades";
import { mapPropiedad } from "../services/propiedadesService";
import { useCarga } from "../hooks/useCarga";
import { useAuth } from "../context/authContext";
import { IMG_PROPIEDAD_FALLBACK } from "../utils/catalogos";
import { normalizarImagen } from "../utils/imagenes";
import { chipsDetalle, infoServicio } from "../utils/caracteristicas";
import GaleriaDetalle from "../components/propiedades/GaleriaDetalle";
import Tour360 from "../components/propiedades/Tour360";
import MapaPropiedad from "../components/propiedades/MapaPropiedad";
import PropiedadModal from "../components/propiedades/PropiedadModal";
import ModalDebeLoguear from "../components/propiedades/ModalDebeLoguear";
import EcoBadge from "../components/common/EcoBadge";
import ErrorBanner from "../components/common/ErrorBanner";
import { Spinner } from "../components/common/Loader";
import CalculadoraHonorarios from "../components/propiedades/CalculadoraHonorarios";
import { useUI } from "../context/uiContext";
import { HONORARIOS_DEFECTO, calcularHonorarios } from "../utils/honorarios";
import { abrirFichaPropiedad } from "../utils/fichaPropiedad";
import { obtenerCotizacion } from "../utils/cotizacion";
import { mensajeWhatsApp, linkWhatsApp } from "../utils/compartir";
import { etiquetaPropiedad } from "../utils/citas";

const BADGE_ESTADO = {
  Disponible: { bg: "#e8f5e9", color: "#2e7d32" },
  Reservada:  { bg: "#fff3e0", color: "#e65100" },
  Vendida:    { bg: "#eeeeee", color: "#424242" },
  Alquilada:  { bg: "#e3f2fd", color: "#1565c0" },
};

const IMG_DETALLE_FALLBACK = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=70";

const textoGris = { color: "var(--text-muted)", fontSize: 13 };

function CardSimilar({ s }) {
  const navigate = useNavigate();
  return (
    <div className="prop-card" style={{ cursor: "pointer" }} onClick={() => navigate(`/app/propiedades/${s.id}`)}>
      <div className="prop-card-img-wrap">
        <img src={s.image || IMG_PROPIEDAD_FALLBACK} className="prop-card-img" alt={s.type} />
        <span className="prop-card-tipo">{s.type}</span>
      </div>
      <div className="prop-card-body">
        <div className="prop-card-precio">{s.price}</div>
        <h3 className="prop-card-titulo">{s.title}</h3>
        <p className="prop-card-loc"><i className="fa fa-map-marker-alt me-1" />{s.localidad}</p>
        <div className="prop-card-meta">
          <span><i className="fa fa-ruler-combined me-1" />{s.surface || "—"} m²</span>
        </div>
      </div>
    </div>
  );
}

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { puede, cerrarSesion, invitado } = useAuth();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pedirLogin, setPedirLogin] = useState(false);
  const [vistaMedia, setVistaMedia] = useState("fotos");
  const { toast } = useUI();
  const [honorarios, setHonorarios] = useState(HONORARIOS_DEFECTO);
  const [dolar, setDolar] = useState(null);
  useEffect(() => {
    let vivo = true;
    obtenerCotizacion().then((c) => { if (vivo && c) setDolar(c.valor); });
    return () => { vivo = false; };
  }, []);

  const puedeEditar = puede("propiedades");
  const origen = puedeEditar ? "/app/propiedades" : "/app/catalogo";

  const { datos, cargando, error, recargar } = useCarga(async () => {
    const lista = (await propiedades.listar()).map(mapPropiedad);
    const p = lista.find((x) => String(x.id) === String(id)) || null;
    let fotosGaleria = [];
    let duenio = null;
    if (p) {
      fotosGaleria = await imagenesDePropiedad(p.id).catch(() => []);
      if (puedeEditar && p.idPropietario) {
        duenio = await propietarios.obtener(p.idPropietario).catch(() => null);
      }
    }
    return { lista, p, fotosGaleria, duenio };
  }, [id, puedeEditar]);

  const { lista = [], p = null, fotosGaleria = [], duenio = null } = datos || {};

  const fotos = useMemo(() => {
    if (!p) return [IMG_DETALLE_FALLBACK];
    const out = [];
    if (p.image) out.push(p.image);
    fotosGaleria.forEach((f) => {
      const url = normalizarImagen(f.Url);
      if (url && url !== p.image) out.push(url);
    });
    return out.length ? out : [IMG_DETALLE_FALLBACK];
  }, [p, fotosGaleria]);

  const similares = useMemo(() => {
    if (!p) return [];
    return lista
      .filter((x) => x.tipoId === p.tipoId && x.id !== p.id && x.estado === "Disponible")
      .slice(0, 3);
  }, [lista, p]);

  const caracteristicas = useMemo(() => (p ? chipsDetalle(p.raw.Descripcion) : null), [p]);

  const servicios = useMemo(
    () => String(p?.raw.Servicios || "").split(",").map((s) => s.trim()).filter(Boolean),
    [p]
  );

  function descargarFicha() {
    try {
      abrirFichaPropiedad({
        p, fotos, caracteristicas, servicios,
        honorarios: invitado ? null : { ...honorarios, ...calcularHonorarios(p.precioNum, honorarios) },
      });
    } catch (err) {
      toast(err.message, "error");
    }
  }

  function consultar() {
    if (invitado) { setPedirLogin(true); return; }
    const label = etiquetaPropiedad(p);
    navigate(`/app/consulta?propiedad=${encodeURIComponent(label)}&desde=detalle`);
  }

  if (cargando) return <Spinner texto="Cargando propiedad..." />;
  if (error) return <ErrorBanner mensaje={error} onReintentar={recargar} />;
  if (!p) {
    return (
      <section className="card-ghost mt-3">
        <button className="detalle-v2-volver" onClick={() => navigate(origen)}>
          <i className="fa fa-arrow-left me-2" />Volver
        </button>
        <ErrorBanner mensaje="No se encontró la propiedad solicitada." />
      </section>
    );
  }

  const bc = BADGE_ESTADO[p.estado] || BADGE_ESTADO.Disponible;

  let nombreDuenio = "—";
  if (!p.idPropietario) nombreDuenio = "Sin propietario asignado";
  else if (duenio) nombreDuenio = `${duenio.Apellido || ""} ${duenio.Nombre || ""}`.trim() || "Sin nombre";

  return (
    <section id="detallePropiedad" className="card-ghost mt-3">
      <div className="detalle-v2 fade-in">

        <div className="detalle-v2-header">
          <button className="detalle-v2-volver" onClick={() => navigate(origen)}>
            <i className="fa fa-arrow-left me-2" />Volver
          </button>
          <div className="detalle-v2-badges">
            <span className="detalle-estado-badge" style={{ background: bc.bg, color: bc.color }}>
              {p.estado}
            </span>
            {p.publicada && (
              <span className="detalle-pub-badge">
                <i className="fa fa-check-circle me-1" />Publicada
              </span>
            )}
            <button type="button" className="btn btn-sm btn-light" style={{ border: "1px solid var(--border)", fontSize: 12 }} onClick={descargarFicha}>
              <i className="fa fa-file-pdf me-1" style={{ color: "var(--condado)" }} />Descargar ficha
            </button>
            <a
              className="btn btn-sm"
              style={{ background: "#25D366", color: "white", fontSize: 12, fontWeight: 600 }}
              href={linkWhatsApp(mensajeWhatsApp(p, window.location.href))}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fa-brands fa-whatsapp me-1" />Compartir
            </a>
          </div>
        </div>

        <div className="detalle-v2-main">

          <div className="detalle-v2-media" style={{ minWidth: 0 }}>
            {p.tour360 && (
              <div className="tour360-pestanas">
                <button
                  type="button"
                  className={`btn btn-sm ${vistaMedia === "fotos" ? "btn-condado" : "btn-light"}`}
                  onClick={() => setVistaMedia("fotos")}
                >
                  <i className="fa fa-images me-1" />Fotos
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${vistaMedia === "360" ? "btn-condado" : "btn-light"}`}
                  onClick={() => setVistaMedia("360")}
                >
                  <i className="fa fa-street-view me-1" />Recorrido 360
                </button>
              </div>
            )}
            {p.tour360 && vistaMedia === "360"
              ? <Tour360 valor={p.tour360} titulo={p.barrio} />
              : <GaleriaDetalle key={p.id} fotos={fotos} alt={p.type} />}
          </div>

          <div className="detalle-v2-info">
            <p className="detalle-v2-tipo-label">{p.type}</p>
            <h1 className="detalle-v2-titulo">{p.barrio}, {p.localidad}</h1>
            <p className="detalle-v2-dir">
              <i className="fa fa-map-marker-alt me-1" />{p.calle} {p.numeracion}
            </p>

            <div className="detalle-v2-precio-wrap">
              <span className="detalle-v2-precio">{p.price}</span>
              {p.bonificacion > 0 && (
                <span className="detalle-v2-bonif">-{p.bonificacion}% eco</span>
              )}
            </div>

            <div className="detalle-v2-highlights">
              <div className="detalle-v2-hl">
                <i className="fa fa-ruler-combined" />
                <span>{p.surface || "—"} m²</span>
                <small>Superficie</small>
              </div>
              <div className="detalle-v2-hl">
                <i className="fa fa-leaf" />
                <EcoBadge clase={p.categoriaEco || "B"} />
                <small>Energética</small>
              </div>
              <div className="detalle-v2-hl">
                <i className={`fa fa-${p.paneles ? "sun" : "times"}`} />
                <span>{p.paneles ? "Sí" : "No"}</span>
                <small>Paneles solares</small>
              </div>
              <div className="detalle-v2-hl">
                <i className={`fa fa-${p.aislamiento ? "thermometer-half" : "times"}`} />
                <span>{p.aislamiento ? "Sí" : "No"}</span>
                <small>Aislamiento</small>
              </div>
            </div>

            <div className="detalle-v2-desc">
              <h4>Características</h4>
              {caracteristicas === null ? (
                <p style={textoGris}>{p.raw.Descripcion ? "—" : "Sin características cargadas."}</p>
              ) : caracteristicas.length === 0 ? (
                <p style={textoGris}>Sin características destacadas.</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", marginTop: ".4rem" }}>
                  {caracteristicas.map((c) => (
                    <span
                      key={c.label}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: ".4rem",
                        background: "var(--condado-light)", border: "1.5px solid rgba(108,45,32,.2)",
                        borderRadius: 10, padding: ".3em .85em", fontSize: 13, fontWeight: 600, color: "var(--condado)",
                      }}
                    >
                      <i className={`fa ${c.icono}`} />{c.label}: {c.valor}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {servicios.length > 0 && (
              <div className="detalle-v2-desc">
                <h4>Servicios disponibles</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", marginTop: ".4rem" }}>
                  {servicios.map((s, i) => {
                    const info = infoServicio(s);
                    return (
                      <span
                        key={i}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: ".3rem",
                          background: "var(--surface-2)", border: "1.5px solid var(--border)",
                          borderRadius: 10, padding: ".25em .75em", fontSize: 12, fontWeight: 600,
                        }}
                      >
                        <i className={`fa ${info.icono}`} style={{ color: info.color }} />{s}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="detalle-v2-docs">
              <span className={`detalle-chip ${p.matricula ? "chip-ok" : "chip-no"}`}>
                <i className="fa fa-file-alt me-1" />
                Matrícula {p.matricula ? "verificada" : "pendiente"}
              </span>
              <span className={`detalle-chip ${p.titulo ? "chip-ok" : "chip-no"}`}>
                <i className="fa fa-file-contract me-1" />
                Título {p.titulo ? "digital" : "pendiente"}
              </span>
            </div>

            <div className="detalle-v2-agente">
              <div className="detalle-v2-agente-avatar"><i className="fa fa-user-tie" /></div>
              <div className="detalle-v2-agente-info">
                <strong>Grupo Condado</strong>
                <span>Gestión Inmobiliaria</span>
              </div>
            </div>

            {puedeEditar && (
              <div id="detallePropietarioWrap" style={{
                marginTop: ".75rem", padding: ".75rem 1rem", background: "var(--surface-2)",
                borderRadius: 12, border: "1.5px solid var(--border)", fontSize: 13, color: "var(--text-muted)",
              }}>
                <i className="fa fa-user me-1" style={{ color: "var(--condado)" }} />
                <strong style={{ color: "var(--text-primary)" }}>Propietario: </strong>
                <span id="detallePropietarioNombre">{nombreDuenio}</span>
              </div>
            )}

            {puedeEditar ? (
              <button className="detalle-v2-cta" onClick={() => setModalAbierto(true)}>
                <i className="fa fa-edit me-2" />Editar propiedad
              </button>
            ) : (
              <button className="detalle-v2-cta" onClick={consultar}>
                <i className="fa fa-envelope me-2" />Consultar por esta propiedad
              </button>
            )}
          </div>
        </div>

        {!invitado && (
          <div className="detalle-v2-mapa-section">
            <h3 className="detalle-v2-similares-titulo">
              <i className="fa fa-calculator me-2" style={{ color: "var(--condado)" }} />Honorarios de la inmobiliaria
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "1rem" }}>
              Calculá la comisión de Grupo Condado por la venta o el alquiler, en 1 a 3 cuotas. Lo que cargues acá también sale en la ficha PDF.
            </p>
            <CalculadoraHonorarios precio={p.precioNum} moneda={p.moneda} valores={honorarios} onCambiar={setHonorarios} dolar={dolar} />
          </div>
        )}

        <div className="detalle-v2-mapa-section">
          <h3 className="detalle-v2-similares-titulo">
            <i className="fa fa-map-marker-alt me-2" style={{ color: "var(--condado)" }} />Ubicación
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "1rem" }}>
            {p.title} · {p.localidad}
          </p>
          <MapaPropiedad
            idLocalidad={p.localidadId}
            barrio={p.barrio}
            calle={p.calle}
            numeracion={p.numeracion}
          />
        </div>

        {similares.length > 0 && (
          <div className="detalle-v2-similares">
            <h3 className="detalle-v2-similares-titulo">Propiedades similares</h3>
            <div className="detalle-v2-similares-grid">
              {similares.map((s) => <CardSimilar key={s.id} s={s} />)}
            </div>
          </div>
        )}

      </div>

      {modalAbierto && (
        <PropiedadModal
          propiedad={p.raw}
          onCerrar={() => setModalAbierto(false)}
          onGuardado={recargar}
        />
      )}

      {pedirLogin && (
        <ModalDebeLoguear
          onCancelar={() => setPedirLogin(false)}
          onIniciarSesion={() => { cerrarSesion(); navigate("/login"); }}
        />
      )}
    </section>
  );
}

export default PropertyDetail;
