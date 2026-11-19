using System.Data;
using System.Web.Http;
using WebApi.Models;

namespace WebApi.Controllers
{
    public class ContratoDocumentoController : ApiController
    {
        [Rol(Roles = Permisos.Todos)]
        public DataTable Get(int id)
        {
            if (!Permisos.EsPersonal(User) && !Permisos.ContratosDelCliente(Permisos.IdCliente(User)).Contains(id))
                throw Permisos.SinPermiso();
            ContratoDocumento o = new ContratoDocumento();
            o.IdContrato = id;
            return o.ListarPorId();
        }

        [Rol(Roles = Permisos.Personal)]
        public IHttpActionResult Put(int id, [FromBody] ContratoDocumento value)
        {
            if (value == null || string.IsNullOrWhiteSpace(value.Datos))
                return BadRequest("Cuerpo vacio o invalido");
            try
            {
                // El id manda la ruta, no el cuerpo.
                value.IdContrato = id;
                value.Guardar();
                return Ok();
            }
            catch (System.Exception ex) { return InternalServerError(ex); }
        }
    }
}
