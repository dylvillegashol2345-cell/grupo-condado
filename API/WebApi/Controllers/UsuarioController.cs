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
        public DataTable Get()
        {
            Usuario oUsuario = new Usuario();
            return oUsuario.ListarTodos();
        }

        // GET: api/Usuario/5
        public DataTable Get(int id)
        {
            Usuario oUsuario = new Usuario();
            oUsuario.IdUsuario = id;
            return oUsuario.ListarPorId();
        }

        // POST: api/Usuario  — registro nuevo (siempre rol Cliente = 3)
        // También usado por Admin para crear usuarios con rol específico
        public IHttpActionResult Post([FromBody] Usuario value)
        {
            Usuario oUsuario = new Usuario();
            oUsuario.Nombre = value.Nombre;
            oUsuario.Email = value.Email;
            oUsuario.Telefono = value.Telefono;
            oUsuario.Contrasena = value.Contrasena;
            // Si viene IdRol 0 o no viene, asignar Cliente (3) por defecto
            oUsuario.IdRol = (value.IdRol > 0) ? value.IdRol : 3;

            string resultado = oUsuario.Guardar();

            if (resultado == "EMAIL_DUPLICADO")
                return Content(HttpStatusCode.Conflict, "EMAIL_DUPLICADO");

            if (resultado != "OK")
                return InternalServerError(new Exception(resultado));

            return Ok();
        }

        // PUT: api/Usuario/5
        public void Put(int id, [FromBody] Usuario value)
        {
            Usuario oUsuario = new Usuario();
            oUsuario.IdUsuario = value.IdUsuario;
            oUsuario.Nombre = value.Nombre;
            oUsuario.IdRol = value.IdRol;
            oUsuario.Email = value.Email;
            oUsuario.Contrasena = value.Contrasena;

            oUsuario.Editar();
        }

        // DELETE: api/Usuario/5
        public void Delete(int id)
        {
            Usuario oUsuario = new Usuario();
            oUsuario.IdUsuario = id;
            oUsuario.Eliminar();
        }
    }
}