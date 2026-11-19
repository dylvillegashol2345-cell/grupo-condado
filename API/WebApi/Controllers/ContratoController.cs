using System.Data;
using System.Web.Http;
using WebApi.Models;

namespace WebApi.Controllers
{
    public class ContratoController : ApiController
    {
        [Rol(Roles = Permisos.Todos)]
        public DataTable Get()
        {
            Contrato o = new Contrato();
            DataTable t = o.ListarTodos();
            if (Permisos.EsPersonal(User)) return t;
            int propio = Permisos.IdCliente(User);
            return Permisos.Filtrar(t, f => propio != 0 && Permisos.Entero(f, "IdCliente") == propio);
        }

        [Rol(Roles = Permisos.Todos)]
        public DataTable Get(int id)
        {
            if (!Permisos.EsPersonal(User) && !Permisos.ContratosDelCliente(Permisos.IdCliente(User)).Contains(id))
                throw Permisos.SinPermiso();
            Contrato o = new Contrato();
            o.IdContrato = id;
            return o.ListarPorId();
        }

        [Rol(Roles = Permisos.Personal)]
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

        [Rol(Roles = Permisos.Personal)]
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

        [Rol(Roles = Permisos.Personal)]
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
