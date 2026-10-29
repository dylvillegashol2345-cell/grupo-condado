export const TIPOS = {
  1: "Casa",
  2: "Departamento",
  3: "Lote",
  4: "Terreno",
};

export const LOCALIDADES = {
  1: "Villa María",
  2: "Córdoba Capital",
  3: "Río Cuarto",
  4: "Río Tercero",
  5: "Cosquín",
  6: "Villa Allende",
  7: "Alta Gracia",
  8: "Villa Carlos Paz",
  9: "Jesús María",
  10: "San Francisco",
  11: "Bell Ville",
  12: "Marcos Juárez",
  13: "La Carlota",
  14: "Laboulaye",
  15: "Villa Dolores",
  16: "Cruz del Eje",
  17: "Dean Funes",
  18: "Arroyito",
  19: "Oliva",
  20: "Monte Maíz",
  21: "Las Varillas",
  22: "Leones",
  23: "Justiniano Posse",
  24: "Oncativo",
  25: "Río Segundo",
  26: "Río Primero",
  27: "La Falda",
  28: "Capilla del Monte",
  29: "Mina Clavero",
  30: "Villa de Soto",
  31: "Unquillo",
  32: "Mendiolaza",
  33: "La Calera",
  34: "Malagueño",
  35: "Pilar",
  36: "Villa del Totoral",
  37: "Laguna Larga",
  38: "Morteros",
  39: "Brinkmann",
  40: "San Marcos Sierras",
};

export const LOCALIDADES_ORDENADAS = Object.entries(LOCALIDADES)
  .map(([id, nombre]) => ({ id: Number(id), nombre }))
  .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

export const COORDS_LOCALIDAD = {
  1:  { lat: -32.4092, lng: -63.2392 },
  2:  { lat: -31.4135, lng: -64.1811 },
  3:  { lat: -33.1307, lng: -64.3499 },
  4:  { lat: -32.1875, lng: -64.1088 },
  5:  { lat: -31.2395, lng: -64.4627 },
  6:  { lat: -31.2940, lng: -64.2942 },
  7:  { lat: -31.6533, lng: -64.4297 },
  8:  { lat: -31.4218, lng: -64.5027 },
  9:  { lat: -30.9817, lng: -64.0971 },
  10: { lat: -31.4277, lng: -62.0841 },
  11: { lat: -32.6236, lng: -62.6864 },
  12: { lat: -32.6989, lng: -62.1008 },
  13: { lat: -33.4046, lng: -63.3190 },
  14: { lat: -34.1254, lng: -63.3898 },
  15: { lat: -31.9462, lng: -65.1823 },
  16: { lat: -30.7265, lng: -64.7999 },
  17: { lat: -30.4237, lng: -64.3503 },
  18: { lat: -31.4382, lng: -63.0518 },
  19: { lat: -32.0376, lng: -63.5680 },
  20: { lat: -33.1827, lng: -62.6025 },
  21: { lat: -31.8594, lng: -62.7067 },
  22: { lat: -32.6966, lng: -62.2975 },
  23: { lat: -32.8764, lng: -62.6855 },
  24: { lat: -31.9231, lng: -63.6844 },
  25: { lat: -32.3842, lng: -63.9100 },
  26: { lat: -31.6383, lng: -63.6138 },
  27: { lat: -31.0932, lng: -64.4847 },
  28: { lat: -30.8597, lng: -64.5233 },
  29: { lat: -31.9990, lng: -65.0073 },
  30: { lat: -30.7093, lng: -64.9680 },
  31: { lat: -31.3319, lng: -64.3219 },
  32: { lat: -31.2813, lng: -64.2611 },
  33: { lat: -31.3464, lng: -64.3366 },
  34: { lat: -31.5891, lng: -64.3652 },
  35: { lat: -31.6754, lng: -63.8817 },
  36: { lat: -30.5948, lng: -63.9773 },
  37: { lat: -31.7961, lng: -63.7102 },
  38: { lat: -30.6913, lng: -62.0134 },
  39: { lat: -30.3921, lng: -62.0227 },
  40: { lat: -30.9605, lng: -64.7173 },
};

export const ESTADOS_PROPIEDAD = ["Disponible", "Reservada", "Vendida", "Alquilada"];

export const TIPOS_OPERACION = ["Venta", "Alquiler"];

export const MONEDAS = ["ARS", "USD"];

export const ECO_COLORES = {
  A: { bg: "#1b5e20", text: "white",   label: "Clase A" },
  B: { bg: "#388e3c", text: "white",   label: "Clase B" },
  C: { bg: "#a5d6a7", text: "#1b5e20", label: "Clase C" },
};

