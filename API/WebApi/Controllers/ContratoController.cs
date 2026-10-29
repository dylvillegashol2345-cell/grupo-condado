using System.Data;
using System.Web.Http;
using WebApi.Models;

namespace WebApi.Controllers
{
    public class ContratoController : ApiController
    {
        public DataTable Get()
        {
            Contrato o = new Contrato();
            return o.ListarTodos();
        }

        public DataTable Get(int id)
        {
            Contrato o = new Contrato();
            o.IdContrato = id;
            return o.ListarPorId();
        }

        public IHttpActionResult Post([FromBody] Contrato value)
        {
            if (value == null) return BadRequest("Cuerpo vacio o invalido");
            try
            {
                value.Guardar();
                return Ok();
            }
            catch (System.Exception ex) { return InternalServerError(ex); }
        }

        public IHttpActionResult Put(int id, [FromBody] Contrato value)
        {
            if (value == null) return BadRequest("Cuerpo vacio o invalido");
            try
            {
                // El id manda la ruta, no el cuerpo.
                value.IdContrato = id;
                value.Editar();
                return Ok();
            }
            catch (System.Exception ex) { return InternalServerError(ex); }
        }

        public IHttpActionResult Delete(int id)
        {
            try
            {
                Contrato o = new Contrato();
                o.IdContrato = id;
                o.Eliminar();
                return Ok();
            }
            catch (System.Exception ex) { return InternalServerError(ex); }
        }
    }
}
