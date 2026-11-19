using System.Data;
using System.Web.Http;
using WebApi.Models;

namespace WebApi.Controllers
{
    public class PagoController : ApiController
    {
        [Rol(Roles = Permisos.Todos)]
        public DataTable Get()
        {
            Pago o = new Pago();
            DataTable t = o.ListarTodos();
            if (Permisos.EsPersonal(User)) return t;
            var propios = Permisos.ContratosDelCliente(Permisos.IdCliente(User));
            return Permisos.Filtrar(t, f => propios.Contains(Permisos.Entero(f, "IdContrato")));
        }

        [Rol(Roles = Permisos.Todos)]
        public DataTable Get(int id)
        {
            Pago o = new Pago();
            o.IdPago = id;
            DataTable t = o.ListarPorId();
            if (Permisos.EsPersonal(User)) return t;
            var propios = Permisos.ContratosDelCliente(Permisos.IdCliente(User));
            foreach (DataRow f in t.Rows)
                if (!propios.Contains(Permisos.Entero(f, "IdContrato"))) throw Permisos.SinPermiso();
            return t;
        }

        [Rol(Roles = Permisos.Personal)]
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
            catch (System.Exception ex) { return ErroresSql.Respuesta(this, ex); }
        }

        [Rol(Roles = Permisos.Personal)]
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
            catch (System.Exception ex) { return ErroresSql.Respuesta(this, ex); }
        }

        [Rol(Roles = Permisos.Personal)]
        public IHttpActionResult Delete(int id)
        {
            try
            {
                Pago o = new Pago();
                o.IdPago = id;
                o.Eliminar();
                return Ok();
            }
            catch (System.Exception ex) { return ErroresSql.Respuesta(this, ex); }
        }
    }
}