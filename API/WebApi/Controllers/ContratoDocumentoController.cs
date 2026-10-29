using System.Data;
using System.Web.Http;
using WebApi.Models;

namespace WebApi.Controllers
{
    public class ContratoDocumentoController : ApiController
    {
        public DataTable Get(int id)
        {
            ContratoDocumento o = new ContratoDocumento();
            o.IdContrato = id;
            return o.ListarPorId();
        }

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
