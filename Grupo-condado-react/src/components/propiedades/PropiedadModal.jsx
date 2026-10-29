import { useEffect, useMemo, useState } from "react";
import Modal from "../common/Modal";
import SearchSelect from "../common/SearchSelect";
import GaleriaFotos from "./GaleriaFotos";
import Tour360Editor from "./Tour360Editor";
import {
  propiedades, propietarios, imagenesDePropiedad, crearImagenPropiedad, eliminarImagenPropiedad,
} from "../../services/entidades";
import { primeraFila } from "../../services/api";
import { PREFIJO_MANZANA, PREFIJO_LOTE, esCountry } from "../../services/propiedadesService";
import {
  TIPOS, LOCALIDADES_ORDENADAS, ESTADOS_PROPIEDAD, MONEDAS, SERVICIOS, SERVICIOS_EDIFICIO,
  CARACTERISTICAS, CARACTERISTICAS_DEPTO, ECO_COLORES,
} from "../../utils/catalogos";
import { validarPropiedad } from "../../utils/validaciones";
import { soloDigitos, monto, alfanumerico } from "../../utils/restricciones";
import { calcularClaseEnergetica, calcularBonificacion, calcularPublicada } from "../../utils/reglas";
import { EXTS_DOC, EXTS_IMAGEN, extensionValida, leerComoBase64, comprimirImagen } from "../../utils/archivos";
import {
  caracteristicasPorDefecto, parsearCaracteristicas, serializarCaracteristicas,
  parsearServicios, serializarServicios,
  sinClavesDepto,
} from "../../utils/caracteristicas";
import { useUI } from "../../context/uiContext";
import { useActividad } from "../../context/actividadContext";
import { normalizarImagen } from "../../utils/imagenes";
import { limpiarTour } from "../../utils/tour360";
import "./propiedades.css";

const VACIO = {
  tipoUbicacion: "barrio",
  IdPropietario: "",
  Barrio: "",
  Calle: "",
  Numeracion: "",
  Manzana: "",
  Lote: "",
  IdTipo: 1,
  Piso: "",
  NroDepto: "",
  IdLocalidad: 1,
  Estado: "Disponible",
  PanelesSolares: false,
  AislamientoTermico: false,
  Moneda: "ARS",
  Tour360: "",
  Precio: "",
  Superficie: "",
};

const LABEL_EDIFICIO = { piletaEdif: "Pileta" };

function estadoInicial(p) {
  if (!p) return { ...VACIO };
  const country = esCountry(p);
  return {
    tipoUbicacion: country ? "country" : "barrio",
    IdPropietario: p.IdPropietario ?? "",
    Barrio: p.Barrio || "",
    Calle: country ? "" : p.Calle || "",
    Numeracion: country ? "" : p.Numeracion || "",
    Manzana: country ? String(p.Calle || "").slice(PREFIJO_MANZANA.length) : "",
    Lote: country ? String(p.Numeracion || "").replace(PREFIJO_LOTE, "") : "",
    IdTipo: Number(p.IdTipo) || 1,
    Piso: p.Piso || "",
    NroDepto: p.NroDepto || "",
    IdLocalidad: Number(p.IdLocalidad) || 1,
    Estado: p.Estado || "Disponible",
    PanelesSolares: Boolean(p.PanelesSolares),
    AislamientoTermico: Boolean(p.AislamientoTermico),
    Moneda: p.Moneda || "ARS",
    Tour360: p.Tour360 || "",
    Precio: p.Precio || "",
    Superficie: p.Superficie || "",
  };
}