export function pinHtml(clase, tam = 36) {
  const c = ECO_COLORES[clase] || { bg: "#6c2d20", text: "white" };
  return (
    `<div style="background:${c.bg};width:${tam}px;height:${tam}px;` +
    "border-radius:50% 50% 50% 0;transform:rotate(-45deg);" +
    "border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,.4);" +
    'display:flex;align-items:center;justify-content:center;">' +
    `<i class='fa fa-home' style='transform:rotate(45deg);color:${c.text};font-size:${Math.round(tam * 0.36)}px;'></i></div>`
  );
}

export const SERVICIOS = [
  { clave: "Luz",      icono: "fa-bolt",  color: "#f9a825" },
  { clave: "Agua",     icono: "fa-tint",  color: "#1565c0" },
  { clave: "Gas",      icono: "fa-fire",  color: "#e65100" },
  { clave: "Cloacas",  icono: "fa-water", color: "#00838f" },
  { clave: "Internet", icono: "fa-wifi",  color: "#1565c0" },
  { clave: "Asfalto",  icono: "fa-road",  color: "#546e7a" },
];

export const CARACTERISTICAS = [
  { clave: "dormitorios", label: "Dormitorios", icono: "fa-bed",           opciones: ["0", "1", "2", "3", "4", "5+"], defecto: "2" },
  { clave: "banos",       label: "Baños",       icono: "fa-bath",          opciones: ["1", "2", "3", "4+"],           defecto: "1" },
  { clave: "cochera",     label: "Cochera",     icono: "fa-car",           opciones: ["No", "1", "2", "3+"],          defecto: "No" },
  { clave: "quincho",     label: "Quincho",     icono: "fa-fire-alt",      opciones: ["No", "Si"],                    defecto: "No" },
  { clave: "pileta",      label: "Pileta",      icono: "fa-swimming-pool", opciones: ["No", "Si"],                    defecto: "No" },
  { clave: "jardin",      label: "Jardín",      icono: "fa-tree",          opciones: ["No", "Si"],                    defecto: "No" },
  { clave: "amoblado",    label: "Amoblado",    icono: "fa-couch",         opciones: ["No", "Si"],                    defecto: "No" },
  { clave: "antiguedad",  label: "Antigüedad",  icono: "fa-building",      opciones: ["A estrenar", "1-5 años", "6-15 años", "16-30 años", "+30 años"], defecto: "A estrenar" },
];

export const CATEGORIAS_ECOMARKET = [
  "Muebles",
  "Electrodomésticos",
  "Ropa",
  "Electrónica",
  "Jardinería",
  "Deportes",
  "Otros",
];

export const ESTADOS_ECOMARKET = ["Disponible", "Reservado", "Entregado"];

export const ROLES = ["Administrador", "Agente", "Cliente"];

export const ROL_A_ID = { Administrador: 1, Agente: 2, Cliente: 3 };

export const TIPOS_DOCUMENTO = ["DNI", "CUIL", "CUIT", "Pasaporte"];

export const DESTINOS_CONTRATO = ["Vivienda familiar", "Comercial", "Mixto"];
export const INDICES_ACTUALIZACION = [
  { valor: "ICL",     label: "ICL (Índice de Contratos de Locación)" },
  { valor: "IPC",     label: "IPC (Índice de Precios al Consumidor)" },
  { valor: "Acuerdo", label: "A convenir entre partes" },
];
export const DOCUMENTOS_INQUILINO = [
  { clave: "Factura Luz",    label: "Factura de Luz",      icono: "fa-bolt",     color: "#f9a825" },
  { clave: "Factura Gas",    label: "Factura de Gas",      icono: "fa-fire",     color: "#e65100" },
  { clave: "Factura Agua",   label: "Factura de Agua",     icono: "fa-tint",     color: "#1565c0" },
  { clave: "Recibos sueldo", label: "Recibos de sueldo",   icono: "fa-file-alt", color: "#2e7d32" },
  { clave: "Garantía",       label: "Garantía propietaria", icono: "fa-home",    color: "#6a1b9a" },
  { clave: "DNI",            label: "DNI",                 icono: "fa-id-card",  color: "#546e7a" },
];

export function tipoLabel(id) {
  return TIPOS[Number(id)] || "Desconocido";
}

export function localidadLabel(id) {
  return LOCALIDADES[Number(id)] || "Otra localidad";
}

export const IMG_PROPIEDAD_FALLBACK =
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=70";
export const IMG_ECOMARKET_FALLBACK =
  "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=600&q=60";

export const CARACTERISTICAS_DEPTO = [
  { clave: "balcones", label: "Balcones", icono: "fa-door-open", opciones: ["0", "1", "2", "3+"], defecto: "0" },
];

