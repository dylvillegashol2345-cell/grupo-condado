import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ecoItems, listarContactosEco } from "../services/entidades";
import { useCarga } from "../hooks/useCarga";
import { useAuth } from "../context/authContext";
import { normalizarImagen } from "../utils/imagenes";
import { bandejaUnificada, IMG_ECO_MINI } from "../utils/ecomarket";
import ChatEco from "../components/ecomarket/ChatEco";

const ROL_ESTILO = { fontSize: 10, fontWeight: 700, padding: ".15em .5em", borderRadius: 8 };

function EcoMarketMensajes() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [params, setParams] = useSearchParams();
  const idItemFiltro = params.get("item");
  const [abierta, setAbierta] = useState(null);

  const { datos, cargando, error } = useCarga(async () => {
    if (!usuario) return { convs: [], itemMap: {} };
    const [todos, items] = await Promise.all([listarContactosEco(), ecoItems.listar()]);
    const itemMap = {};
    items.forEach((i) => { itemMap[i.IdItem] = i; });
    const mios = items.filter((i) => Number(i.IdUsuario) === Number(usuario.IdUsuario));
    const convs = await bandejaUnificada(todos, mios, usuario);
    return { convs, itemMap };
  }, [usuario?.IdUsuario]);

  const itemMap = datos?.itemMap || {};
  const lista = (datos?.convs || []).filter(
    (c) => !idItemFiltro || Number(c.contacto.IdItem) === Number(idItemFiltro)
  );
  const itemFiltrado = idItemFiltro ? itemMap[idItemFiltro] : null;

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
    cuerpo = <p className="text-danger p-3">Error al cargar conversaciones.</p>;
  } else {
    cuerpo = (
      <>
        {itemFiltrado && (
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: "1rem", padding: ".75rem", background: "var(--surface-2)", borderRadius: 10 }}>
            <img src={normalizarImagen(itemFiltrado.Imagen) || ""} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{itemFiltrado.Titulo}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Conversaciones sobre este artículo</div>
            </div>
            <button
              className="btn btn-light btn-sm ms-auto"
              style={{ border: "1px solid var(--border)", fontSize: 11 }}
              onClick={() => setParams({})}
            >
              <i className="fa fa-arrow-left me-1" />Todas
            </button>
          </div>
        )}

        {lista.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            <i className="fa fa-comments fa-3x" style={{ display: "block", marginBottom: "1rem", opacity: 0.25 }} />
            <strong>Sin conversaciones aún</strong><br />
            <small>Acá aparecen los mensajes que recibís sobre tus publicaciones y los que enviás sobre artículos de otros.</small>
          </div>
        ) : (
          <div className="eco-bandeja">
            {lista.map(({ contacto, mensajes, soyPublicador, sinLeer }) => {
              const item = itemMap[contacto.IdItem] || null;
              const img = normalizarImagen(item?.Imagen) || IMG_ECO_MINI;
              const titulo = item?.Titulo || "Artículo";
              const interlocutor = soyPublicador
                ? (contacto.Nombre || "Interesado")
                : (item?.NombrePublicador || "Publicador");
              const ultimo = mensajes.length ? mensajes[mensajes.length - 1] : null;
              const estaAbierta = abierta === contacto.IdContacto;
              return (
                <div className="eco-bandeja-conv" key={contacto.IdContacto}>
                  <div className="eco-bandeja-header" onClick={() => setAbierta(estaAbierta ? null : contacto.IdContacto)}>
                    <img src={img} className="eco-bandeja-img" alt={titulo} />
                    <div className="eco-bandeja-meta">
                      <div className="eco-bandeja-titulo">
                        {titulo}
                        {sinLeer > 0 && <span className="eco-bandeja-badge">{sinLeer}</span>}
                      </div>
                      <div className="eco-bandeja-pub">
                        {soyPublicador
                          ? <span style={{ ...ROL_ESTILO, background: "#e8f5e9", color: "#2e7d32" }}>Tu publicación</span>
                          : <span style={{ ...ROL_ESTILO, background: "#e3f2fd", color: "#1565c0" }}>Te interesa</span>}
                        <i className="fa fa-user me-1" style={{ marginLeft: ".5rem" }} />{interlocutor}
                      </div>
                      <div className="eco-bandeja-preview">{ultimo ? ultimo.Texto : contacto.Mensaje || "Sin mensajes aún"}</div>
                    </div>
                    <i
                      className="fa fa-chevron-down eco-bandeja-chevron"
                      style={{ transform: estaAbierta ? "rotate(180deg)" : "" }}
                    />
                  </div>
                  {estaAbierta && (
                    <ChatEco
                      idContacto={contacto.IdContacto}
                      idUsuario={usuario.IdUsuario}
                      contacto={contacto}
                      placeholder="Escribí tu respuesta..."
                      bandeja
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  }

  return (
    <section className="card-ghost mt-3" id="ecomarketMisMensajes">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0"><i className="fa fa-comments me-2" />Conversaciones</h5>
        <button
          className="btn btn-light btn-sm"
          style={{ border: "1px solid var(--border)" }}
          onClick={() => navigate("/app/ecomarket")}
        >
          <i className="fa fa-arrow-left me-1" />Volver a EcoMarket
        </button>
      </div>
      <div id="misMensajesEcoLista">{cuerpo}</div>
    </section>
  );
}

export default EcoMarketMensajes;