function PropiedadModal({ propiedad, onCerrar, onGuardado }) {
  const { toast } = useUI();
  const { registrar } = useActividad();
  const [form, setForm] = useState(() => estadoInicial(propiedad));
  const [caract, setCaract] = useState(() => parsearCaracteristicas(propiedad?.Descripcion) || caracteristicasPorDefecto());
  const [servicios, setServicios] = useState(() => parsearServicios(propiedad?.Servicios));
  const [archivos, setArchivos] = useState({});
  const [galeria, setGaleria] = useState([]);
  const [duenios, setDuenios] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [claseTocada, setClaseTocada] = useState(false);
  const [docsTocados, setDocsTocados] = useState(false);

  const editando = Boolean(propiedad);

  useEffect(() => {
    let cancelado = false;
    propietarios.listar().then((l) => { if (!cancelado) setDuenios(l); }).catch(() => {});
    if (propiedad?.IdPropiedad) {
      imagenesDePropiedad(propiedad.IdPropiedad)
        .then((fotos) => {
          if (cancelado) return;
          setGaleria(fotos.map((f, i) => ({
            base64: normalizarImagen(f.Url), nombre: `Foto ${i + 1} (existente)`, idImagen: f.IdImagen, existente: true,
          })));
        })
        .catch(() => {});
    }
    return () => { cancelado = true; };
  }, [propiedad]);

  useEffect(() => {
    if (!mensaje) return undefined;
    const t = setTimeout(() => setMensaje(""), 3000);
    return () => clearTimeout(t);
  }, [mensaje]);

  const clase = calcularClaseEnergetica(form.PanelesSolares, form.AislamientoTermico);
  const bonificacion = calcularBonificacion(clase);
  const colorClase = ECO_COLORES[clase];
  const claseVisible = claseTocada ? clase : editando ? propiedad.CategoriaEco || "C" : "";

  const docsCompletos = calcularPublicada(
    archivos.matricula || propiedad?.MatriculaVerificada,
    archivos.titulo || propiedad?.TituloPropiedad
  );

  const esDepto = String(form.IdTipo) === "2";
  const esLoteTerreno = String(form.IdTipo) === "3" || String(form.IdTipo) === "4";
  const esCountryForm = form.tipoUbicacion === "country";

  const opcionesPropietario = useMemo(
    () =>
      duenios.map((d) => ({
        value: d.IdPropietario,
        label: `${d.Apellido || ""} ${d.Nombre || ""}`.trim(),
        sub: `DNI: ${d.DNI || "—"} · ${d.Localidad || ""}`,
      })),
    [duenios]
  );

  function set(clave, valor) {
    setForm((f) => ({ ...f, [clave]: valor }));
  }

  function setEco(clave, valor) {
    set(clave, valor);
    setClaseTocada(true);
  }

  function cambiarTipo(valor) {
    set("IdTipo", valor);
    if (valor !== "2") {
      setForm((f) => ({ ...f, Piso: "", NroDepto: "" }));
      setCaract((prev) => sinClavesDepto(prev));
    }
  }

  function archivoValido(e, permitidas, etiqueta) {
    const file = e.target.files[0];
    if (file && !extensionValida(file, permitidas)) {
      toast(`❌ Archivo no permitido en "${etiqueta}". Solo se aceptan: ${permitidas.join(", ").toUpperCase()}`, "error", 5000);
      e.target.value = "";
      return false;
    }
    return true;
  }

  function elegirImagen(e) {
    setArchivos((a) => ({ ...a, imagen: archivoValido(e, EXTS_IMAGEN, "Foto") ? e.target.files[0] : null }));
  }

  function elegirDoc(e, clave, etiqueta) {
    if (!archivoValido(e, EXTS_DOC, etiqueta)) {
      setArchivos((a) => ({ ...a, [clave]: null }));
      return;
    }
    const nuevos = { ...archivos, [clave]: e.target.files[0] || null };
    setArchivos(nuevos);
    setDocsTocados(true);
    if (nuevos.matricula && nuevos.titulo) toast("✅ Documentación completa — propiedad publicable", "ok");
    else setMensaje("⚠ Cargá matrícula y título para poder publicar");
  }

  function toggleServicio(clave) {
    setServicios((s) => (s.includes(clave) ? s.filter((x) => x !== clave) : [...s, clave]));
  }

  async function quitarFotoExistente(foto) {
    try {
      await eliminarImagenPropiedad(foto.idImagen);
    } catch {
      toast("No se pudo eliminar la foto de la base", "error");
    }
  }

  async function guardar() {
    if (guardando) return;

    const calle = esCountryForm ? (form.Manzana ? PREFIJO_MANZANA + form.Manzana.trim() : "") : form.Calle.trim();
    const numeracion = esCountryForm ? (form.Lote ? PREFIJO_LOTE + form.Lote.trim() : "") : String(form.Numeracion).trim();

    const caractFinal = esDepto
      ? {
          ...caract,
          balcones: caract.balcones ?? "0",
          ...Object.fromEntries(SERVICIOS_EDIFICIO.map((s) => [s.clave, caract[s.clave] === "Si" ? "Si" : "No"])),
        }
      : sinClavesDepto(caract);

    const body = {
      IdPropietario: Number(form.IdPropietario) || null,
      Barrio: form.Barrio.trim(),
      Calle: calle,
      Numeracion: numeracion,
      Piso: esDepto ? form.Piso.trim() : "",
      NroDepto: esDepto ? form.NroDepto.trim() : "",
      IdTipo: Number(form.IdTipo) || 1,
      IdLocalidad: Number(form.IdLocalidad) || 1,
      Precio: Number(form.Precio) || 0,
      Moneda: form.Moneda || "ARS",
      Tour360: limpiarTour(form.Tour360) || null,
      Superficie: Number(form.Superficie) || 0,
      Descripcion: serializarCaracteristicas(caractFinal),
      Estado: form.Estado || "Disponible",
      PanelesSolares: form.PanelesSolares,
      AislamientoTermico: form.AislamientoTermico,
      CategoriaEco: clase,
      Bonificacion: bonificacion,
      Servicios: serializarServicios(servicios),
      MatriculaVerificada: editando ? true : Boolean(archivos.matricula),
      TituloPropiedad: editando ? true : Boolean(archivos.titulo),
      Publicada: true,
    };

    const problema = validarPropiedad(body) || (!body.IdPropietario && "Debe seleccionar el propietario del inmueble");
    if (problema) { setMensaje("❌ " + problema); return; }

    setGuardando(true);
    try {
      const [principal, mat, tit] = await Promise.all([
        archivos.imagen ? comprimirImagen(archivos.imagen, 1400, 0.8) : Promise.resolve(null),
        leerComoBase64(archivos.matricula),
        leerComoBase64(archivos.titulo),
      ]);

      body.Imagen = principal || propiedad?.Imagen || null;
      body.ArchivoMatricula = mat || propiedad?.ArchivoMatricula || null;
      body.ArchivoTitulo = tit || propiedad?.ArchivoTitulo || null;

      let idPropiedad = propiedad?.IdPropiedad || null;

      if (editando) {
        await propiedades.actualizar(idPropiedad, { ...body, IdPropiedad: idPropiedad });
        toast("✏️ Propiedad actualizada", "ok");
      } else {
        const res = await propiedades.crear(body);
        idPropiedad = primeraFila(res)?.IdPropiedad || null;
        registrar("Propiedad publicada", `${body.Barrio} · ${body.Calle}`.trim(), "fa-building");
      }

      if (idPropiedad) {
        const nuevas = galeria.filter((f) => !f.existente);
        const yaGuardadas = galeria.filter((f) => f.existente).length;
        for (let i = 0; i < nuevas.length; i++) {
          try {
            await crearImagenPropiedad({
              IdPropiedad: idPropiedad, Url: nuevas[i].base64, Orden: yaGuardadas + i, EsPrincipal: false,
            });
          } catch { /* se ignora */ }
        }
      }

      onCerrar();
      onGuardado();
      toast("✅ Propiedad guardada correctamente", "ok", 4000);
    } catch (err) {
      setMensaje(err.status ? `❌ Error del servidor: ${err.status}` : "❌ Error al guardar propiedad");
    } finally {
      setGuardando(false);
    }
  }

  function textoDoc(clave, conArchivo, sinArchivo) {
    if (docsTocados) return archivos[clave] ? `✅ ${archivos[clave].name}` : "";
    if (!editando) return "";
    return (clave === "matricula" ? propiedad.MatriculaVerificada : propiedad.TituloPropiedad) ? conArchivo : sinArchivo;
  }

  return (
    <Modal
      abierto
      titulo={editando ? "Editar propiedad" : "Cargar propiedad"}
      onCerrar={onCerrar}
      ancho={820}
    >
      <div id="formPropiedad" className="row g-3 align-items-end">

        <div className="col-md-6">
          <label className="form-label"><i className="fa fa-user me-1" />Propietario</label>
          <SearchSelect
            icono="fa-user"
            value={form.IdPropietario}
            onChange={(v) => set("IdPropietario", v)}
            opciones={opcionesPropietario}
            placeholder="Buscar propietario..."
          />
        </div>

        <div className="col-12">
          <label className="form-label">Tipo de ubicación</label>
          <div className="d-flex gap-3">
            <label className="ubicacion-tipo-btn">
              <input
                type="radio" name="pTipoUbicacion" value="barrio"
                checked={!esCountryForm}
                onChange={() => set("tipoUbicacion", "barrio")}
              />
              <span><i className="fa fa-road me-1" />Barrio</span>
            </label>
            <label className="ubicacion-tipo-btn">
              <input
                type="radio" name="pTipoUbicacion" value="country"
                checked={esCountryForm}
                onChange={() => set("tipoUbicacion", "country")}
              />
              <span><i className="fa fa-tree me-1" />Country / Barrio cerrado</span>
            </label>
          </div>
        </div>

        <div className="col-md-3">
          <label className="form-label">{esCountryForm ? "Country / B. Cerrado" : "Barrio"}</label>
          <input className="form-control" value={form.Barrio} onChange={(e) => set("Barrio", e.target.value)} />
        </div>

        {esCountryForm ? (
          <div id="camposCountry">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Manzana</label>
                <input className="form-control" value={form.Manzana} onChange={(e) => set("Manzana", alfanumerico(e.target.value, 6))} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Lote</label>
                <input className="form-control" inputMode="numeric" value={form.Lote} onChange={(e) => set("Lote", alfanumerico(e.target.value, 6))} />
              </div>
            </div>
          </div>
        ) : (
          <div id="camposBarrio">
            <div className="row g-3">
              <div className="col-md-5">
                <label className="form-label">Calle</label>
                <input className="form-control" value={form.Calle} onChange={(e) => set("Calle", e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Numeración</label>
                <input className="form-control" value={form.Numeracion} onChange={(e) => set("Numeracion", alfanumerico(e.target.value, 6))} />
              </div>
            </div>
          </div>
        )}

        <div className="col-md-2">
          <label className="form-label">Tipo</label>
          <select className="form-select" value={form.IdTipo} onChange={(e) => cambiarTipo(e.target.value)}>
            {Object.entries(TIPOS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </div>

        {esDepto && (
          <div id="camposDepto" className="col-12">
            <div className="row g-3">
              <div className="col-md-2">
                <label className="form-label"><i className="fa fa-layer-group me-1" />Piso</label>
                <input className="form-control" placeholder="Ej: 3" inputMode="numeric" value={form.Piso} onChange={(e) => set("Piso", soloDigitos(e.target.value, 3))} />
              </div>
              <div className="col-md-2">
                <label className="form-label"><i className="fa fa-door-open me-1" />N° Depto</label>
                <input className="form-control" placeholder="Ej: 4B, 305" value={form.NroDepto} onChange={(e) => set("NroDepto", alfanumerico(e.target.value, 6).toUpperCase())} />
              </div>
            </div>
          </div>
        )}

        <div className="col-md-2">
          <label className="form-label">Localidad</label>
          <select className="form-select" value={form.IdLocalidad} onChange={(e) => set("IdLocalidad", e.target.value)}>
            {LOCALIDADES_ORDENADAS.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        </div>

        <div className="col-md-2">
          <label className="form-label">Estado</label>
          <select className="form-select" value={form.Estado} onChange={(e) => set("Estado", e.target.value)}>
            {ESTADOS_PROPIEDAD.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <div className="col-md-2">
          <label className="form-label">Paneles Solares</label>
          <select className="form-select" value={String(form.PanelesSolares)} onChange={(e) => setEco("PanelesSolares", e.target.value === "true")}>
            <option value="false">No</option>
            <option value="true">Sí</option>
          </select>
        </div>

        <div className="col-md-2">
          <label className="form-label">Aislamiento térmico</label>
          <select className="form-select" value={String(form.AislamientoTermico)} onChange={(e) => setEco("AislamientoTermico", e.target.value === "true")}>
            <option value="false">No</option>
            <option value="true">Sí</option>
          </select>
        </div>

        <div className="col-md-2">
          <label className="form-label">Clase energética</label>
          <input className="form-control" readOnly value={claseVisible} style={{ background: "var(--surface-2)" }} />
          <span style={{
            display: claseTocada ? "inline-flex" : "none", marginTop: ".35rem", fontSize: 11, fontWeight: 700,
            padding: ".25em .75em", borderRadius: 10, alignItems: "center", gap: ".3rem",
            background: colorClase.bg, color: colorClase.text,
          }}>
            Clase {clase}
          </span>
        </div>

        <div className="col-md-3">
          <label className="form-label">Precio</label>
          <div className="input-group">
            <div className="input-group-text" style={{ padding: ".25rem .5rem", background: "var(--surface-2)", borderColor: "var(--border)" }}>
              {MONEDAS.map((m) => (
                <label key={m} className="moneda-btn" style={{ margin: 0, padding: ".2rem .5rem", fontSize: 11 }}>
                  <input type="radio" name="pMonedaProp" value={m} checked={form.Moneda === m} onChange={() => set("Moneda", m)} />
                  <span style={{ padding: ".15em .5em", fontSize: 11 }}>{m === "ARS" ? "$" : "USD"}</span>
                </label>
              ))}
            </div>
            <input
              className="form-control" type="text" inputMode="decimal"
              value={form.Precio}
              onChange={(e) => set("Precio", monto(e.target.value, true).replace(/^0+/, ""))}
            />
          </div>
        </div>

        <div className="col-md-2">
          <label className="form-label">Superficie</label>
          <input className="form-control" type="text" inputMode="decimal" value={form.Superficie} onChange={(e) => set("Superficie", monto(e.target.value, true))} />
        </div>

        {!esLoteTerreno && (
          <div className="col-12">
            <label className="form-label"><i className="fa fa-list-ul me-1" />Características</label>
            <div className="caracteristicas-grid">
              {CARACTERISTICAS.map((c) => (
                <div className="caract-grupo" key={c.clave}>
                  <span className="caract-label"><i className={`fa ${c.icono} me-1`} />{c.label}</span>
                  <div className="caract-opciones">
                    {c.opciones.map((op) => (
                      <label className="caract-chip" key={op}>
                        <input
                          type="radio" name={`caract-${c.clave}`} value={op}
                          checked={(caract[c.clave] ?? c.defecto) === op}
                          onChange={() => setCaract((prev) => ({ ...prev, [c.clave]: op }))}
                        />
                        <span>{op === "Si" ? "Sí" : op}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {esDepto && (
                <div id="caractDepto" style={{ width: "100%" }}>
                  {CARACTERISTICAS_DEPTO.map((c) => (
                    <div className="caract-grupo" key={c.clave}>
                      <span className="caract-label"><i className={`fa ${c.icono} me-1`} />{c.label}</span>
                      <div className="caract-opciones">
                        {c.opciones.map((op) => (
                          <label className="caract-chip" key={op}>
                            <input
                              type="radio" name={`caract-${c.clave}`} value={op}
                              checked={(caract[c.clave] ?? c.defecto) === op}
                              onChange={() => setCaract((prev) => ({ ...prev, [c.clave]: op }))}
                            />
                            <span>{op}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="col-md-4">
          <label className="form-label">
            <i className="fa fa-image me-1" />Foto principal <small className="text-muted d-block" style={{ fontSize: 10 }}>Solo JPG o PNG</small>
          </label>
          <input type="file" className="form-control" accept=".jpg,.jpeg,.png" onChange={elegirImagen} />
          <small className="ayuda">
            {archivos.imagen ? `✅ ${archivos.imagen.name}` : propiedad?.Imagen ? "✅ Ya tiene foto principal" : ""}
          </small>
        </div>

        <div className="col-12">
          <label className="form-label"><i className="fa fa-images me-1" />Fotos adicionales — galería ilimitada</label>
          <GaleriaFotos fotos={galeria} onChange={setGaleria} onQuitarExistente={quitarFotoExistente} />
          <small className="text-muted" style={{ fontSize: 11 }}>
            Podés agregar todas las fotos que quieras. Hacé clic en ✕ para eliminar una.
          </small>
        </div>

        <div className="col-12">
          <label className="form-label">
            <i className="fa fa-street-view me-1" />Recorrido virtual 360 <small className="text-muted d-block" style={{ fontSize: 10 }}>Opcional — URL o ruta de /img</small>
          </label>
          <Tour360Editor valor={form.Tour360} onCambiar={(v) => set("Tour360", v)} />
        </div>

        <div className="col-12">
          <label className="form-label"><i className="fa fa-plug me-1" />Servicios disponibles</label>
          <div className="servicios-grid">
            {SERVICIOS.map((s) => (
              <label className="servicio-check" key={s.clave}>
                <input type="checkbox" checked={servicios.includes(s.clave)} onChange={() => toggleServicio(s.clave)} />
                <i className={`fa ${s.icono}`} style={{ color: s.color }} /> {s.clave}
              </label>
            ))}
          </div>
          {esDepto && (
            <div id="serviciosDepto" style={{ marginTop: ".5rem" }}>
              <small className="text-muted d-block mb-1" style={{ fontSize: 11, fontWeight: 600 }}>
                <i className="fa fa-building me-1" />Servicios comunes del edificio
              </small>
              <div className="servicios-grid">
                {SERVICIOS_EDIFICIO.map((s) => (
                  <label className="servicio-check" key={s.clave}>
                    <input
                      type="checkbox"
                      checked={caract[s.clave] === "Si"}
                      onChange={(e) => setCaract((prev) => ({ ...prev, [s.clave]: e.target.checked ? "Si" : "No" }))}
                    />
                    <i className={`fa ${s.icono}`} style={{ color: s.color }} /> {LABEL_EDIFICIO[s.clave] || s.label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-md-6">
          <label className="form-label">
            <i className="fa fa-file-pdf me-1 text-danger" />Matrícula verificada <small className="text-muted d-block" style={{ fontSize: 10 }}>PDF o Word</small>
          </label>
          <input type="file" className="form-control" accept=".pdf,.doc,.docx" onChange={(e) => elegirDoc(e, "matricula", "Matrícula")} />
          <small className="text-muted" style={{ fontSize: 11 }}>
            {textoDoc("matricula", "✅ Ya tiene matrícula cargada — podés reemplazarla o dejarlo así", "⚠ Sin matrícula — subí el archivo")}
          </small>
        </div>
        <div className="col-md-6">
          <label className="form-label">
            <i className="fa fa-file-word me-1 text-primary" />Título digital <small className="text-muted d-block" style={{ fontSize: 10 }}>PDF o Word</small>
          </label>
          <input type="file" className="form-control" accept=".pdf,.doc,.docx" onChange={(e) => elegirDoc(e, "titulo", "Título digital")} />
          <small className="text-muted" style={{ fontSize: 11 }}>
            {textoDoc("titulo", "✅ Ya tiene título cargado — podés reemplazarlo o dejarlo así", "⚠ Sin título — subí el archivo")}
          </small>
        </div>

        <div className="col-12">
          <div className={`aviso ${docsCompletos ? "aviso-ok" : "aviso-warn"}`}>
            {docsCompletos
              ? "✅ Documentación completa — propiedad publicable."
              : "⚠ Cargá matrícula y título para poder publicar."}
          </div>
        </div>

        <div id="propFormMsg" className="col-12">
          {mensaje && <div className="alertaMsg alertaRoja">{mensaje}</div>}
        </div>

        <div className="modal-edicion-footer">
          <button type="button" className="btn btn-light" onClick={onCerrar}>Cancelar</button>
          <button type="button" className="btn btn-condado px-4" onClick={guardar} disabled={guardando}>
            {guardando
              ? <><i className="fa fa-spinner fa-spin me-1" />Guardando...</>
              : <><i className="fa fa-save me-2" />Guardar propiedad</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default PropiedadModal;
