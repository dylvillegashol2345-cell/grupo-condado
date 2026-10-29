import { useEffect, useRef, useState } from "react";

function GaleriaDetalle({ fotos, alt }) {
  const [idx, setIdx] = useState(0);
  const tira = useRef(null);
  const total = fotos.length;

  useEffect(() => {
    const activa = tira.current?.children?.[idx];
    if (activa?.scrollIntoView) activa.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [idx]);

  function navegar(dir) {
    setIdx((i) => (i + dir + total) % total);
  }

  return (
    <div className="detalle-v2-galeria">
      <div className="detalle-v2-img-principal-wrap" style={{ position: "relative" }}>
        <img src={fotos[idx] || fotos[0]} className="detalle-v2-img-principal" alt={alt} />
        {total > 1 && (
          <>
            <button className="galeria-arrow galeria-arrow-prev" onClick={() => navegar(-1)} title="Anterior">&#8249;</button>
            <button className="galeria-arrow galeria-arrow-next" onClick={() => navegar(1)} title="Siguiente">&#8250;</button>
            <div className="galeria-counter">{idx + 1} / {total}</div>
          </>
        )}
      </div>
      {total > 1 && (
        <div className="detalle-v2-miniaturas" ref={tira}>
          {fotos.map((f, i) => (
            <img
              key={i}
              src={f}
              alt={`Foto ${i + 1}`}
              className={`detalle-v2-miniatura${i === idx ? " activa" : ""}`}
              onClick={() => setIdx(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default GaleriaDetalle;
