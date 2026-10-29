const API_URL = "http://localhost:56153/api";

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
  API_URL.replace("/api", "") + ".";

async function request(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(MSG_SIN_API, 0);
  }

  if (!res.ok) {
    throw new ApiError(`La API respondió ${res.status}`, res.status);
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
