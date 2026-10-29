using System.Data;
using System.Web.Http;
using WebApi.Models;

namespace WebApi.Controllers
{
    public class PagoController : ApiController
    {
        public DataTable Get()
        {
            Pago o = new Pago();
            return o.ListarTodos();
        }

        public DataTable Get(int id)
        {
            Pago o = new Pago();
            o.IdPago = id;
            return o.ListarPorId();
        }

        public IHttpActionResult Post([FromBody] Pago value)
        {
            try
            {
                Pago o = new Pago();
                o.Monto = value.Monto;
                o.Fecha = value.Fecha;
                o.IdContrato = value.IdContrato;
                o.Moneda = value.Moneda ?? "ARS";
                o.Guardar();
                return Ok();
            }
            catch (System.Exception ex) { return InternalServerError(ex); }
        }

        public IHttpActionResult Put(int id, [FromBody] Pago value)
        {
            try
            {
                Pago o = new Pago();
                o.IdPago = id;
                o.Monto = value.Monto;
                o.Fecha = value.Fecha;
                o.IdContrato = value.IdContrato;
                o.Moneda = value.Moneda ?? "ARS";
                o.Editar();
                return Ok();
            }
            catch (System.Exception ex) { return InternalServerError(ex); }
        }

        public IHttpActionResult Delete(int id)
        {
            try
            {
                Pago o = new Pago();
                o.IdPago = id;
                o.Eliminar();
                return Ok();
            }
            catch (System.Exception ex) { return InternalServerError(ex); }
        }
    }
}