export const SERVICIOS_EDIFICIO = [
  { clave: "gimnasio",     label: "Gimnasio",         icono: "fa-dumbbell",       color: "#6a1b9a" },
  { clave: "piletaEdif",   label: "Pileta edif.",     icono: "fa-swimming-pool",  color: "#1565c0" },
  { clave: "terraza",      label: "Terraza",          icono: "fa-sun",            color: "#f9a825" },
  { clave: "salonFiestas", label: "Salón de fiestas", icono: "fa-glass-cheers",   color: "#c62828" },
  { clave: "laundry",      label: "Lavandería",       icono: "fa-tshirt",         color: "#00838f" },
];

export const COORDS_BARRIO = {
  "alberdi":                { lat: -31.4217, lng: -64.1827 },
  "nueva córdoba":          { lat: -31.4197, lng: -64.1858 },
  "jockey club":            { lat: -31.3867, lng: -64.2156 },
  "general paz":            { lat: -31.4089, lng: -64.1956 },
  "las delicias":           { lat: -31.3456, lng: -64.2789 },
  "san vicente":            { lat: -31.4156, lng: -64.1678 },
  "cerro de las rosas":     { lat: -31.3867, lng: -64.2234 },
  "valle escondido":        { lat: -31.3234, lng: -64.2567 },
  "country los pinos":      { lat: -31.3345, lng: -64.2678 },
  "country el bosque":      { lat: -31.3456, lng: -64.2890 },
  "country san isidro":     { lat: -31.3123, lng: -64.3012 },
  "country la serranía":    { lat: -31.5234, lng: -64.4567 },
  "country villa warcalde": { lat: -31.3567, lng: -64.2123 },
  "rogelio martínez":       { lat: -31.3678, lng: -64.2345 },
  "villa warcalde":         { lat: -31.3567, lng: -64.2123 },
  "alta córdoba":           { lat: -31.3956, lng: -64.1834 },
  "güemes":                 { lat: -31.4234, lng: -64.1934 },
  "palermo":                { lat: -31.4089, lng: -64.1756 },
  "argüello":               { lat: -31.3678, lng: -64.2123 },
  "cofico":                 { lat: -31.4034, lng: -64.1912 },
  "observatorio":           { lat: -31.4267, lng: -64.1934 },
  "villa belgrano":         { lat: -31.3734, lng: -64.2267 },
  "chateau carreras":       { lat: -31.4234, lng: -64.2345 },
  "urca":                   { lat: -31.3612, lng: -64.2456 },
  "berna":                  { lat: -31.3512, lng: -64.2234 },
  "inaudi":                 { lat: -31.4456, lng: -64.2567 },
  "jardín hipódromo":       { lat: -31.3812, lng: -64.1934 },
  "quebrada de las rosas":  { lat: -31.3734, lng: -64.2178 },
  "villa allende park":     { lat: -31.3123, lng: -64.2890 },
  "bimaco":                 { lat: -31.3234, lng: -64.2678 },
  "carlos paz centro":      { lat: -31.4234, lng: -64.4956 },
  "parque siquiman":        { lat: -31.4123, lng: -64.5234 },
  "villa del parque":       { lat: -31.3012, lng: -64.2789 },
  "quintas de arguello":    { lat: -31.3456, lng: -64.2123 },
  "marqués de sobremonte":  { lat: -31.4089, lng: -64.1934 },
};

export function coordsDePropiedad(p) {
  const barrio = (p?.barrio || p?.Barrio || "").trim().toLowerCase();
  const base = COORDS_BARRIO[barrio]
    || COORDS_LOCALIDAD[p?.localidadId || p?.IdLocalidad]
    || COORDS_LOCALIDAD[2];

  const id = Number(p?.id || p?.IdPropiedad || 0);
  const radio = 0.004 + (id % 5) * 0.0025;
  const angulo = (id * 137.5) * (Math.PI / 180);
  return {
    lat: base.lat + radio * Math.cos(angulo),
    lng: base.lng + radio * Math.sin(angulo),
    exacta: Boolean(COORDS_BARRIO[barrio]),
  };
}

export const ESTADOS_CIVILES = ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a"];
export const TIPOS_SENA = ["Penitencial", "Confirmatoria"];
export const ESTADOS_INMUEBLE = ["Sin ocupantes", "Con ocupantes", "En alquiler"];
export const ESTADOS_DEUDA = ["Sin deudas", "Con deudas"];
export const CARGO_GASTOS = ["Comprador", "Vendedor", "50% cada parte"];

export const MOTIVOS_CONTRATO_VENCIDO = [
  { valor: "En renovación",          icono: "🔄" },
  { valor: "Propiedad en arreglos",  icono: "🔧" },
  { valor: "Sin electricidad",       icono: "⚡" },
  { valor: "Cañerías en reparación", icono: "🚿" },
  { valor: "Desocupada a pedido",    icono: "📋" },
  { valor: "En proceso legal",       icono: "⚖️" },
  { valor: "Pendiente propietario",  icono: "👤" },
  { valor: "Otro",                   icono: "📝" },
];
