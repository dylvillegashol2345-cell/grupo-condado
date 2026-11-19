// Con VITE_API_URL=/api las llamadas pasan por el proxy de Vite
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:56153/api";

export default API_URL;

export class ApiError extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.name = "ApiError";
    this.status = status;
  }
}

const MSG_SIN_API =
  "No se pudo conectar con la API. Verificá que el proyecto WebApi esté corriendo en " +
  (API_URL.replace(/\/api$/, "") || "localhost:56153") + ".";

// La sesión que guarda AuthProvider trae el token que devolvió /api/Login
function sesionGuardada() {
  try {
    return JSON.parse(localStorage.getItem("usuarioLogueado") || "null");
  } catch {
    return null;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const sesion = sesionGuardada();
  const headers = {
    ...(body && { "Content-Type": "application/json" }),
    ...(sesion?.Token && { Authorization: `Bearer ${sesion.Token}` }),
  };

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(MSG_SIN_API, 0);
  }

  // Con un usuario conectado, un 401 es una sesión vencida o cerrada: se vuelve al ingreso.
  // El invitado no tiene sesión, así que a él no se lo saca.
  if (res.status === 401 && sesion) {
    localStorage.removeItem("usuarioLogueado");
    if (!window.location.pathname.startsWith("/login")) window.location.assign("/login");
    throw new ApiError("Tu sesión venció. Volvé a ingresar.", 401);
  }
  if (res.status === 403) {
    throw new ApiError("No tenés permiso para esta acción", 403);
  }

  if (!res.ok) {
    // Los errores controlados (400 datos inválidos, 409 propiedad no disponible) traen el motivo en "Message"
    const motivo = await res.json().catch(() => null);
    const texto = typeof motivo === "string" ? motivo : motivo?.Message;
    const controlado = res.status === 400 || res.status === 409;
    throw new ApiError(controlado && texto ? texto : `La API respondió ${res.status}`, res.status);
  }

  // 204 y respuestas vacías (los controllers `void`)
  if (res.status === 204) return null;
  const texto = await res.text();
  if (!texto) return null;

  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

export function comoLista(data) {
  return Array.isArray(data) ? data : data ? [data] : [];
}

// Los GET por id de la API devuelven un array de una fila
export function primeraFila(data) {
  if (Array.isArray(data)) return data[0] || null;
  return data || null;
}

export const api = {
  get:  (path)       => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put:  (path, body) => request(path, { method: "PUT", body }),
  del:  (path)       => request(path, { method: "DELETE" }),
};

export function recurso(nombre) {
  return {
    listar:    async ()       => comoLista(await api.get(`/${nombre}`)),
    obtener:   async (id)     => primeraFila(await api.get(`/${nombre}/${id}`)),
    crear:     (body)         => api.post(`/${nombre}`, body),
    actualizar:(id, body)     => api.put(`/${nombre}/${id}`, body),
    eliminar:  (id)           => api.del(`/${nombre}/${id}`),
  };
}
