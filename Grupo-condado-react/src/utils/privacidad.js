export function clienteDelUsuario(clientes, usuario) {
  if (!usuario) return null;
  const email = (usuario.Email || "").toLowerCase().trim();
  const nombreUsuario = (usuario.NombreUsuario || "").toLowerCase().trim();

  const emailDe = (c) => (c.Email || "").toLowerCase().trim();

  return (email && clientes.find((c) => emailDe(c) === email))
    || (nombreUsuario && clientes.find((c) => emailDe(c).startsWith(nombreUsuario)))
    || null;
}

export function pagosDelCliente(pagos, contratosPropios) {
  const ids = new Set(contratosPropios.map((c) => Number(c.IdContrato)));
  return pagos.filter((p) => ids.has(Number(p.IdContrato)));
}
