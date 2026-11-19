using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

using System.Data;
using WebApi.Models;


namespace WebApi.Controllers
{
    public class UsuarioController : ApiController
    {
        // GET: api/Usuario
        // El Agente necesita la lista para elegir el agente de una cita u operación
        [Rol(Roles = Permisos.Todos)]
        public DataTable Get()
        {
            Usuario oUsuario = new Usuario();
            DataTable t = oUsuario.ListarTodos();
            if (Permisos.EsPersonal(User)) return t;
            int yo = Permisos.IdUsuario(User);
            return Permisos.Filtrar(t, f => Permisos.Entero(f, "IdUsuario") == yo);
        }

        // GET: api/Usuario/5
        [Rol(Roles = Permisos.Todos)]
        public DataTable Get(int id)
        {
            if (!Permisos.EsPersonal(User) && Permisos.IdUsuario(User) != id) throw Permisos.SinPermiso();
            Usuario oUsuario = new Usuario();
            oUsuario.IdUsuario = id;
            return oUsuario.ListarPorId();
        }

        // POST: api/Usuario  — registro nuevo (siempre rol Cliente = 3)
        // También usado por Admin para crear usuarios con rol específico
        [AllowAnonymous]
        public IHttpActionResult Post([FromBody] Usuario value)
        {
            Usuario oUsuario = new Usuario();
            oUsuario.Nombre = value.Nombre;
            oUsuario.Email = value.Email;
            oUsuario.Telefono = value.Telefono;
            oUsuario.Contrasena = value.Contrasena;
            // Si viene IdRol 0 o no viene, asignar Cliente (3) por defecto
            // Solo el Administrador elige el rol; el registro público siempre crea un Cliente
            oUsuario.IdRol = (Permisos.EsAdmin(User) && value.IdRol > 0) ? value.IdRol : 3;

            string resultado = oUsuario.Guardar();

            if (resultado == "EMAIL_DUPLICADO")
                return Content(HttpStatusCode.Conflict, "EMAIL_DUPLICADO");

            if (resultado != "OK")
                return InternalServerError(new Exception(resultado));

            return Ok();
        }

        // PUT: api/Usuario/5
        [Rol(Roles = Permisos.Todos)]
        public void Put(int id, [FromBody] Usuario value)
        {
            bool admin = Permisos.EsAdmin(User);
            if (!admin && Permisos.IdUsuario(User) != id) throw Permisos.SinPermiso();
            Usuario oUsuario = new Usuario();
            oUsuario.IdUsuario = id;
            oUsuario.Nombre = value.Nombre;
            oUsuario.IdRol = value.IdRol;
            if (!admin)
            {
                // Desde "Mi perfil" no se puede cambiar el propio rol
                DataTable actual = oUsuario.ListarPorId();
                oUsuario.IdRol = actual.Rows.Count > 0 ? Permisos.Entero(actual.Rows[0], "IdRol") : 3;
            }
            oUsuario.Email = value.Email;
            oUsuario.Contrasena = value.Contrasena;

            oUsuario.Editar();
        }

        // DELETE: api/Usuario/5
        [Rol(Roles = Permisos.Admin)]
        public void Delete(int id)
        {
            Usuario oUsuario = new Usuario();
            oUsuario.IdUsuario = id;
            oUsuario.Eliminar();
        }
    }
}