import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ecoItems, ecoItemsDeUsuario, contactosDeItem, cambiarEstadoEco } from "../services/entidades";
import { useCarga } from "../hooks/useCarga";
import { useAuth } from "../context/authContext";
import { useUI } from "../context/uiContext";
import { normalizarImagen } from "../utils/imagenes";
import { BADGE_BS_ECO, precioEco, IMG_ECO_CARD } from "../utils/ecomarket";
import ChatEco from "../components/ecomarket/ChatEco";
import EmptyState from "../components/common/EmptyState";

function EcoMarketMisPublicaciones() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { toast, confirmar } = useUI();
  const [chatAbierto, setChatAbierto] = useState(null);

  const { datos, cargando, error } = useCarga(async () => {
    if (!usuario) return [];
    const items = await ecoItemsDeUsuario(usuario.IdUsuario);
    const contactos = await Promise.all(
      items.map((i) => contactosDeItem(i.IdItem).catch(() => []))
    );
    return items.map((item, i) => ({ ...item, contactos: contactos[i] }));
  }, [usuario?.IdUsuario]);

  const lista = datos || [];

  async function cambiarEstado(item, estado) {
    try {
      await cambiarEstadoEco(item.IdItem, estado);
      toast(`✅ Marcado como ${estado}`, "ok");
      navigate(`/app/ecomarket/${item.IdItem}`);
    } catch {
      toast("Error al actualizar estado", "error");
    }
  }

  async function eliminar(item) {
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

  let cuerpo;
  if (!usuario) {
    cuerpo = <p className="text-muted">Necesitás iniciar sesión.</p>;
  } else if (cargando) {
    cuerpo = (
      <div className="d-flex justify-content-center p-4">
        <i className="fa fa-spinner fa-spin fa-2x" style={{ color: "var(--condado)" }} />
      </div>
    );
  } else if (error) {
    cuerpo = <p className="text-danger">Error al cargar tus publicaciones.</p>;
  } else if (lista.length === 0) {
    cuerpo = (
      <EmptyState
        icono="fa-leaf"
        titulo="Sin publicaciones"
        descripcion="Todavía no publicaste nada en EcoMarket."
        accion={
          <button className="btn btn-condado mt-2" onClick={() => navigate("/app/ecomarket")}>
            Publicar mi primer artículo
          </button>
        }
      />
    );
  } else {
    cuerpo = lista.map((item) => {
      const nConv = item.contactos.length;
      return (
        <div className="eco-mis-card" key={item.IdItem}>
          <div className="eco-mis-card-img-wrap">
            <img
              src={normalizarImagen(item.Imagen) || IMG_ECO_CARD}
              onError={(e) => { if (e.currentTarget.src !== IMG_ECO_CARD) e.currentTarget.src = IMG_ECO_CARD; }}
              className="eco-mis-card-img"
              alt={item.Titulo}
            />
            <div className="eco-mis-card-estado">
              <span className={`badge bg-${BADGE_BS_ECO[item.Estado] || "secondary"}`}>{item.Estado}</span>
            </div>
            {nConv > 0 && (
              <div className="eco-mis-notif-badge">{nConv} consulta{nConv !== 1 ? "s" : ""}</div>
            )}
          </div>

          <div className="eco-mis-card-body">
            <h4 className="eco-mis-titulo">{item.Titulo}</h4>
            <p className="eco-mis-precio">
              {item.EsGratis
                ? <span style={{ color: "#2e7d32", fontWeight: 700 }}>GRATIS</span>
                : <b>{precioEco(item)}</b>}
            </p>
            <p className="eco-mis-cat"><i className="fa fa-tag me-1" />{item.Categoria || "Otros"}</p>

            {nConv > 0 ? (
              <>
                <button
                  className="btn btn-light btn-sm w-100 mb-2"
                  style={{ border: "1px solid var(--border)", fontSize: 12 }}
                  onClick={() => navigate(`/app/ecomarket/mensajes?item=${item.IdItem}`)}
                >
                  <i className="fa fa-comments me-1" style={{ color: "var(--condado)" }} />
                  Ver {nConv} conversaci{nConv !== 1 ? "ones" : "ón"}
                </button>

                <div className="eco-chat-section">
                  <div className="eco-chat-section-title">
                    <i className="fa fa-reply me-1" />Responder desde acá
                  </div>
                  {item.contactos.map((c) => {
                    const abierto = chatAbierto === c.IdContacto;
                    return (
                      <div className="eco-conv-item" key={c.IdContacto}>
                        <div className="eco-conv-header" onClick={() => setChatAbierto(abierto ? null : c.IdContacto)}>
                          <div className="eco-conv-avatar">{(c.Nombre || "?")[0].toUpperCase()}</div>
                          <div className="eco-conv-meta">
                            <strong>{c.Nombre || "Sin nombre"}</strong>
                            <span className="eco-conv-preview">{c.Mensaje || ""}</span>
                          </div>
                          <i
                            className="fa fa-chevron-down eco-conv-chevron"
                            style={{ transform: abierto ? "rotate(180deg)" : "" }}
                          />
                        </div>
                        {abierto && (
                          <ChatEco
                            idContacto={c.IdContacto}
                            idUsuario={usuario.IdUsuario}
                            contacto={c}
                            placeholder="Escribí tu respuesta..."
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginBottom: ".5rem" }}>
                <i className="fa fa-comment-slash me-1" />Sin consultas aún
              </p>
            )}

            <div className="eco-mis-acciones">
              <button className="eco-mis-btn-estado" onClick={() => cambiarEstado(item, "Reservado")}>
                <i className="fa fa-bookmark me-1" />Reservado
              </button>
              <button className="eco-mis-btn-estado eco-btn-entregado" onClick={() => cambiarEstado(item, "Entregado")}>
                <i className="fa fa-check me-1" />Entregado
              </button>
              <button className="eco-mis-btn-eliminar" onClick={() => eliminar(item)}>
                <i className="fa fa-trash" />
              </button>
            </div>
          </div>
        </div>
      );
    });
  }

  return (
    <section className="card-ghost mt-3" id="ecomarketMisPublicaciones">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0"><i className="fa fa-user me-2" />Mis publicaciones</h5>
        <button
          className="btn btn-light btn-sm"
          style={{ border: "1px solid var(--border)" }}
          onClick={() => navigate("/app/ecomarket")}
        >
          <i className="fa fa-arrow-left me-1" />Volver a EcoMarket
        </button>
      </div>
      <div className="eco-mis-lista" id="ecomarketMisLista">{cuerpo}</div>
    </section>
  );
}

export default EcoMarketMisPublicaciones;
