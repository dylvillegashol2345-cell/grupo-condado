import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ecoItems, contactosDeItem, cambiarEstadoEco, mensajesDeConversacion } from "../services/entidades";
import { useCarga } from "../hooks/useCarga";
import { useAuth } from "../context/authContext";
import { useUI } from "../context/uiContext";
import { normalizarImagen } from "../utils/imagenes";
import { BADGE_BS_ECO, precioEco, contactoEsMio, IMG_ECO_DETALLE } from "../utils/ecomarket";
import ContactoModal from "../components/ecomarket/ContactoModal";
import ChatEco from "../components/ecomarket/ChatEco";
import { Spinner } from "../components/common/Loader";

function EcoMarketDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { toast, confirmar } = useUI();
  const [contactoAbierto, setContactoAbierto] = useState(false);
  const [chatAbierto, setChatAbierto] = useState(false);

  const { datos, cargando, error, recargar } = useCarga(async () => {
    const item = await ecoItems.obtener(id);
    if (!item) return { item: null, miConversacion: null };

    const esPropio = Boolean(usuario && Number(usuario.IdUsuario) === Number(item.IdUsuario));
    let miConversacion = null;
    if (usuario && !esPropio) {
      const contactos = await contactosDeItem(item.IdItem).catch(() => []);
      miConversacion = contactos.find((c) => contactoEsMio(c, usuario)) || null;
      if (!miConversacion) {
        for (const c of contactos) {
          const msgs = await mensajesDeConversacion(c.IdContacto).catch(() => []);
          if (msgs.some((m) => Number(m.IdUsuario) === Number(usuario.IdUsuario))) { miConversacion = c; break; }
        }
      }
    }
    return { item, miConversacion };
  }, [id, usuario?.IdUsuario]);

  const { item = null, miConversacion = null } = datos || {};
  const esPropio = Boolean(usuario && item && Number(usuario.IdUsuario) === Number(item.IdUsuario));
  const noEncontrado = !cargando && !error && datos && !item;

  useEffect(() => {
    if (!error && !noEncontrado) return;
    toast(error ? "Error al cargar el artículo" : "Artículo no encontrado", "error");
    navigate("/app/ecomarket", { replace: true });
  }, [error, noEncontrado, toast, navigate]);

  async function cambiarEstado(estado) {
    try {
      await cambiarEstadoEco(item.IdItem, estado);
      toast(`✅ Marcado como ${estado}`, "ok");
      recargar();
    } catch {
      toast("Error al actualizar estado", "error");
    }
  }

  async function eliminar() {
    const ok = await confirmar({
      titulo: "¿Eliminar este registro?",
      descripcion: "¿Seguro que querés eliminar esta publicación de EcoMarket?",
      textoConfirmar: "Eliminar",
    });
    if (!ok) return;
    try {
      await ecoItems.eliminar(item.IdItem);
      toast("Artículo eliminado", "warn");
      navigate("/app/ecomarket");
    } catch {
      toast("Error al eliminar", "error");
    }
  }

  if (cargando) return <Spinner texto="Cargando artículo..." />;
  if (!item) return null;

  return (
    <section className="card-ghost mt-3" id="ecomarketDetalle">
      <div className="detalle-propiedad fade-in">
        <div className="detalle-hero" style={{ height: 320 }}>
          <img
            src={normalizarImagen(item.Imagen) || IMG_ECO_DETALLE}
            onError={(e) => { if (e.currentTarget.src !== IMG_ECO_DETALLE) e.currentTarget.src = IMG_ECO_DETALLE; }}
            className="detalle-hero-img"
            alt={item.Titulo}
          />
          <div className="detalle-hero-overlay">
            <span className={`badge bg-${BADGE_BS_ECO[item.Estado] || "secondary"}`}>{item.Estado}</span>
          </div>
        </div>

        <div className="detalle-body">
          <div className="detalle-titulo-bloque">
            <h2 className="detalle-titulo">{item.Titulo}</h2>
            <p className="detalle-ubicacion">
              <i className="fa fa-tag me-1" />{item.Categoria || "Otros"} · Publicado por {item.NombrePublicador || ""}
            </p>
          </div>

          <div className="detalle-kpis">
            <div className="detalle-kpi detalle-kpi-precio">
              <span className="detalle-kpi-label">Precio</span>
              <span className="detalle-kpi-value">
                {item.EsGratis
                  ? <span style={{ color: "#2e7d32", fontWeight: 700 }}>GRATIS</span>
                  : <b>{precioEco(item)}</b>}
              </span>
            </div>
          </div>

          <div className="detalle-descripcion">
            <h5 className="detalle-section-title">Descripción</h5>
            <p>{item.Descripcion || "Sin descripción."}</p>
          </div>

          <div className="detalle-acciones">
            {esPropio ? (
              <>
                <button className="btn btn-condado" onClick={() => cambiarEstado("Reservado")}>
                  <i className="fa fa-bookmark me-2" />Marcar reservado
                </button>
                <button className="btn btn-condado" onClick={() => cambiarEstado("Entregado")}>
                  <i className="fa fa-check me-2" />Marcar entregado
                </button>
                <button className="btn btn-danger" onClick={eliminar}>
                  <i className="fa fa-trash me-2" />Eliminar
                </button>
              </>
            ) : miConversacion ? (
              <button className="btn btn-condado" onClick={() => setChatAbierto((v) => !v)}>
                <i className="fa fa-comments me-2" />Ver mi conversación
              </button>
            ) : (
              <button className="btn btn-condado" onClick={() => setContactoAbierto(true)}>
                <i className="fa fa-comment-dots me-2" />Quiero este artículo
              </button>
            )}
            <button className="btn btn-light detalle-volver" onClick={() => navigate("/app/ecomarket")}>
              <i className="fa fa-arrow-left me-2" />Volver
            </button>
          </div>

          {chatAbierto && miConversacion && usuario && (
            <div style={{ marginTop: "1.25rem" }}>
              <div className="eco-chat-section">
                <div className="eco-chat-section-title">
                  <i className="fa fa-comments me-1" />Tu conversación con {item.NombrePublicador || "el publicador"}
                </div>
                <ChatEco idContacto={miConversacion.IdContacto} idUsuario={usuario.IdUsuario} contacto={miConversacion} />
              </div>
            </div>
          )}
        </div>
      </div>

      {contactoAbierto && (
        <ContactoModal idItem={item.IdItem} onCerrar={() => setContactoAbierto(false)} />
      )}
    </section>
  );
}

export default EcoMarketDetalle;
