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
            if (string.IsNullOrEmpty(value.Contrasena) || value.Contrasena.Length < 6)
                return BadRequest("La contraseña debe tener al menos 6 caracteres");
            // El hash lo calcula la API; la base recibe solo el texto PBKDF2$...
            oUsuario.Contrasena = Contrasenas.Hashear(value.Contrasena);
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
            // Solo el Administrador puede poner una contraseña nueva por acá (restablecerla);
            // cada usuario cambia la suya con POST api/Usuario/Contrasena, que pide la actual
            bool cambia = admin && !string.IsNullOrEmpty(value.Contrasena) && value.Contrasena != "___NOCHANGE___";
            oUsuario.Contrasena = cambia ? Contrasenas.Hashear(value.Contrasena) : "___NOCHANGE___";

            oUsuario.Editar();
        }

        // DELETE: api/Usuario/5
        public class CambioContrasena
        {
            public string Actual { get; set; }
            public string Nueva { get; set; }
        }

        // POST: api/Usuario/Contrasena — "Mi perfil": verifica la actual en el servidor
        [Rol(Roles = Permisos.Todos)]
        [HttpPost]
        [Route("api/Usuario/Contrasena")]
        public IHttpActionResult CambiarContrasena([FromBody] CambioContrasena value)
        {
            if (value == null || string.IsNullOrEmpty(value.Nueva) || value.Nueva.Length < 6)
                return BadRequest("La contraseña nueva debe tener al menos 6 caracteres");
            int yo = Permisos.IdUsuario(User);
            Usuario oUsuario = new Usuario();
            if (!oUsuario.VerificarContrasena(yo, value.Actual))
                return BadRequest("La contraseña actual es incorrecta");
            oUsuario.ActualizarContrasena(yo, Contrasenas.Hashear(value.Nueva));
            return Ok();
        }

        [Rol(Roles = Permisos.Admin)]
        public void Delete(int id)
        {
            Usuario oUsuario = new Usuario();
            oUsuario.IdUsuario = id;
            oUsuario.Eliminar();
        }
    }
}