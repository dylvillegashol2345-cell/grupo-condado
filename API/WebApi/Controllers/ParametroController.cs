using System;
using System.Collections.Generic;
using System.Data;
using System.Web.Http;
using WebApi.Models;

namespace WebApi.Controllers
{
    public class ParametroController : ApiController
    {
        // GET: api/Parametro — los porcentajes de comisión; los usa también la calculadora de honorarios
        [Rol(Roles = Permisos.Todos)]
        public DataTable Get()
        {
            return new Parametro().ListarTodos();
        }

        // PUT: api/Parametro — solo el Administrador cambia la política de comisiones
        [Rol(Roles = Permisos.Admin)]
        public IHttpActionResult Put([FromBody] List<Parametro> value)
        {
            if (value == null || value.Count == 0) return BadRequest("No llegaron los parámetros.");
            try
            {
                foreach (Parametro p in value) p.Actualizar(Permisos.IdUsuario(User));
                return Ok();
            }
            catch (Exception ex) { return ErroresSql.Respuesta(this, ex); }
        }
    }
}
