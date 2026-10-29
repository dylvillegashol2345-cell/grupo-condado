// RN1: paneles y aislación = A, uno solo = B, ninguno = C
export function calcularClaseEnergetica(panelesSolares, aislamientoTermico) {
  if (panelesSolares && aislamientoTermico) return "A";
  if (panelesSolares || aislamientoTermico) return "B";
  return "C";
}

// RN2: solo la clase A tiene 15% de bonificación
export function calcularBonificacion(claseEnergetica) {
  return claseEnergetica === "A" ? 15 : 0;
}

// RN3: se publica solo con matrícula verificada y título
export function calcularPublicada(tieneMatricula, tieneTitulo) {
  return Boolean(tieneMatricula && tieneTitulo);
}

// RN4: no se opera sobre una propiedad vendida o alquilada
export function propiedadDisponible(propiedad) {
  if (!propiedad) return false;
  return propiedad.Estado !== "Vendida" && propiedad.Estado !== "Alquilada";
}

// RN5: la operación cambia el estado de la propiedad
export function estadoSegunOperacion(tipoOperacion) {
  return tipoOperacion === "Venta" ? "Vendida" : "Alquilada";
}
